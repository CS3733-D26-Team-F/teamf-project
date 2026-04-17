import type {JSX} from "react";

const officeMeta: Record<string, { bg: string; color: string; label: string }> = {
    pdf:  { bg: '#e3f0ff', color: 'var(--color-sapphire)', label: 'PDF'  },
    docx: { bg: '#d8e9ff', color: 'var(--color-yale-blue)', label: 'DOCX' },
    doc:  { bg: '#d8e9ff', color: 'var(--color-yale-blue)', label: 'DOC'  },
    xlsx: { bg: '#e0f7ff', color: 'var(--color-fresh-sky)', label: 'XLSX' },
    xls:  { bg: '#e0f7ff', color: 'var(--color-fresh-sky)', label: 'XLS'  },
    csv:  { bg: '#e6faff', color: 'var(--color-fresh-sky-light)', label: 'CSV'  },
    pptx: { bg: '#f0f6ff', color: 'var(--color-sapphire-light)', label: 'PPTX' },
    ppt:  { bg: '#f0f6ff', color: 'var(--color-sapphire-light)', label: 'PPT'  },
};

const THUMBNAIL_H = 140;

type OfficePlaceholderProps = {
    ext: string;
}

export function OfficePlaceholder(props: OfficePlaceholderProps): JSX.Element {
    const info = officeMeta[props.ext] ?? { bg: '#f5f5f5', color: '#888', label: props.ext.toUpperCase() || 'FILE' };
    return (
        <div style={{
            width: '100%', height: THUMBNAIL_H, background: info.bg,
            borderRadius: '8px 8px 0 0', borderBottom: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, userSelect: 'none',
            overflow: 'hidden', position: 'relative',
        }}>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '12px 16px', gap: 5, opacity: 0.22,
            }}>
                {[90, 70, 85, 60, 75, 55].map((w, i) => (
                    <div key={i} style={{ height: 4, width: `${w}%`, background: info.color, borderRadius: 2 }} />
                ))}
            </div>
            <div style={{
                background: info.color, color: 'white', fontWeight: 800,
                fontSize: 13, letterSpacing: 1.5, padding: '4px 12px',
                borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.18)', zIndex: 1,
            }}>{info.label}</div>
        </div>
    );
}