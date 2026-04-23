import { isToday, isYesterday, differenceInDays } from "date-fns";
import { DiagramListItem } from "../services/diagramApi";

export type TimeGroup =
  | "Hôm nay"
  | "Hôm qua"
  | "7 ngày gần đây"
  | "30 ngày gần đây"
  | "Cũ hơn";

// Record type mapping string to lists, maintaining guaranteed ordering via properties or maps.
// We'll use a Record and rely on keys, but for rendering order it's better to just return an object.
export const getGroupFromDate = (dateString: string): TimeGroup => {
  if (!dateString) return "Cũ hơn";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Cũ hơn";
  
  const now = new Date();

  if (isToday(date)) return "Hôm nay";
  if (isYesterday(date)) return "Hôm qua";

  const diff = differenceInDays(now, date);
  if (diff <= 7) return "7 ngày gần đây";
  if (diff <= 30) return "30 ngày gần đây";

  return "Cũ hơn";
};

export const groupDiagramsByDate = (diagrams: DiagramListItem[]) => {
  const groups: Record<TimeGroup, DiagramListItem[]> = {
    "Hôm nay": [],
    "Hôm qua": [],
    "7 ngày gần đây": [],
    "30 ngày gần đây": [],
    "Cũ hơn": [],
  };

  if (!Array.isArray(diagrams)) return groups;

  diagrams.forEach((diagram) => {
    const groupName = getGroupFromDate(diagram.ngay_cap_nhat);
    groups[groupName].push(diagram);
  });

  return groups;
};

export const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Vừa xong";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  try {
    return new Intl.DateTimeFormat("vi-VN").format(date);
  } catch (e) {
    return "N/A";
  }
};
