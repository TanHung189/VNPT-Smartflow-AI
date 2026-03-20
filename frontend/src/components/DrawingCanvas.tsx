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
      for (let i = 0; i < s.points.length; i += 2) {
        const x = s.points[i];
        const y = s.points[i + 1];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  };

  const toLocal = (e: PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

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
      if (mode === "eraser") {
        // immediate erase at pointer
        const p = toLocal(ev);
        onEraseAt?.(p.x, p.y, size);
        return;
      }
      drawing.current = true;
      (canvas as any).setPointerCapture(ev.pointerId);
      const p = toLocal(ev);
      current.push(p.x, p.y);
    };

    const pointerMove = (ev: PointerEvent) => {
      if (!active) return;
      if (mode === "eraser") {
        const p = toLocal(ev);
        onEraseAt?.(p.x, p.y, size);
        return;
      }
      if (!drawing.current) return;
      const p = toLocal(ev);
      current.push(p.x, p.y);
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
      if (current.length >= 4) {
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
