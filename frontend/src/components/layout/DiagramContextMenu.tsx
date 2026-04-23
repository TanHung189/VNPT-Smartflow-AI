/**
 * DiagramContextMenu — Menu chuột phải thông minh cho canvas sơ đồ.
 *
 * Logic thay đổi giao diện theo ngữ cảnh:
 *  - Click vào NỀN CANVAS (targetNode = null):
 *      → Paste, Thêm Node, Chọn Tất Cả, Fit View
 *  - Click vào NODE cụ thể (targetNode != null):
 *      → Đổi tên, Đổi màu, Nhân bản, Xóa
 *
 * Tự động đóng khi:
 *  - Click ra ngoài menu
 *  - Nhấn phím Escape
 *  - Chọn một mục
 *
 * Không chứa logic — toàn bộ hành vi thực thi qua hook useDiagramTools.
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardPaste,
  PlusSquare,
  CheckSquare,
  Maximize2,
  Pencil,
  Palette,
  Copy,
  Trash2,
} from "lucide-react";
import type { ContextMenuState } from "../../hooks/useDiagramTools";
import type { useDiagramTools } from "../../hooks/useDiagramTools";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type DiagramToolsApi = ReturnType<typeof useDiagramTools>;

interface DiagramContextMenuProps {
  menu: ContextMenuState;
  tools: DiagramToolsApi;
  onClose: () => void;
  /** Callback đặt lại tên node (từ DrawDiagram hoặc FlowCanvas) */
  onRenameNode?: (nodeId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT: Mỗi mục trong menu chuột phải
// ─────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  shortcut?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  sublabel,
  onClick,
  danger,
  shortcut,
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left
      transition-all duration-150 group
      ${danger
        ? "hover:bg-red-50 text-slate-700 hover:text-red-600"
        : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
      }
    `}
  >
    {/* Icon */}
    <span
      className={`shrink-0 ${
        danger
          ? "text-red-400 group-hover:text-red-600"
          : "text-slate-400 group-hover:text-[#0066cc]"
      }`}
    >
      {icon}
    </span>

    {/* Label + sublabel */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold leading-tight">{label}</p>
      {sublabel && (
        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
          {sublabel}
        </p>
      )}
    </div>

    {/* Phím tắt (nếu có) */}
    {shortcut && (
      <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-md">
        {shortcut}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT: Header tiêu đề nhóm
// ─────────────────────────────────────────────────────────────

const MenuSection: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-3 pt-2 pb-1">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
      {title}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT: Divider
// ─────────────────────────────────────────────────────────────

const MenuDivider = () => <div className="h-px bg-slate-100 my-1 mx-3" />;

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: DiagramContextMenu
// ─────────────────────────────────────────────────────────────

export const DiagramContextMenu: React.FC<DiagramContextMenuProps> = ({
  menu,
  tools,
  onClose,
  onRenameNode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  // Trạng thái bảng màu inline (cho chức năng đổi màu node)
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Bảng màu có sẵn để đổi màu nhanh
  const colorPalette = [
    { hex: "#ef4444", name: "Đỏ" },
    { hex: "#f97316", name: "Cam" },
    { hex: "#eab308", name: "Vàng" },
    { hex: "#22c55e", name: "Xanh lá" },
    { hex: "#3b82f6", name: "Xanh dương" },
    { hex: "#8b5cf6", name: "Tím" },
    { hex: "#ec4899", name: "Hồng" },
    { hex: "#64748b", name: "Xám" },
  ];

  // ── Đóng menu khi click ra ngoài ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (menu.visible) {
      // Delay nhỏ để tránh đóng ngay khi mới click chuột phải
      setTimeout(() => document.addEventListener("mousedown", handler), 50);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [menu.visible, onClose]);

  // ── Đóng menu khi nhấn Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (menu.visible) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menu.visible, onClose]);

  // ── Reset bảng màu khi menu đóng ──
  useEffect(() => {
    if (!menu.visible) setShowColorPicker(false);
  }, [menu.visible]);

  // Tính toán vị trí menu để không bị tràn ra ngoài màn hình
  const menuWidth = 220;
  const menuHeight = menu.targetNode ? 280 : 240;
  const safeX = Math.min(menu.x, window.innerWidth - menuWidth - 12);
  const safeY = Math.min(menu.y, window.innerHeight - menuHeight - 12);

  return (
    <AnimatePresence>
      {menu.visible && (
        <motion.div
          ref={menuRef}
          key="context-menu"
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -6 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          style={{
            position: "fixed",
            left: safeX,
            top: safeY,
            zIndex: 9999,
            width: menuWidth,
            transformOrigin: "top left",
          }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden py-1.5"
        >
          {/* ══════════════════════════════════════════
              CASE 1: CLICK VÀO NỀN CANVAS (Pane)
              ══════════════════════════════════════════ */}
          {!menu.targetNode ? (
            <>
              <MenuSection title="Canvas" />

              {/* Dán node từ clipboard */}
              <MenuItem
                icon={<ClipboardPaste size={16} />}
                label="Dán"
                sublabel="Dán node từ clipboard"
                shortcut="Ctrl+V"
                onClick={() => {
                  tools.pasteNode(menu.x, menu.y);
                  onClose();
                }}
              />

              {/* Thêm node mới tại vị trí chuột */}
              <MenuItem
                icon={<PlusSquare size={16} />}
                label="Thêm Node tại đây"
                sublabel="Thêm node process mặc định"
                onClick={() => {
                  tools.addNodeAtPosition(menu.x, menu.y, "process");
                  onClose();
                }}
              />

              <MenuDivider />
              <MenuSection title="Toàn bộ" />

              {/* Chọn tất cả nodes */}
              <MenuItem
                icon={<CheckSquare size={16} />}
                label="Chọn tất cả"
                shortcut="Ctrl+A"
                onClick={() => {
                  tools.selectAll();
                  onClose();
                }}
              />

              {/* Fit View — thu phóng vừa canvas */}
              <MenuItem
                icon={<Maximize2 size={16} />}
                label="Vừa màn hình"
                sublabel="Thu phóng để thấy toàn bộ"
                onClick={() => {
                  tools.handleFitView();
                  onClose();
                }}
              />
            </>
          ) : (
            /* ══════════════════════════════════════════
               CASE 2: CLICK VÀO MỘT NODE
               ══════════════════════════════════════════ */
            <>
              {/* Tiêu đề với tên node hiện tại */}
              <div className="px-3 pt-2 pb-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Node
                </p>
                <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                  {menu.targetNode.data?.label
                    ? String(menu.targetNode.data.label).substring(0, 30)
                    : "Không có tên"}
                </p>
              </div>

              <MenuDivider />

              {/* Đổi tên (Edit Text) */}
              <MenuItem
                icon={<Pencil size={16} />}
                label="Đổi tên"
                sublabel="Chỉnh sửa nhãn node"
                onClick={() => {
                  // Gọi callback để DrawDiagram bật chế độ edit label
                  if (onRenameNode && menu.targetNode) {
                    onRenameNode(menu.targetNode.id);
                  }
                  onClose();
                }}
              />

              {/* Đổi màu Node — toggle bảng màu inline */}
              <div>
                <MenuItem
                  icon={<Palette size={16} />}
                  label="Đổi màu"
                  sublabel={showColorPicker ? "Chọn màu bên dưới" : "Bấm để chọn màu"}
                  onClick={() => setShowColorPicker((v) => !v)}
                />
                {/* Bảng màu inline — hiện khi toggle */}
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-4 gap-1.5 px-3 pb-2 pt-1">
                        {colorPalette.map(({ hex, name }) => (
                          <button
                            key={hex}
                            title={name}
                            style={{ backgroundColor: hex }}
                            onClick={() => {
                              if (menu.targetNode) {
                                tools.setNodeColor(menu.targetNode.id, hex);
                              }
                              onClose();
                            }}
                            className="w-8 h-8 rounded-lg border-2 border-white shadow-sm
                              hover:scale-110 transition-transform cursor-pointer
                              hover:ring-2 hover:ring-offset-1 hover:ring-slate-400"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nhân bản (Duplicate) */}
              <MenuItem
                icon={<Copy size={16} />}
                label="Nhân bản"
                sublabel="Tạo bản sao của node"
                onClick={() => {
                  if (menu.targetNode) {
                    tools.duplicateNode(menu.targetNode.id);
                  }
                  onClose();
                }}
              />

              <MenuDivider />

              {/* Xóa node — màu đỏ (danger) */}
              <MenuItem
                icon={<Trash2 size={16} />}
                label="Xóa Node"
                sublabel="Xóa node và các kết nối"
                danger
                shortcut="Del"
                onClick={() => {
                  if (menu.targetNode) {
                    tools.deleteNodeById(menu.targetNode.id);
                  }
                  onClose();
                }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
