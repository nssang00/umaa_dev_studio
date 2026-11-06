import { useEffect, useMemo, useRef, useState } from 'react';
import { fitStudioPanes, resizeStudioPane, STUDIO_PANE_LIMITS } from '../../logic/studioLayout.js';

const STORAGE_KEY = 'umaa.studio.pane-widths.v1';
function readSavedWidths() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

/** Layout-only composition component: pane contents are passed in, never imported. */
export function StudioShell({ explorer, workbench, properties, bottomPanel }) {
  const shellRef = useRef(null);
  const dragRef = useRef(null);
  const [preferred, setPreferred] = useState(readSavedWidths);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const widths = useMemo(() => fitStudioPanes(viewportWidth, preferred), [viewportWidth, preferred]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const update = () => setViewportWidth(shell.getBoundingClientRect().width);
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(shell);
    if (!observer) window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferred)); } catch { /* optional preference */ }
  }, [preferred]);

  const startDrag = (side, event) => {
    if (event.button !== 0) return;
    dragRef.current = { side, pointerId: event.pointerId, startX: event.clientX, initialWidths: widths };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  const moveDrag = (side, event) => {
    const active = dragRef.current;
    if (!active || active.side !== side || active.pointerId !== event.pointerId) return;
    const direction = side === 'explorer' ? 1 : -1;
    const requested = active.initialWidths[side] + direction * (event.clientX - active.startX);
    setPreferred(resizeStudioPane(viewportWidth, active.initialWidths, side, requested));
  };
  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleKey = (side, event) => {
    const direction = side === 'explorer' ? 1 : -1;
    let requested;
    if (event.key === 'Home') requested = STUDIO_PANE_LIMITS[side].min;
    else if (event.key === 'End') requested = STUDIO_PANE_LIMITS[side].max;
    else if (event.key === 'ArrowLeft') requested = widths[side] - 16 * direction;
    else if (event.key === 'ArrowRight') requested = widths[side] + 16 * direction;
    else return;
    event.preventDefault();
    setPreferred(resizeStudioPane(viewportWidth, widths, side, requested));
  };
  const splitter = (side) => {
    const limits = STUDIO_PANE_LIMITS[side];
    const other = side === 'explorer' ? 'properties' : 'explorer';
    const max = Math.max(limits.min, Math.min(limits.max, viewportWidth - STUDIO_PANE_LIMITS.workbenchMin - 2 * STUDIO_PANE_LIMITS.splitterWidth - widths[other]));
    return <div
      className="studio-splitter" role="separator" tabIndex={0}
      aria-label={`${side === 'explorer' ? 'Explorer' : 'Properties'} 너비 조절`}
      aria-controls={`studio-${side}`} aria-orientation="vertical"
      aria-valuemin={limits.min} aria-valuemax={max} aria-valuenow={widths[side]}
      onPointerDown={(event) => startDrag(side, event)}
      onPointerMove={(event) => moveDrag(side, event)}
      onPointerUp={endDrag} onPointerCancel={endDrag}
      onKeyDown={(event) => handleKey(side, event)}
    />;
  };

  return <div ref={shellRef} className="main-layout studio-shell-layout" style={{ '--explorer-width': `${widths.explorer}px`, '--properties-width': `${widths.properties}px` }}>
    <aside id="studio-explorer" className="side-pane left-pane studio-side-pane" aria-label="Explorer">{explorer}</aside>
    {splitter('explorer')}
    <main className="workspace-pane studio-main-pane" aria-label="Main Workbench">
      <div className="workspace-editor-body">{workbench}</div>
      <div className="workspace-bottom">{bottomPanel}</div>
    </main>
    {splitter('properties')}
    <aside id="studio-properties" className="side-pane right-pane studio-side-pane" aria-label="Properties">{properties}</aside>
  </div>;
}
