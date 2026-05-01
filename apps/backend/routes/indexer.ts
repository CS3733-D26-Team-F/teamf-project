import { prisma } from '../setup/prisma.js';
import { Mistral } from '@mistralai/mistralai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

const CHUNK_SIZE = 400;       // words per chunk
const CHUNK_OVERLAP = 50;     // words overlap between chunks
const EMBEDDING_BATCH = 8;    // chunks to embed per API call

// FILE TYPE DETECTION
function getExtension(url: string): string {
    const clean = url.split('?')[0];
    return clean.split('.').pop()?.toLowerCase() ?? '';
}

function isIndexable(url: string): boolean {
    const ext = getExtension(url);
    return ['pdf', 'docx', 'pptx', 'txt', 'md', 'csv'].includes(ext);
}

// TEXT EXTRACTION
async function extractText(buffer: Buffer, ext: string): Promise<string> {
    try {
        switch (ext) {
            case 'pdf': {
                const pdfModule = require('pdf-parse');

                if (pdfModule.PDFParse) {
                    const parser = new pdfModule.PDFParse({ data: buffer });

                    const textResult = await parser.getText();

                    if (typeof parser.destroy === 'function') {
                        await parser.destroy();
                    }

                    return typeof textResult === 'string' ? textResult : textResult.text;
                }

                const pdfParse = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
                const result = await pdfParse(buffer);
                return result.text;
            }
            case 'docx': {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                return result.value;
            }
            case 'pptx': {
                const officeModule = require('officeparser');
                const officeparser = officeModule.default || officeModule;

                const fs = require('fs');
                const os = require('os');
                const path = require('path');

                const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}.pptx`);
                fs.writeFileSync(tempPath, buffer);

                try {
                    if (typeof officeparser.parseOffice === 'function') {
                        const ast = await officeparser.parseOffice(tempPath, { outputErrorToConsole: false });
                        return ast.toText();
                    }
                    return await officeparser.parseOfficeAsync(tempPath, { outputErrorToConsole: false });
                } finally {
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                }
            }
            case 'txt':
            case 'md':
            case 'csv': {
                return buffer.toString('utf-8');
            }
            default:
                return '';
        }
    } catch (err) {
        console.error(`[indexer] Text extraction failed for .${ext}:`, err);
        return '';
    }
}

// CHUNKING
function chunkText(text: string): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
        const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');
        if (chunk.trim().length > 20) {  // skip tiny chunks
            chunks.push(chunk);
        }
        i += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH) {
        const batch = chunks.slice(i, i + EMBEDDING_BATCH);
        try {
            const response = await mistral.embeddings.create({
                model: 'mistral-embed',
                inputs: batch,
            });
            embeddings.push(...response.data.map((d: any) => d.embedding));
        } catch (err) {
            console.error(`[indexer] Embedding batch ${i / EMBEDDING_BATCH} failed:`, err);
            embeddings.push(...batch.map(() => new Array(1024).fill(0)));
        }
    }

    return embeddings;
}

// MAIN INDEXING FUNCTION
export async function indexDocument(contentformId: number): Promise<{ success: boolean; chunks?: number; error?: string }> {
    try {
        const doc = await prisma.contentform.findUnique({
            where: { id: contentformId },
            select: { id: true, name: true, url: true, is_deleted: true }
        });

        if (!doc) return { success: false, error: 'Document not found' };
        if (doc.is_deleted) {
            await prisma.$executeRawUnsafe(
                'DELETE FROM document_chunks WHERE contentform_id = $1',
                contentformId
            );
            return { success: true, chunks: 0 };
        }

        const ext = getExtension(doc.url);
        if (!isIndexable(doc.url)) {
            console.log(`[indexer] Skipping non-indexable file: ${doc.name} (.${ext})`);
            return { success: true, chunks: 0 };
        }

        console.log(`[indexer] Indexing: ${doc.name} (.${ext})`);

        const fetchUrl = doc.url.split('?')[0]; // strip cache-bust param
        const fileRes = await fetch(fetchUrl);
        if (!fileRes.ok) {
            return { success: false, error: `Failed to fetch file: ${fileRes.status}` };
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const text = await extractText(buffer, ext);
        if (!text.trim()) {
            console.log(`[indexer] No text extracted from ${doc.name} — may be a scanned image`);
            return { success: true, chunks: 0 };
        }

        const chunks = chunkText(text);
        if (chunks.length === 0) return { success: true, chunks: 0 };
        const embeddings = await embedChunks(chunks);
        await prisma.$executeRawUnsafe(
            'DELETE FROM document_chunks WHERE contentform_id = $1',
            contentformId
        );

        for (let i = 0; i < chunks.length; i++) {
            const embedding = embeddings[i];
            await prisma.$executeRawUnsafe(
                `INSERT INTO document_chunks (contentform_id, chunk_index, content, embedding)
                 VALUES ($1, $2, $3, $4::vector)`,
                contentformId,
                i,
                chunks[i],
                JSON.stringify(embedding)
            );
        }

        console.log(`[indexer] Indexed ${chunks.length} chunks for: ${doc.name}`);
        return { success: true, chunks: chunks.length };

    } catch (err: any) {
        console.error(`[indexer] Failed to index document ${contentformId}:`, err);
        return { success: false, error: err.message };
    }
}

// REMOVE DOCUMENT FROM INDEX
export async function removeDocumentFromIndex(contentformId: number): Promise<void> {
    try {
        await prisma.$executeRawUnsafe(
            'DELETE FROM document_chunks WHERE contentform_id = $1',
            contentformId
        );
        console.log(`[indexer] Removed chunks for document ${contentformId}`);
    } catch (err) {
        console.error(`[indexer] Failed to remove chunks for document ${contentformId}:`, err);
    }
}

// BULK REINDEX ALL DOCUMENTS
// Run this once to index existing documents.
// Call via: POST /api/admin/reindex (see search.ts)
export async function reindexAll(): Promise<{ total: number; indexed: number; skipped: number; failed: number }> {
    const docs = await prisma.contentform.findMany({
        where: { is_deleted: false },
        select: { id: true, name: true, url: true }
    });

    let indexed = 0, skipped = 0, failed = 0;

    for (const doc of docs) {
        if (!isIndexable(doc.url)) {
            skipped++;
            continue;
        }
        const result = await indexDocument(doc.id);
        if (!result.success) failed++;
        else if ((result.chunks ?? 0) === 0) skipped++;
        else indexed++;

        // small delay to avoid hammering Mistral API
        await new Promise(r => setTimeout(r, 200));
    }

    return { total: docs.length, indexed, skipped, failed };
}

// HYBRID SEARCH — exact keyword match + semantic similarity
// Exact matches are ranked first, then semantic results fill in the rest.
export async function semanticSearch(
    query: string,
    userPersona: string,
    limit = 5
): Promise<Array<{
    contentformId: number;
    docName: string;
    docUrl: string;
    chunkIndex: number;
    content: string;
    similarity: number;
    matchType: 'exact' | 'semantic';
    highlightRanges?: Array<{ start: number; end: number }>;
}>> {
    try {
        // EXACT KEYWORD SEARCH
        const personaFilter = userPersona === 'Admin'
            ? ''
            : `AND cf.persona::text[] && ARRAY[$3]::text[]`;

        const exactParams: any[] = userPersona === 'Admin'
            ? [`%${query}%`, limit * 2]
            : [`%${query}%`, limit * 2, userPersona];

        const exactResults: any[] = await prisma.$queryRawUnsafe(
            `SELECT
                dc.contentform_id,
                dc.chunk_index,
                dc.content,
                cf.name AS doc_name,
                cf.url AS doc_url,
                1.0 AS similarity
             FROM document_chunks dc
             JOIN contentform cf ON cf.id = dc.contentform_id
             WHERE cf.is_deleted = false
             AND LOWER(dc.content) LIKE LOWER($1)
             ${personaFilter}
             ORDER BY cf.name ASC, dc.chunk_index ASC
             LIMIT $2`,
            ...exactParams
        );

        // SEMANTIC SEARCH
        const response = await mistral.embeddings.create({
            model: 'mistral-embed',
            inputs: [query],
        });
        const queryEmbedding = response.data[0].embedding;

        const semanticParams: any[] = userPersona === 'Admin'
            ? [JSON.stringify(queryEmbedding), limit * 2]
            : [JSON.stringify(queryEmbedding), userPersona, limit * 2];

        const semanticQuery = userPersona === 'Admin'
            ? `SELECT
                dc.contentform_id,
                dc.chunk_index,
                dc.content,
                cf.name AS doc_name,
                cf.url AS doc_url,
                1 - (dc.embedding <=> $1::vector) AS similarity
               FROM document_chunks dc
               JOIN contentform cf ON cf.id = dc.contentform_id
               WHERE cf.is_deleted = false
               ORDER BY dc.embedding <=> $1::vector
               LIMIT $2`
            : `SELECT
                dc.contentform_id,
                dc.chunk_index,
                dc.content,
                cf.name AS doc_name,
                cf.url AS doc_url,
                1 - (dc.embedding <=> $1::vector) AS similarity
               FROM document_chunks dc
               JOIN contentform cf ON cf.id = dc.contentform_id
               WHERE cf.is_deleted = false
               AND cf.persona::text[] && ARRAY[$2]::text[]
               ORDER BY dc.embedding <=> $1::vector
               LIMIT $3`;

        const semanticResults: any[] = await prisma.$queryRawUnsafe(
            semanticQuery,
            ...semanticParams
        );

        // HIGHLIGHT HELPER
        function getHighlightRanges(
            content: string,
            query: string
        ): Array<{ start: number; end: number }> {
            const ranges: Array<{ start: number; end: number }> = [];
            const lowerContent = content.toLowerCase();
            const lowerQuery = query.toLowerCase();
            let idx = 0;
            while (idx < lowerContent.length) {
                const pos = lowerContent.indexOf(lowerQuery, idx);
                if (pos === -1) break;
                ranges.push({ start: pos, end: pos + query.length });
                idx = pos + 1;
            }
            return ranges;
        }

        // 4. MERGE — exact first, then semantic deduped
        const seen = new Set<string>(); // contentformId-chunkIndex

        const exactMapped = exactResults.map(r => {
            const key = `${r.contentform_id}-${r.chunk_index}`;
            seen.add(key);
            return {
                contentformId: r.contentform_id,
                docName: r.doc_name,
                docUrl: r.doc_url,
                chunkIndex: r.chunk_index,
                content: r.content,
                similarity: 1.0,
                matchType: 'exact' as const,
                highlightRanges: getHighlightRanges(r.content, query)
            };
        });

        const semanticMapped = semanticResults
            .filter(r => {
                const key = `${r.contentform_id}-${r.chunk_index}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map(r => ({
                contentformId: r.contentform_id,
                docName: r.doc_name,
                docUrl: r.doc_url,
                chunkIndex: r.chunk_index,
                content: r.content,
                similarity: parseFloat(r.similarity),
                matchType: 'semantic' as const,
                highlightRanges: [] as Array<{ start: number; end: number }>
            }));

        return [...exactMapped, ...semanticMapped].slice(0, limit);

    } catch (err) {
        console.error('[indexer] Hybrid search failed:', err);
        return [];
    }
}