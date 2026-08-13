import { useState, useCallback } from "react";
import { useReactFlow, getNodesBounds } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

/**
 * useExportImage
 * ──────────────────────────────────────────────────────────────────────────────
 * Hook xuất ảnh sơ đồ React Flow ra PNG.
 *
 * @param strokes    Danh sách nét vẽ tay (freehand) cần được render vào ảnh
 * @param nodes      Danh sách nodes hiện tại (truyền trực tiếp thay vì dùng
 *                   getNodes() để tránh stale closure khi bị tách khỏi Provider)
 */
export const useExportImage = (strokes: any[] = [], nodes: Node[] = []) => {
  const [isExporting, setIsExporting] = useState(false);
  // Chỉ dùng getNodes() làm fallback khi nodes prop rỗng
  const { getNodes } = useReactFlow();

  const getExportConfig = useCallback(() => {
    // Ưu tiên nodes truyền từ bên ngoài, fallback về getNodes()
    const renderNodes = nodes.length > 0 ? nodes : getNodes();
    if (renderNodes.length === 0) {
      toast.warning("Không có sơ đồ để xuất ảnh!");
      return null;
    }

    const element = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!element) {
      toast.error("Không tìm thấy React Flow viewport.");
      return null;
    }

    const padding = 20;
    const nodesBounds = getNodesBounds(renderNodes);
    
    // Tính toán bounds bao gồm cả các nét vẽ để khung ảnh không bị cắt mất nét vẽ
    let minX = nodesBounds.x;
    let minY = nodesBounds.y;
    let maxX = nodesBounds.x + nodesBounds.width;
    let maxY = nodesBounds.y + nodesBounds.height;

    strokes.forEach(stroke => {
      for (let i = 0; i < stroke.points.length; i += 2) {
        const x = stroke.points[i];
        const y = stroke.points[i + 1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    });

    const finalBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    const transformX = -finalBounds.x + padding;
    const transformY = -finalBounds.y + padding;

    const imageWidth = Math.max(finalBounds.width + padding * 2, 400);
    const imageHeight = Math.max(finalBounds.height + padding * 2, 300);

    return {
      element,
      config: {
        backgroundColor: "#ffffff",
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transformX}px, ${transformY}px) scale(1)`,
        },
        pixelRatio: 2, // 2x để ảnh nét hơn
        quality: 1,
        filter: (node: HTMLElement) => {
          if (
              node?.classList?.contains('react-flow__minimap') || 
              node?.classList?.contains('react-flow__controls') ||
              node?.classList?.contains('react-flow__background') ||
              node?.classList?.contains('react-flow__panel')
          ) {
            return false;
          }
          return true;
        }
      }
    };
  }, [getNodes, nodes, strokes]);

  const injectStrokesSvg = (element: HTMLElement) => {
    if (!strokes || strokes.length === 0) return null;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "temp-export-strokes");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";
    
    strokes.forEach(s => {
      const path = document.createElementNS(svgNS, "path");
      let d = "";
      for (let i = 0; i < s.points.length; i += 2) {
        d += (i === 0 ? "M " : " L ") + s.points[i] + " " + s.points[i+1];
      }
      path.setAttribute("d", d);
      path.setAttribute("stroke", s.color);
      path.setAttribute("stroke-width", s.size.toString());
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.appendChild(path);
    });
    
    element.appendChild(svg);
    return svg;
  };

  /**
   * toPng với retry – html-to-image thỉnh thoảng thất bại lần đầu
   * khi font/image chưa render xong. Retry sau 200ms thường thành công.
   */
  const toPngWithRetry = async (
    element: HTMLElement,
    config: any,
    retries = 2,
  ): Promise<string> => {
    for (let i = 0; i < retries; i++) {
      try {
        const dataUrl = await toPng(element, config);
        if (dataUrl && dataUrl !== "data:,") return dataUrl;
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    throw new Error("toPng failed after retries");
  };

  const toBlobWithRetry = async (
    element: HTMLElement,
    config: any,
    retries = 2,
  ): Promise<Blob | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const blob = await toBlob(element, config);
        if (blob) return blob;
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    return null;
  };

  const downloadImage = useCallback(async () => {
    const exportData = getExportConfig();
    if (!exportData) return;

    let injectedSvg = null;
    try {
      setIsExporting(true);
      injectedSvg = injectStrokesSvg(exportData.element);
      const dataUrl = await toPngWithRetry(exportData.element, exportData.config);
      
      const link = document.createElement("a");
      link.download = `vnpt-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Tải ảnh PNG thành công!");
    } catch (error) {
      console.error("[Export] downloadImage error:", error);
      toast.error("Trích xuất ảnh thất bại. Vui lòng thử lại!");
    } finally {
      if (injectedSvg && exportData.element.contains(injectedSvg)) {
        exportData.element.removeChild(injectedSvg);
      }
      setIsExporting(false);
    }
  }, [getExportConfig, strokes]);

  const copyImageToClipboard = useCallback(async () => {
    const exportData = getExportConfig();
    if (!exportData) return;

    let injectedSvg = null;
    try {
      setIsExporting(true);
      injectedSvg = injectStrokesSvg(exportData.element);
      const blob = await toBlobWithRetry(exportData.element, exportData.config);
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast.success("Đã copy ảnh vào Clipboard!");
      } else {
        throw new Error("Không tạo được blob");
      }
    } catch (error) {
      console.error("[Export] copyImageToClipboard error:", error);
      toast.error("Lỗi copy vào Clipboard. Vui lòng thử lại!");
    } finally {
      if (injectedSvg && exportData.element.contains(injectedSvg)) {
        exportData.element.removeChild(injectedSvg);
      }
      setIsExporting(false);
    }
  }, [getExportConfig, strokes]);

  return {
    isExporting,
    downloadImage,
    copyImageToClipboard
  };
};

