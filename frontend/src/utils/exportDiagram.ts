import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * FILE LOGIC XUẤT SƠ ĐỒ
 * Mục đích: Tách riêng logic xử lý hình ảnh và PDF khỏi component UI (FlowCanvas/Toolbar) giúp code dễ bảo trì hơn, tái cấu trúc rõ ràng.
 */

// Cấu hình tuỳ chọn chụp ảnh
const getExportOptions = (customOptions: any = {}) => ({
  pixelRatio: 2, 
  backgroundColor: '#ffffff', // Đảm bảo nền màu trắng khi xuất (nếu không dễ sinh nền đen/trong suốt)
  ...customOptions, // Cho phép override width/height/style từ bên ngoài
  filter: (node: HTMLElement) => {
    // Exclude UI elements that should not be in the exported diagram
    if (
        node?.classList?.contains('react-flow__minimap') || 
        node?.classList?.contains('react-flow__controls') ||
        node?.classList?.contains('react-flow__background') ||
        node?.classList?.contains('react-flow__panel')
    ) {
      return false; // Trả về false sẽ loại bỏ thành phần này khỏi ảnh chụp
    }
    return true;
  }
});

const downloadFile = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

export const exportToJpg = async (element: HTMLElement, filename = `smartflow-${Date.now()}.jpg`, customOptions = {}) => {
  try {
    const dataUrl = await toJpeg(element, getExportOptions(customOptions));
    downloadFile(dataUrl, filename);
  } catch (error) {
    console.error("Lỗi khi xuất JPG:", error);
  }
};

export const exportToPng = async (element: HTMLElement, filename = `smartflow-${Date.now()}.png`, customOptions = {}) => {
  try {
    const dataUrl = await toPng(element, getExportOptions(customOptions));
    downloadFile(dataUrl, filename);
  } catch (error) {
    console.error("Lỗi khi xuất PNG:", error);
  }
};

export const exportToPdf = async (element: HTMLElement, filename = `smartflow-${Date.now()}.pdf`, customOptions = {}) => {
  try {
    // Chụp dưới dạng PNG (vì hỗ trợ trong suốt nếu cần, hoặc chất lượng tốt hơn jpeg trong vài case)
    const dataUrl = await toPng(element, getExportOptions(customOptions));
    
    // jsPDF config: 'p' cho dọc (portrait), 'l' cho ngang (landscape)
    // Ở đây dùng thẻ dọc 'p' mặc định A4, dùng đơn vị pixel ('px')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const imgRatio = imgProps.width / imgProps.height;
    const pdfRatio = pdfWidth / pdfHeight;
    
    let renderWidth = pdfWidth;
    let renderHeight = pdfWidth / imgRatio;
    
    if (pdfRatio < imgRatio) {
      // Ảnh dài hơn trang theo chiều ngang
      renderWidth = pdfWidth;
      renderHeight = pdfWidth / imgRatio;
    } else {
      renderHeight = pdfHeight;
      renderWidth = pdfHeight * imgRatio;
    }
    
    // Căn giữa
    const x = (pdfWidth - renderWidth) / 2;
    const y = (pdfHeight - renderHeight) / 2;
    
    pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Lỗi khi xuất PDF:", error);
  }
};
