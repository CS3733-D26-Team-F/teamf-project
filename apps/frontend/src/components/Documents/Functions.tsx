/* Functions that are reused often in the Documents.tsx Page */

export function getExt(url: string) {
    return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

export function getFileType(url: string) {
    const ext = getExt(url).toUpperCase();
    if (!ext || !['PDF', 'DOCX', 'DOC', 'XLSX', 'XLS', 'CSV', 'PPTX', 'PPT', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'TXT'].includes(ext)) {
        return 'Link';
    }
    return ext;
}

export function normalizeUrl(input: string): string {
    if (!input) return input;
    if (!/^https?:\/\//i.test(input)) {
        return `https://${input}`;
    }
    return input;
}