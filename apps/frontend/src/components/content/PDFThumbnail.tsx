import {useEffect, useRef, useState} from "react";
import * as pdfjs from "pdfjs-dist";

export function PdfThumbnail({ url }: { url: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const loadingTask = pdfjs.getDocument({url, withCredentials: false});
                const pdf = await loadingTask.promise;
                if (cancelled) return;
                const page = await pdf.getPage(1);
                if (cancelled) return;
                const canvas = canvasRef.current;
                if (!canvas) return;

                const viewport = page.getViewport({scale: 1});
                const containerW = canvas.parentElement?.offsetWidth ?? 200;
                const maxHeight = 300;

                const scaleByWidth = containerW / viewport.width;
                const scaleByHeight = maxHeight / viewport.height;
                const scale = Math.max(scaleByWidth, scaleByHeight);
                const scaled = page.getViewport({scale});
                canvas.width = scaled.width;
                canvas.height = scaled.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                await page.render({canvasContext: ctx, viewport: scaled, canvas: canvas}).promise;
                if (!cancelled) setStatus('done');
            } catch {
                if (!cancelled) setStatus('error');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [url]);
    return <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
}
