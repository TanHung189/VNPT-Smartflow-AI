import React, { useRef, useEffect } from "react";
import { useReactFlow, useOnViewportChange } from "@xyflow/react";

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
  const current = useRef<number[]>([]);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    // Đảm bảo canvas luôn phủ 100% Viewport (lấy thông số từ cha)
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // resetTransform trước khi clear
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const dpr = window.devicePixelRatio || 1;
    const { x, y, zoom } = getViewport();
    
    // Áp dụng viewport transform để các nét vẽ zoom/pan cùng với Node
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, x * dpr, y * dpr);

    strokes.forEach((s: Stroke) => {
      ctx.beginPath();
      ctx.lineWidth = s.size; // Nét vẽ sẽ tự scale nhờ ctx.setTransform
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = s.color;
      for (let i = 0; i < s.points.length; i += 2) {
        const px = s.points[i];
        const py = s.points[i + 1];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    if (current.current.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      for (let i = 0; i < current.current.length; i += 2) {
        const px = current.current[i];
        const py = current.current[i + 1];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  };

  // Cập nhật lại màn hình khi người dùng cuộn/zoom React Flow
  useOnViewportChange({
    onChange: redraw,
  });

  useEffect(() => {
    resizeCanvas();
    redraw();
    const handleResize = () => {
      resizeCanvas();
      redraw();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, active, mode, color, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (active) {
      canvas.style.cursor = mode === "eraser" ? "cell" : "crosshair";
    } else {
      canvas.style.cursor = "default";
    }

    const pointerDown = (ev: PointerEvent) => {
      if (!active) return;
      // Convert screen coords to flow coords ngay lúc lấy tọa độ chuột
      const flowPoint = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      
      if (mode === "eraser") {
        onEraseAt?.(flowPoint.x, flowPoint.y, size);
        return;
      }
      
      drawing.current = true;
      (canvas as any).setPointerCapture(ev.pointerId);
      current.current.push(flowPoint.x, flowPoint.y);
      redraw();
      
      if (mode === "pen") {
        canvas.style.cursor = "grabbing";
      }
    };

    const pointerMove = (ev: PointerEvent) => {
      if (!active) return;
      
      if (mode === "eraser" && (ev.buttons & 1)) {
        // Continuous erase if mouse is held down
        const flowPoint = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        onEraseAt?.(flowPoint.x, flowPoint.y, size);
        return;
      }
      
      if (!drawing.current) return;
      const flowPoint = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
      current.current.push(flowPoint.x, flowPoint.y);
      redraw();
    };

    const pointerUp = (ev: PointerEvent) => {
      if (!active) return;
      if (!drawing.current) return;
      drawing.current = false;
      
      canvas.style.cursor = mode === "eraser" ? "cell" : "crosshair";

      if (current.current.length >= 4) {
        // Sao chép mảng vì current.current sẽ bị làm trống
        onAddStroke?.([...current.current], color, size);
      }
      current.current.length = 0;
      redraw();
    };

    canvas.addEventListener("pointerdown", pointerDown as any);
    window.addEventListener("pointermove", pointerMove as any);
    window.addEventListener("pointerup", pointerUp as any);

    return () => {
      canvas.removeEventListener("pointerdown", pointerDown as any);
      window.removeEventListener("pointermove", pointerMove as any);
      window.removeEventListener("pointerup", pointerUp as any);
    };
  }, [active, mode, color, size, strokes, onAddStroke, onEraseAt, screenToFlowPosition]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        className={active ? "pointer-events-auto" : "pointer-events-none"}
      />
    </div>
  );
};

export default DrawingCanvas;
