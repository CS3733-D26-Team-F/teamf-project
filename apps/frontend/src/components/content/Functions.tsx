/* Functions that are reused often in the content.tsx Page */

export function getExt(url: string) {
    return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

export function getFileType(url: string) {
    const normalized = url.trim();
    
    // Extract file extension first
    const ext = getExt(normalized).trim().toUpperCase();
    
    // Known file extensions
    const knownFileExts = new Set([
        'PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'CSV', 'TXT', 'PNG', 'JPG', 'JPEG', 
        'GIF', 'BMP', 'TIFF', 'TIF', 'SVG', 'WEBP', 'PPT', 'PPTX', 'ZIP', 'RAR', 
        'JSON', 'XML', 'HTML', 'HTM', 'MP3', 'MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'M4A', 'M4V'
    ]);
    
    // If it has a known file extension, return it
    if (ext && knownFileExts.has(ext)) {
        return ext;
    }
    
    // Check if it's a website URL by common TLDs
    const websitePattern = /^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(com|edu|org|net|gov|mil|io|co|us|uk|ca|de|fr|au|in)(?:[\\/\?#]|$)/i;
    
    if (websitePattern.test(normalized)) {
        return 'LINK';
    }
    
    // Default to unknown extension or Link
    return ext || 'LINK';
}



export function normalizeUrl(input: string): string {
    if (!input) return input;
    if (!/^https?:\/\//i.test(input)) {
        return `https://${input}`;
    }
    return input;
}

