// This file contains the MermaidCanvas component
import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Cấu hình Mermaid để không tự động giới hạn chiều rộng
mermaid.initialize({
  startOnLoad: true,
  theme: "neutral",
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: false,
    htmlLabels: true,
  },
  fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
});

interface Props {
  chartCode: string;
}

const controlButton: React.CSSProperties = {
  width: "36px",
  height: "36px",
  background: "#ffffff",
  border: "1px solid #d1d9e0",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#0054a6", // Màu xanh VNPT
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  transition: "all 0.2s",
};

const MermaidCanvas: React.FC<Props> = ({ chartCode }) => {
  const mermaidRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<any>(null);
  const instanceId = useRef(
    `mermaid-${Math.random().toString(36).slice(2, 9)}`,
  );
  const [svgReady, setSvgReady] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Render Mermaid into SVG string and inject into container
  const renderMermaid = useCallback(async () => {
    if (!chartCode || !mermaidRef.current) return;
    try {
      // Xóa nội dung cũ để tránh xung đột ID
      mermaidRef.current.innerHTML = "";

      // Sử dụng mermaid.render thay vì mermaidAPI.render trực tiếp để an toàn hơn
      const { svg } = await mermaid.render(instanceId.current, chartCode);

      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
        setSvgReady(true);
      }
    } catch (err) {
      console.error("Mermaid Render Error:", err);
      if (mermaidRef.current) {
        mermaidRef.current.innerText =
          "Lỗi sơ đồ: Vui lòng kiểm tra lại cú pháp Mermaid.";
      }
      setSvgReady(false);
    }
  }, [chartCode]);

  useEffect(() => {
    renderMermaid();
  }, [chartCode, renderMermaid]);

  // Fit the rendered SVG into the viewer by calculating a scale that fits container
  const fitToScreen = useCallback(() => {
    const container = mermaidRef.current?.parentElement as HTMLElement | null;
    const svg = mermaidRef.current?.querySelector(
      "svg",
    ) as SVGSVGElement | null;
    if (!container || !svg || !wrapperRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const svgBBox = svg.getBBox();
    if (svgBBox.width === 0 || svgBBox.height === 0) return;

    const scaleX = containerRect.width / svgBBox.width;
    const scaleY = containerRect.height / svgBBox.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // leave margin

    // center the svg by translating to middle
    const centerX =
      (containerRect.width - svgBBox.width * scale) / 2 - svgBBox.x * scale;
    const centerY =
      (containerRect.height - svgBBox.height * scale) / 2 - svgBBox.y * scale;

    try {
      wrapperRef.current?.setTransform(centerX, centerY, scale, 300);
    } catch (e) {
      // fallback to reset
      wrapperRef.current?.resetTransform();
    }
  }, []);

  // Auto-fit on svg ready and on resize
  useLayoutEffect(() => {
    if (!svgReady) return;
    fitToScreen();
    const r = new ResizeObserver(() => fitToScreen());
    const el = mermaidRef.current?.parentElement;
    if (el) r.observe(el);
    return () => r.disconnect();
  }, [svgReady, fitToScreen]);

  // Keyboard shortcuts for zoom +/- and reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!wrapperRef.current) return;
      if (e.key === "+" || e.key === "=") wrapperRef.current.zoomIn();
      if (e.key === "-") wrapperRef.current.zoomOut();
      if (e.key.toLowerCase() === "0") wrapperRef.current.resetTransform();
      if (e.key.toLowerCase() === "f") fitToScreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitToScreen]);

  return (
    <div
      className="canvas-container"
      style={{
        background: showGrid
          ? "repeating-linear-gradient(#f8fafb, #f8fafb 19px, #f0f4f8 20px)"
          : "#ffffff",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Controls overlay */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={() => wrapperRef.current?.zoomIn()}
          title="Zoom in (+)"
          style={controlButton}
        >
          +
        </button>
        <button
          onClick={() => wrapperRef.current?.zoomOut()}
          title="Zoom out (-)"
          style={controlButton}
        >
          −
        </button>
        <button
          onClick={() => wrapperRef.current?.resetTransform()}
          title="Reset"
          style={controlButton}
        >
          ⤾
        </button>
        <button
          onClick={() => fitToScreen()}
          title="Fit to screen (F)"
          style={controlButton}
        >
          ⤡
        </button>
        <button
          onClick={() => setShowGrid((s) => !s)}
          title="Toggle grid"
          style={controlButton}
        >
          ⊞
        </button>
      </div>

      <TransformWrapper
        ref={wrapperRef}
        initialScale={1}
        minScale={0.2}
        maxScale={4}
        wheel={{ step: 0.12, wheelDisabled: false }}
        doubleClick={{ disabled: false, step: 0.5 }}
        pinch={{ disabled: false }}
        panning={{ disabled: false, velocityDisabled: false }}
        centerOnInit={false}
      >
        <TransformComponent
          wrapperStyle={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            ref={mermaidRef}
            className="mermaid"
            style={{
              cursor: "grab",
              display: "inline-block",
              padding: "32px",
              willChange: "transform",
            }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MermaidCanvas;
