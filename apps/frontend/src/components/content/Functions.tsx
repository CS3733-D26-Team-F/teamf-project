export function getExt(url: string) {
    return url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}