import { Router } from 'express';
import { checkJWT } from '../setup/auth0.js';
import { prisma } from '../setup/prisma.js';
import { semanticSearch, reindexAll } from './indexer.js';

const router = Router();

// Returns top matching chunks with highlighted snippets.
router.get('/search/semantic', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!query || query.length < 2) {
        return res.json({ results: [] });
    }

    try {
        const employee = await prisma.employee.findUnique({
            where: { auth0Id },
            select: { persona: true }
        });

        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const userPersona = employee.persona ?? 'Guest';

        // 1. STANDARD TITLE SEARCH (Exact/Partial Match)
        const titleMatches = await prisma.contentform.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                is_deleted: false,
            },
            take: 3
        });

        const formattedTitleMatches = titleMatches.map(doc => ({
            contentformId: doc.id,
            docName: doc.name,
            docUrl: doc.url,
            snippet: { before: `Found match in document title: ${doc.name}`, match: '', after: '' },
            similarity: 0
        }));

        // 2. RAG SEMANTIC SEARCH (Content Match)
        const results = await semanticSearch(query, userPersona, 50);

        const formattedSemanticMatches = results.map(r => {
            const snippet = buildSnippet(r.content, query);
            return {
                contentformId: r.contentformId,
                docName: r.docName,
                docUrl: r.docUrl,
                snippet,
                similarity: r.similarity
            };
        });

        // 3. MERGE AND DEDUPLICATE
        const combined = [...formattedTitleMatches, ...formattedSemanticMatches];
        const seen = new Set<number>();
        const deduped = combined.filter(r => {
            if (seen.has(r.contentformId)) return false;
            seen.add(r.contentformId);
            return true;
        }).slice(0,8);

        return res.json({ results: deduped });
    } catch (err) {
        console.error('[search] Semantic search error:', err);
        return res.status(500).json({ error: 'Search failed' });
    }
});

// Admin only — reindexes all documents.
// Run once after initial setup.
router.post('/api/admin/reindex', checkJWT, async (req, res) => {
    const auth0Id = req.auth!.payload.sub as string;

    const employee = await prisma.employee.findUnique({
        where: { auth0Id },
        select: { persona: true }
    });

    if (!employee || employee.persona !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    res.json({ message: 'Reindexing started. Check server logs for progress.' });

    reindexAll().then(stats => {
        console.log('[search] Reindex complete:', stats);
    }).catch(err => {
        console.error('[search] Reindex failed:', err);
    });
});

// HELPER: build a highlighted snippet
// Finds the query phrase in the chunk and returns ~150 chars of surrounding context with the match marked.
function buildSnippet(content: string, query: string): { before: string; match: string; after: string } {
    const lower = content.toLowerCase();
    const queryLower = query.toLowerCase();

    const idx = lower.indexOf(queryLower);

    if (idx === -1) {
        const truncated = content.slice(0, 200).trim();
        return { before: truncated, match: '', after: '' };
    }

    const matchEnd = idx + query.length;
    const contextRadius = 80;

    const start = Math.max(0, idx - contextRadius);
    const end = Math.min(content.length, matchEnd + contextRadius);

    const before = (start > 0 ? '...' : '') + content.slice(start, idx);
    const match = content.slice(idx, matchEnd);
    const after = content.slice(matchEnd, end) + (end < content.length ? '...' : '');

    return { before, match, after };
}

export default router;