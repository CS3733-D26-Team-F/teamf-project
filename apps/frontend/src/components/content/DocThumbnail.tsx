//
//
// export function DocThumbnail({ url }: { url: string }) {
//     const ext = getExt(url);
//     if (ext === 'pdf') return <PdfThumbnail url={url} />;
//     if (imageExts.has(ext)) {
//         return (
//             <div style={{ width: '100%', height: THUMBNAIL_H, borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', background: '#f0f0f0' }}>
//                 <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
//                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
//             </div>
//         );
//     }
//     return <OfficePlaceholder ext={ext} />;
// }