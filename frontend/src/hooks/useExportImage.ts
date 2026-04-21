import { useState, useCallback } from "react";
import { useReactFlow, getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

export const useExportImage = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { getNodes } = useReactFlow();

  const getExportConfig = useCallback(() => {
    const renderNodes = getNodes();
    if (renderNodes.length === 0) {
      toast.warning("Không có sơ đồ để xuất ảnh!");
      return null;
    }

    const element = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!element) {
      toast.error("Không tìm thấy React Flow viewport.");
      return null;
    }

    const padding = 20; // Giảm padding xuống 20 để cắt sát hơn
    const nodesBounds = getNodesBounds(renderNodes);
    
    // Tự tính toán transform thay vì dùng getViewportForBounds
    // Đảm bảo scale luôn là 1 để kích thước ảnh (width/height) khớp 100% với nodes
    const transformX = -nodesBounds.x + padding;
    const transformY = -nodesBounds.y + padding;

    // Kích thước cuối cần render
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

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
        pixelRatio: 1.5, // Nâng cao để ảnh nét
        quality: 1,
      }
    };
  }, [getNodes]);

  const downloadImage = useCallback(async () => {
    const exportData = getExportConfig();
    if (!exportData) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(exportData.element, exportData.config);
      
      const link = document.createElement("a");
      link.download = `vnpt-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Tải ảnh PNG thành công!");
    } catch (error) {
      toast.error("Trích xuất ảnh thất bại. Có lỗi xảy ra!");
    } finally {
      setIsExporting(false);
    }
  }, [getExportConfig]);

  const copyImageToClipboard = useCallback(async () => {
    const exportData = getExportConfig();
    if (!exportData) return;

    try {
      setIsExporting(true);
      const blob = await toBlob(exportData.element, exportData.config);
      
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast.success("Đã copy ảnh vào Clipboard!");
      } else {
        throw new Error("Không tạo được blob");
      }
    } catch (error) {
      toast.error("Lỗi copy vào Clipboard. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  }, [getExportConfig]);

  return {
    isExporting,
    downloadImage,
    copyImageToClipboard
  };
};
