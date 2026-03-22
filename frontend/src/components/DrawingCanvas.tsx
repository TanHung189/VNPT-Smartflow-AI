import React, { useRef, useEffect } from "react";

type Stroke = { id?: string; points: number[]; color: string; size: number };

const DrawingCanvas = ({
  active,
  color = "#6366f1",
  size = 4,
  mode,
  strokes = [],
  onAddStroke,
  onEraseAt,
  screenToFlowPosition,
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const current: number[] = [];

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
  };

  const originalParent = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // On mount: append canvas into the react-flow viewport and do not move it back on deactivation.
    const canvas = canvasRef.current;
    if (!canvas) return;

    const attachToViewport = () => {
      const viewport = document.querySelector<HTMLElement>(
        ".react-flow__viewport",
      );
      if (!viewport) return false;
      // remember original parent for debugging but do not restore on unmount
      if (!originalParent.current)
        originalParent.current = canvas.parentElement as HTMLElement;
      // style the canvas so it covers the viewport area
      canvas.style.position = "absolute";
      canvas.style.left = "0";
      canvas.style.top = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "999";
      // append only if not already a child
      if (canvas.parentElement !== viewport) viewport.appendChild(canvas);
      return true;
    };

    // Try immediate attach; if viewport isn't ready, set up a MutationObserver
    if (!attachToViewport()) {
      const mo = new MutationObserver(() => {
        if (attachToViewport()) mo.disconnect();
      });
      mo.observe(document.body, { childList: true, subtree: true });
      // also disconnect on unmount
      return () => mo.disconnect();
    }

    // trigger initial resize after moving
    resizeCanvas();

    // keep observer to detect viewport replacements and re-attach if needed
    const mo = new MutationObserver(() => attachToViewport());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
    // run on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pointer-events and cursor when active/mode changes without moving the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.pointerEvents = active ? "auto" : "none";
    try {
      canvas.style.cursor = active
        ? mode === "eraser"
          ? "cell"
          : "crosshair"
        : "default";
    } catch (e) {}
  }, [active, mode]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // clear using CSS pixels
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    strokes.forEach((s: Stroke) => {
      ctx.beginPath();
      ctx.lineWidth = s.size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = s.color;
      // s.points are stored in flow coordinates (same coordinate space as nodes)
      for (let i = 0; i < s.points.length; i += 2) {
        const x = s.points[i];
        const y = s.points[i + 1];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  };

  // We store points as client coordinates and compute local canvas coords in redraw/live draw

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointerDown = (ev: PointerEvent) => {
      if (!active) return;
      const flowPoint =
        typeof screenToFlowPosition === "function"
          ? screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
          : null;
      if (mode === "eraser") {
        // immediate erase at pointer (flow coords when possible)
        if (flowPoint) onEraseAt?.(flowPoint.x, flowPoint.y, size);
        else onEraseAt?.(ev.clientX, ev.clientY, size);
        return;
      }
      drawing.current = true;
      (canvas as any).setPointerCapture(ev.pointerId);
      // show grabbing cursor while drawing
      try {
        (canvas as HTMLCanvasElement).style.cursor = "grabbing";
      } catch (e) {}
      // store flow coords (or fallback to client coords)
      if (flowPoint) current.push(flowPoint.x, flowPoint.y);
      else current.push(ev.clientX, ev.clientY);
    };

    const pointerMove = (ev: PointerEvent) => {
      if (!active) return;
      const flowPoint =
        typeof screenToFlowPosition === "function"
          ? screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
          : null;
      if (mode === "eraser") {
        if (flowPoint) onEraseAt?.(flowPoint.x, flowPoint.y, size);
        else onEraseAt?.(ev.clientX, ev.clientY, size);
        return;
      }
      if (!drawing.current) return;
      // append flow coords (or fallback to client coords)
      if (flowPoint) current.push(flowPoint.x, flowPoint.y);
      else current.push(ev.clientX, ev.clientY);
      // draw live
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      redraw();
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      for (let i = 0; i < current.length; i += 2) {
        const x = current[i];
        const y = current[i + 1];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const pointerUp = (ev: PointerEvent) => {
      if (!active) return;
      if (!drawing.current) return;
      drawing.current = false;
      // restore cursor to pen after finishing stroke
      try {
        (canvasRef.current as HTMLCanvasElement).style.cursor =
          mode === "eraser" ? "cell" : "crosshair";
      } catch (e) {}

      if (current.length >= 4) {
        // pass flow coordinates upward (we converted during capture when possible)
        onAddStroke?.(current.slice(), color, size);
      }
      current.splice(0, current.length);
    };

    canvas.addEventListener("pointerdown", pointerDown as any);
    window.addEventListener("pointermove", pointerMove as any);
    window.addEventListener("pointerup", pointerUp as any);

    return () => {
      canvas.removeEventListener("pointerdown", pointerDown as any);
      window.removeEventListener("pointermove", pointerMove as any);
      window.removeEventListener("pointerup", pointerUp as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, color, size, strokes, onAddStroke, onEraseAt]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${active ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default DrawingCanvas;
