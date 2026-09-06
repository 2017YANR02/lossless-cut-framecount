import { useEffect, useRef, useState } from 'react';

const initialZoom = { scale: 1, x: 0, y: 0 };

export function zoomAtPoint(previous: typeof initialZoom, delta: number, x: number, y: number) {
  if (![delta, x, y].every((value) => Number.isFinite(value)) || delta === 0) return previous;
  const scale = Math.min(8, Math.max(1, previous.scale * Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.002)));
  const ratio = scale / previous.scale;
  return {
    scale,
    x: Math.min(0, Math.max(1 - scale, x - (x - previous.x) * ratio)),
    y: Math.min(0, Math.max(1 - scale, y - (y - previous.y) * ratio)),
  };
}

export default function useVideoZoom(filePath: string | undefined) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ ...initialZoom, filePath });

  if (zoom.filePath !== filePath) setZoom({ ...initialZoom, filePath });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport == null || filePath == null) return undefined;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const bounds = viewport.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      const unit = event.deltaMode === 1 ? 40 : (event.deltaMode === 2 ? bounds.height : 1);
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      setZoom((previous) => ({ ...zoomAtPoint(previous, event.deltaY * unit, x, y), filePath }));
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [filePath]);

  return {
    viewportRef,
    transform: `translate(${zoom.x * 100}%, ${zoom.y * 100}%) scale(${zoom.scale})`,
  };
}
