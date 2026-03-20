import React, { useRef, useEffect, useState } from "react";

type Stroke = { points: number[]; color: string; size: number };

const DrawingCanvas = ({ active, color = "#6366f1", size = 4, mode }: any) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawing = useRef(false);
  const current: number[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      redraw(ctx);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const redraw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    strokes.forEach((s) => {
      ctx.beginPath();
      ctx.lineWidth = s.size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = s.color;
      for (let i = 0; i < s.points.length; i += 2) {
        const x = s.points[i];
        const y = s.points[i + 1];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  };

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return ctx;
  };

  const toLocal = (e: MouseEvent | PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointerDown = (ev: PointerEvent) => {
      if (!active) return;
      drawing.current = true;
      (canvas as any).setPointerCapture(ev.pointerId);
      const p = toLocal(ev);
      current.push(p.x, p.y);
    };

    const pointerMove = (ev: PointerEvent) => {
      if (!drawing.current) return;
      const p = toLocal(ev);
      current.push(p.x, p.y);
      const ctx = getCtx();
      if (!ctx) return;
      redraw(ctx);
      // draw current stroke
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
      if (!drawing.current) return;
      drawing.current = false;
      setStrokes((s) => s.concat({ points: current.slice(), color, size }));
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
  }, [active, color, size]);

  // clear/undo handlers via props or external UI can be added later

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${active ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default DrawingCanvas;
