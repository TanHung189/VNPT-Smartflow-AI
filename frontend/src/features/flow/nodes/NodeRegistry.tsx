/**
 * NodeRegistry.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * VNPT SmartFlow AI – Context-Aware Custom Node Registry
 *
 * Architecture:
 *   1. INTERFACES  – TypeScript data contracts per node type
 *   2. STYLES      – Tailwind class constants (Glassmorphism / VNPT brand)
 *   3. COMPONENTS  – OrgNode | LayerNode | UMLNode | ProcessNode
 *   4. REGISTRY    – Central export map for React Flow nodeTypes prop
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  NodeResizer,
  NodeToolbar,
} from "@xyflow/react";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import {
  Users,
  Building2,
  UserCircle,
  Layers,
  Server,
  Database,
  Globe,
  Code2,
  GitMerge,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Hourglass,
  User,
  Briefcase,
  Network,
  Box,
  Edit2,
  Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface OrgNodeData {
  label: string;
  position_title?: string;
  department?: string;
  avatar?: string;
  email?: string;
  level?: "executive" | "manager" | "staff";
  themeConfig?: any;
}

export interface LayerNodeData {
  label: string;
  description?: string;
  layer_type?:
    | "presentation"
    | "business"
    | "data"
    | "infrastructure"
    | "generic";
  tech_stack?: string[];
  color_scheme?: string;
  themeConfig?: any;
}

export interface UMLNodeData {
  label: string;
  stereotype?: string;
  description?: string;
  attributes?: string[];
  methods?: string[];
  visibility?: "public" | "private" | "protected";
  uml_type?: "class" | "interface" | "usecase" | "actor";
  themeConfig?: any;
}

export interface ProcessNodeData {
  label: string;
  executor?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "rejected" | "on_hold";
  duration?: string;
  deadline?: string;
  process_type?: "start" | "step" | "decision" | "end" | "approval";
  document_ref?: string;
  themeConfig?: any;
}

export interface InfographicNodeData {
  label: string;
  description?: string;
  variant?:
    | "swot-strength"
    | "swot-weakness"
    | "swot-opportunity"
    | "swot-threat"
    | "step";
  icon_name?: string;
  themeConfig?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STYLES — Centralized Tailwind class tokens
// ─────────────────────────────────────────────────────────────────────────────

const HANDLE_STYLE = {
  source: "!w-3 !h-3 !bg-blue-500 !border-2 !border-white shadow-md",
  target: "!w-3 !h-3 !bg-white !border-2 !border-blue-400 shadow-md",
};

const VNPT_BLUE = {
  gradient: "from-[#003087] via-[#0066cc] to-[#0080ff]",
  light: "bg-blue-50",
  border: "border-blue-200",
  text: "text-blue-700",
  dark: "text-[#003087]",
};

const glass = (selected: boolean, extra = "") =>
  [
    "relative rounded-2xl border backdrop-blur-sm transition-all duration-300 overflow-hidden",
    "bg-white/80 shadow-xl",
    selected
      ? "border-blue-500 shadow-blue-400/30 ring-2 ring-blue-400/40 scale-[1.02]"
      : "border-slate-200/50 shadow-slate-200/40 hover:shadow-lg hover:border-slate-300",
    extra,
  ].join(" ");

// ─────────────────────────────────────────────────────────────────────────────
// 3A. OrgNode — Sơ đồ tổ chức (Org Chart)
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<
  string,
  { gradient: string; badge: string; icon: React.ReactNode }
> = {
  executive: {
    gradient: "from-[#003087] to-[#0066cc]",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <Briefcase className="w-4 h-4" />,
  },
  manager: {
    gradient: "from-[#0066cc] to-[#0080ff]",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Users className="w-4 h-4" />,
  },
  staff: {
    gradient: "from-slate-500 to-slate-600",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    icon: <User className="w-4 h-4" />,
  },
};

const OrgNodeComponent = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);

  const d = data as unknown as OrgNodeData;
  const level = d.level ?? "staff";

  // Dynamic Theme Override
  const defaultCfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.staff;
  const cfg = {
    ...defaultCfg,
    ...(d.themeConfig?.[level] || d.themeConfig?.all || {}),
  };

  return (
    <div className={glass(selected, "min-w-[220px] max-w-[260px]")}>
      {/* Gradient accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

      {/* Body */}
      <div className="p-4">
        {/* Avatar + Name row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${cfg.gradient} shadow-lg`}
          >
            {d.avatar ? (
              <img
                src={d.avatar}
                alt={d.label}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <UserCircle className="w-7 h-7 text-white" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <textarea
                className="w-full text-sm font-extrabold text-slate-800 bg-white/60 border border-slate-300 rounded outline-none resize-none nodrag nowheel p-1"
                value={d.label}
                autoFocus
                onChange={(e) => setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setIsEditing(false); }
                }}
                rows={2}
              />
            ) : (
              <p onDoubleClick={() => setIsEditing(true)} className="text-sm font-extrabold text-slate-800 leading-tight truncate font-['Inter'] cursor-pointer hover:text-blue-600 transition-colors">
                {d.label}
              </p>
            )}
            {d.position_title && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {d.position_title}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-2 bg-slate-100" />

        {/* Metadata */}
        <div className="flex flex-col gap-1.5">
          {d.department && (
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-600 truncate">
                {d.department}
              </span>
            </div>
          )}
          {d.email && (
            <div className="flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-500 truncate">
                {d.email}
              </span>
            </div>
          )}
        </div>

        {/* Level badge */}
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}
          >
            {cfg.icon}
            {level === "executive"
              ? "Lãnh đạo"
              : level === "manager"
                ? "Quản lý"
                : "Nhân viên"}
          </span>
        </div>
      </div>

      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex bg-white rounded-lg shadow-lg border border-slate-200 p-1 gap-1 mb-1">
          <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 hover:bg-slate-100 rounded text-blue-600"><Edit2 size={14}/></button>
          <button onClick={() => setNodes((nds) => nds.filter((n) => n.id !== id))} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
        </div>
      </NodeToolbar>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={HANDLE_STYLE.target}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={HANDLE_STYLE.source}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={HANDLE_STYLE.target}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={HANDLE_STYLE.source}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3B. LayerNode — Sơ đồ phân tầng hệ thống (Layered Architecture)
// ─────────────────────────────────────────────────────────────────────────────

const LAYER_CONFIG: Record<
  string,
  { gradient: string; glow: string; icon: React.ReactNode; label_vn: string }
> = {
  presentation: {
    gradient: "from-violet-500/20 to-purple-400/10",
    glow: "border-violet-300/60 shadow-violet-200/40",
    icon: <Globe className="w-5 h-5 text-violet-600" />,
    label_vn: "Tầng Giao Diện",
  },
  business: {
    gradient: "from-blue-500/20 to-cyan-400/10",
    glow: "border-blue-300/60 shadow-blue-200/40",
    icon: <Code2 className="w-5 h-5 text-blue-600" />,
    label_vn: "Tầng Nghiệp Vụ",
  },
  data: {
    gradient: "from-emerald-500/20 to-teal-400/10",
    glow: "border-emerald-300/60 shadow-emerald-200/40",
    icon: <Database className="w-5 h-5 text-emerald-600" />,
    label_vn: "Tầng Dữ Liệu",
  },
  infrastructure: {
    gradient: "from-orange-500/20 to-amber-400/10",
    glow: "border-orange-300/60 shadow-orange-200/40",
    icon: <Server className="w-5 h-5 text-orange-600" />,
    label_vn: "Tầng Hạ Tầng",
  },
  generic: {
    gradient: "from-slate-400/20 to-slate-300/10",
    glow: "border-slate-300/60 shadow-slate-200/40",
    icon: <Layers className="w-5 h-5 text-slate-600" />,
    label_vn: "Tầng Hệ Thống",
  },
};

const LayerNodeComponent = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);

  const d = data as unknown as LayerNodeData;
  const type = d.layer_type ?? "generic";

  // Dynamic Theme Override
  const defaultCfg = LAYER_CONFIG[type] ?? LAYER_CONFIG.generic;
  const cfg = {
    ...defaultCfg,
    ...(d.themeConfig?.[type] || d.themeConfig?.all || {}),
  };

  return (
    <>
      <NodeResizer
        color="#8b5cf6"
        isVisible={selected}
        minWidth={280}
        minHeight={120}
      />
      <div
        className={[
          "relative w-full h-full rounded-2xl border-2 backdrop-blur-md transition-all duration-300",
          `bg-gradient-to-br ${cfg.gradient}`,
          selected
            ? `${cfg.glow} ring-2 ring-offset-1 ring-blue-400/40`
            : `${cfg.glow} hover:shadow-lg`,
          "min-w-[260px] min-h-[100px] p-4",
        ].join(" ")}
        style={{ backdropFilter: "blur(12px)" }}
      >
        {/* Glassmorphism shine overlay */}
        <div className="absolute inset-0 rounded-2xl bg-white/30 pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-white/60 shadow-sm">{cfg.icon}</div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              {cfg.label_vn}
            </p>
            {isEditing ? (
              <textarea
                className="w-full text-sm font-extrabold text-slate-800 bg-white/60 border border-slate-300 rounded outline-none resize-none nodrag nowheel p-1"
                value={d.label}
                autoFocus
                onChange={(e) => setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setIsEditing(false); }
                }}
                rows={2}
              />
            ) : (
              <p onDoubleClick={() => setIsEditing(true)} className="text-sm font-extrabold text-slate-800 leading-tight cursor-pointer hover:text-blue-600 transition-colors">
                {d.label}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {d.description && (
          <p className="relative text-[11px] text-slate-600 mb-3 leading-relaxed">
            {d.description}
          </p>
        )}

        {/* Tech stack badges */}
        {d.tech_stack && d.tech_stack.length > 0 && (
          <div className="relative flex flex-wrap gap-1">
            {d.tech_stack.map((tech, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 border border-white/50 text-slate-700 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Handles — all 4 sides so nested layout works */}
        <Handle
          type="target"
          position={Position.Top}
          className={HANDLE_STYLE.target}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className={HANDLE_STYLE.source}
        />
        <Handle
          type="target"
          position={Position.Left}
          className={HANDLE_STYLE.target}
          style={{ top: "50%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={HANDLE_STYLE.source}
          style={{ top: "50%" }}
        />
      </div>

      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex bg-white rounded-lg shadow-lg border border-slate-200 p-1 gap-1 mb-1">
          <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 hover:bg-slate-100 rounded text-blue-600"><Edit2 size={14}/></button>
          <button onClick={() => setNodes((nds) => nds.filter((n) => n.id !== id))} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
        </div>
      </NodeToolbar>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3C. UMLNode — Sơ đồ UML Class / Interface
// ─────────────────────────────────────────────────────────────────────────────

const VISIBILITY_SYMBOL: Record<string, string> = {
  public: "+",
  private: "−",
  protected: "#",
};

const UMLNodeComponent = ({ data, selected }: NodeProps) => {
  const d = data as unknown as UMLNodeData;
  const visSymbol = VISIBILITY_SYMBOL[d.visibility ?? "public"];
  const isInterface = d.uml_type === "interface";

  // Actor variant
  if (d.uml_type === "actor") {
    return (
      <div className="flex flex-col items-center gap-1 select-none">
        <div
          className={`p-3 rounded-full bg-white border-2 shadow-lg transition-all duration-300 ${
            selected
              ? "border-blue-500 scale-110 shadow-blue-200"
              : "border-slate-700"
          }`}
        >
          <UserCircle className="w-8 h-8 text-slate-700" />
        </div>
        <span className="text-xs font-bold text-slate-800 text-center max-w-[100px] leading-tight">
          {d.label}
        </span>
        <Handle
          type="source"
          position={Position.Bottom}
          className="opacity-0"
        />
        <Handle type="target" position={Position.Top} className="opacity-0" />
      </div>
    );
  }

  // UseCase ellipse variant
  if (d.uml_type === "usecase") {
    return (
      <div
        className={`px-6 py-4 min-w-[160px] max-w-[220px] bg-white border-2 shadow-lg transition-all duration-300 ${
          selected
            ? "border-blue-600 shadow-blue-200 scale-105"
            : "border-slate-800"
        }`}
        style={{ borderRadius: "50%" }}
      >
        <p className="text-sm font-semibold text-slate-900 text-center leading-snug">
          {d.label}
        </p>
        {d.description && (
          <p className="text-[10px] text-slate-500 text-center mt-1 line-clamp-2">
            {d.description}
          </p>
        )}
        <Handle
          type="target"
          position={Position.Top}
          className={HANDLE_STYLE.target}
          style={{ left: "50%" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className={HANDLE_STYLE.source}
          style={{ left: "50%" }}
        />
      </div>
    );
  }

  // Class / Interface box
  return (
    <div
      className={[
        "min-w-[220px] bg-white/90 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 rounded-sm overflow-hidden",
        selected
          ? "border-slate-900 shadow-slate-400/30 scale-[1.02]"
          : "border-slate-700 hover:border-slate-900 hover:shadow-slate-300/50",
      ].join(" ")}
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
    >
      {/* Header — class name + stereotype */}
      <div
        className={`px-4 py-3 border-b-2 border-slate-700 text-center ${
          isInterface ? "bg-blue-50" : "bg-slate-50"
        }`}
      >
        {d.stereotype && (
          <p className="text-[9px] text-slate-500 italic mb-0.5">
            «{d.stereotype}»
          </p>
        )}
        {isInterface && !d.stereotype && (
          <p className="text-[9px] text-blue-500 italic mb-0.5">«interface»</p>
        )}
        <p className="text-sm font-bold text-slate-900 tracking-wide">
          {d.label}
        </p>
      </div>

      {/* Attributes section */}
      <div className="px-4 py-2.5 border-b border-slate-200 min-h-[36px]">
        {d.attributes && d.attributes.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {d.attributes.map((attr, i) => (
              <p key={i} className="text-[11px] text-slate-700 leading-snug">
                <span className="text-blue-600 font-bold mr-1">
                  {visSymbol}
                </span>
                {attr}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-300 italic">
            {visSymbol} attributes
          </p>
        )}
      </div>

      {/* Methods section */}
      <div className="px-4 py-2.5 min-h-[36px]">
        {d.methods && d.methods.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {d.methods.map((method, i) => (
              <p key={i} className="text-[11px] text-slate-700 leading-snug">
                <span className="text-emerald-600 font-bold mr-1">
                  {visSymbol}
                </span>
                {method}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-300 italic">
            {visSymbol} methods()
          </p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={HANDLE_STYLE.target}
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={HANDLE_STYLE.source}
        style={{ left: "50%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={HANDLE_STYLE.target}
        style={{ top: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={HANDLE_STYLE.source}
        style={{ top: "50%" }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D. ProcessNode — iOffice Quy trình hành chính
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: string; icon: React.ReactNode; pulse: boolean }
> = {
  pending: {
    label: "Chờ xử lý",
    variant: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Hourglass className="w-3 h-3" />,
    pulse: true,
  },
  in_progress: {
    label: "Đang xử lý",
    variant: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Clock className="w-3 h-3" />,
    pulse: true,
  },
  completed: {
    label: "Hoàn thành",
    variant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
    pulse: false,
  },
  rejected: {
    label: "Từ chối",
    variant: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: false,
  },
  on_hold: {
    label: "Tạm dừng",
    variant: "bg-slate-100 text-slate-500 border-slate-200",
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: false,
  },
};

const PROCESS_TYPE_STYLE: Record<
  string,
  { border: string; header: string; accent: string }
> = {
  start: {
    border: "border-emerald-400",
    header: "from-emerald-500 to-teal-600",
    accent: "text-emerald-600",
  },
  end: {
    border: "border-red-400",
    header: "from-red-500 to-rose-600",
    accent: "text-red-600",
  },
  decision: {
    border: "border-purple-400",
    header: "from-purple-500 to-violet-600",
    accent: "text-purple-600",
  },
  approval: {
    border: "border-blue-400",
    header: "from-blue-500 to-indigo-600",
    accent: "text-blue-600",
  },
  step: {
    border: "border-slate-300",
    header: "from-[#003087] to-[#0066cc]",
    accent: "text-[#003087]",
  },
};

const ProcessNodeComponent = ({ id, data, selected }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);

  const d = data as unknown as ProcessNodeData;
  const pType = d.process_type ?? "step";

  // Dynamic Theme Override
  const defaultStyle = PROCESS_TYPE_STYLE[pType] ?? PROCESS_TYPE_STYLE.step;
  const pStyle = {
    ...defaultStyle,
    ...(d.themeConfig?.[pType] || d.themeConfig?.all || {}),
  };

  const statusCfg = d.status ? STATUS_CONFIG[d.status] : null;

  // START / END — rounded pill shape
  if (pType === "start" || pType === "end") {
    return (
      <div
        className={[
          "min-w-[180px] rounded-full px-6 py-3.5 text-center border-2 shadow-xl transition-all duration-300",
          `bg-gradient-to-r ${pStyle.header}`,
          selected
            ? `${pStyle.border} ring-2 ring-offset-2 ring-white/40 scale-105`
            : pStyle.border,
        ].join(" ")}
      >
        <p className="text-sm font-extrabold text-white tracking-wide drop-shadow-sm">
          {d.label}
        </p>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-white !border-2 !border-slate-300"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-white !border-2 !border-slate-300"
        />
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-white !border-2 !border-slate-300"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-white !border-2 !border-slate-300"
        />
      </div>
    );
  }

  // DECISION — diamond shape via rotate
  if (pType === "decision") {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: 160, height: 80 }}
      >
        <div
          className={[
            "w-28 h-28 bg-gradient-to-br from-purple-500 to-violet-600 border-2 rotate-45 shadow-xl origin-center transition-all duration-300 absolute",
            selected
              ? "border-purple-300 ring-2 ring-purple-400/40 scale-110"
              : "border-purple-400",
          ].join(" ")}
        />
        <p className="relative text-[12px] font-extrabold text-white text-center leading-tight px-1 drop-shadow z-10">
          {d.label}
        </p>
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-white !border-2 !border-purple-400"
          style={{ top: "0%" }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
          style={{ bottom: "0%" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
          style={{ right: "0%", top: "50%" }}
        />
        <Handle
          type="source"
          position={Position.Left}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
          style={{ left: "0%", top: "50%" }}
        />
      </div>
    );
  }

  // STEP / APPROVAL
  return (
    <div
      className={[
        glass(selected, "min-w-[240px] max-w-[300px]"),
        selected ? `border-2 ${pStyle.border}` : `border ${pStyle.border}`,
      ].join(" ")}
    >
      {/* Gradient accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${pStyle.header}`} />

      {/* Body */}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-2.5">
          <div
            className={`p-2 rounded-xl bg-gradient-to-br ${pStyle.header} shadow-md flex-shrink-0`}
          >
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {d.document_ref && (
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                {d.document_ref}
              </p>
            )}
            {isEditing ? (
              <textarea
                className="w-full text-sm font-extrabold text-slate-800 bg-white/60 border border-slate-300 rounded outline-none resize-none nodrag nowheel p-1"
                value={d.label}
                autoFocus
                onChange={(e) => setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setIsEditing(false); }
                }}
                rows={2}
              />
            ) : (
              <p onDoubleClick={() => setIsEditing(true)} className="text-sm font-extrabold text-slate-800 leading-tight cursor-pointer hover:text-blue-600 transition-colors">
                {d.label}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {d.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {d.description}
          </p>
        )}

        <Separator className="my-2 bg-slate-100" />

        {/* Executor + Status row */}
        <div className="flex items-center justify-between gap-3 flex-wrap mt-2 p-2 bg-slate-50/50 rounded-lg border border-slate-100/50">
          {/* Executor */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-white shadow-sm border border-slate-100">
              <User className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">
                Người thực hiện
              </span>
              <span className="text-[12px] text-slate-700 font-extrabold truncate max-w-[100px]">
                {d.executor ?? "Chưa phân công"}
              </span>
            </div>
          </div>

          {/* Status badge */}
          {statusCfg && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wide mb-0.5">
                Trạng thái
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border shadow-sm ${statusCfg.variant}`}
              >
                {statusCfg.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                  </span>
                )}
                {statusCfg.icon}
                <span className="uppercase tracking-wide">
                  {statusCfg.label}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Duration + Deadline */}
        {(d.duration || d.deadline) && (
          <div className="flex items-center gap-3 mt-2">
            {d.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500">{d.duration}</span>
              </div>
            )}
            {d.deadline && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] text-orange-500 font-medium">
                  {d.deadline}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VNPT iOffice footer */}
      <div className="px-4 pb-3 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          VNPT iOffice
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className={HANDLE_STYLE.target}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={HANDLE_STYLE.source}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={HANDLE_STYLE.target}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={HANDLE_STYLE.source}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3E. InfographicNode — SWOT, Mindmap, 5-Step Process
// ─────────────────────────────────────────────────────────────────────────────

const INFOGRAPHIC_CONFIG: Record<
  string,
  { gradient: string; text: string; icon: React.ReactNode }
> = {
  "swot-strength": {
    gradient: "from-emerald-500 to-teal-500",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="w-5 h-5 text-white" />,
  },
  "swot-weakness": {
    gradient: "from-rose-500 to-red-600",
    text: "text-rose-700",
    icon: <AlertTriangle className="w-5 h-5 text-white" />,
  },
  "swot-opportunity": {
    gradient: "from-blue-500 to-indigo-500",
    text: "text-blue-700",
    icon: <Globe className="w-5 h-5 text-white" />,
  },
  "swot-threat": {
    gradient: "from-amber-500 to-orange-500",
    text: "text-amber-700",
    icon: <AlertTriangle className="w-5 h-5 text-white" />,
  },
  step: {
    gradient: "from-purple-500 to-violet-500",
    text: "text-purple-700",
    icon: <Box className="w-5 h-5 text-white" />,
  },
};

const InfographicNodeComponent = ({ data, selected }: NodeProps) => {
  const d = data as unknown as InfographicNodeData;
  const variant = d.variant ?? "step";
  const cfg = INFOGRAPHIC_CONFIG[variant] ?? INFOGRAPHIC_CONFIG.step;

  return (
    <div
      className={[
        "relative flex flex-col p-5 min-w-[240px] max-w-[280px] bg-white rounded-[24px] border-2 shadow-xl transition-all duration-300 overflow-hidden",
        selected
          ? `border-indigo-400 scale-[1.02] shadow-indigo-200`
          : "border-slate-100 hover:shadow-2xl hover:border-slate-200",
      ].join(" ")}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${cfg.gradient} rounded-bl-[100px] opacity-10`}
      />

      <div className="flex items-center gap-3 w-full mb-3 relative z-10">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-[16px] shadow-lg bg-gradient-to-br ${cfg.gradient} transform -rotate-6`}
        >
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">
            {variant.split("-").pop()?.toUpperCase()}
          </p>
          <p
            className={`text-base font-extrabold leading-tight truncate ${cfg.text}`}
          >
            {d.label}
          </p>
        </div>
      </div>

      {d.description && (
        <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-1 relative z-10 line-clamp-3">
          {d.description}
        </p>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className={HANDLE_STYLE.target}
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={HANDLE_STYLE.source}
        style={{ left: "50%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={HANDLE_STYLE.source}
        style={{ top: "50%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={HANDLE_STYLE.target}
        style={{ top: "50%" }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXPORT — memo-ized components + nodeTypes registry
// ─────────────────────────────────────────────────────────────────────────────

export const OrgNode = memo(OrgNodeComponent);
export const LayerNode = memo(LayerNodeComponent);
export const UMLNode = memo(UMLNodeComponent);
export const ProcessNode = memo(ProcessNodeComponent);
export const InfographicNode = memo(InfographicNodeComponent);

/**
 * NODE_REGISTRY
 * Plug this directly into ReactFlow's `nodeTypes` prop in FlowCanvas.tsx for max performance.
 * Using a stable reference (module-level constant) prevents unnecessary re-renders.
 */
export const NODE_REGISTRY = {
  // 1. Tên mapping từ URL template (Dashboard truyền sang)
  "org-chart": OrgNode,
  layer: LayerNode,
  uml: UMLNode,
  process: ProcessNode,
  infographic: InfographicNode,
  mindmap: InfographicNode, // Em có thể dùng tạm Infographic cho Mindmap hoặc viết component riêng

  // 2. THE MISSING LINK: Mapping CHÍNH XÁC các type mà AI Backend (Gemini/Claude) sinh ra!
  orgNode: OrgNode,
  layerNode: LayerNode,
  umlNode: UMLNode,
  processNode: ProcessNode,
  mindmapNode: InfographicNode, // Tạm map vào InfographicNode

  // 3. Aliases cho dữ liệu cũ (Backward compatibility)
  org: OrgNode,
  layered: LayerNode,
  "uml-class": UMLNode,
  ioffice: ProcessNode,
} as const;

/**
 * DIAGRAM_DEFAULT_NODES
 * Bootstrap sample data for each diagram type.
 * Used by templates (DrawDiagram.tsx) via the `template` URL query param.
 */
export const DIAGRAM_DEFAULT_NODES: Record<
  string,
  { nodes: any[]; edges: any[] }
> = {
  "org-chart": {
    nodes: [
      {
        id: "org_1",
        type: "org-chart",
        position: { x: 300, y: 50 },
        data: {
          label: "Nguyễn Văn A",
          position_title: "Tổng Giám Đốc",
          department: "Ban Lãnh Đạo VNPT",
          level: "executive",
        } satisfies OrgNodeData,
      },
      {
        id: "org_2",
        type: "org-chart",
        position: { x: 100, y: 250 },
        data: {
          label: "Trần Thị B",
          position_title: "Phó Giám Đốc",
          department: "Phòng Kỹ Thuật",
          level: "manager",
        } satisfies OrgNodeData,
      },
      {
        id: "org_3",
        type: "org-chart",
        position: { x: 500, y: 250 },
        data: {
          label: "Lê Văn C",
          position_title: "Trưởng Phòng",
          department: "Phòng Kinh Doanh",
          level: "manager",
        } satisfies OrgNodeData,
      },
    ],
    edges: [
      { id: "e1", source: "org_1", target: "org_2" },
      { id: "e2", source: "org_1", target: "org_3" },
    ],
  },
  layered: {
    nodes: [
      {
        id: "layer_1",
        type: "layer",
        position: { x: 200, y: 50 },
        data: {
          label: "Frontend Layer",
          layer_type: "presentation",
          tech_stack: ["React", "TypeScript", "Tailwind CSS"],
          description: "Giao diện người dùng và trải nghiệm khách hàng",
        } satisfies LayerNodeData,
      },
      {
        id: "layer_2",
        type: "layer",
        position: { x: 200, y: 200 },
        data: {
          label: "Business Logic Layer",
          layer_type: "business",
          tech_stack: ["FastAPI", "Python", "Pydantic"],
          description: "Xử lý nghiệp vụ và API Gateway",
        } satisfies LayerNodeData,
      },
      {
        id: "layer_3",
        type: "layer",
        position: { x: 200, y: 350 },
        data: {
          label: "Data Layer",
          layer_type: "data",
          tech_stack: ["PostgreSQL", "Redis", "JSONB"],
          description: "Lưu trữ dữ liệu và bộ nhớ đệm",
        } satisfies LayerNodeData,
      },
    ],
    edges: [
      { id: "e1", source: "layer_1", target: "layer_2" },
      { id: "e2", source: "layer_2", target: "layer_3" },
    ],
  },
  uml: {
    nodes: [
      {
        id: "uml_1",
        type: "uml",
        position: { x: 100, y: 100 },
        data: {
          label: "NguoiDung",
          uml_type: "class",
          attributes: [
            "id_nguoi_dung: UUID",
            "ten_nguoi_dung: string",
            "email: string",
          ],
          methods: ["dangNhap(): boolean", "capNhatThongTin(): void"],
          visibility: "public",
        } satisfies UMLNodeData,
      },
      {
        id: "uml_2",
        type: "uml",
        position: { x: 500, y: 100 },
        data: {
          label: "SoDo",
          uml_type: "class",
          stereotype: "entity",
          attributes: ["id_so_do: UUID", "tieu_de: string", "the_loai: string"],
          methods: ["luu(): void", "xoa(): void"],
          visibility: "public",
        } satisfies UMLNodeData,
      },
    ],
    edges: [
      {
        id: "e1",
        source: "uml_1",
        target: "uml_2",
        label: "sở hữu",
        markerEnd: { type: "arrowclosed" },
      },
    ],
  },
  ioffice: {
    nodes: [
      {
        id: "proc_1",
        type: "process",
        position: { x: 300, y: 50 },
        data: {
          label: "Tiếp nhận Công văn",
          process_type: "start",
          executor: "VP. Bộ phận",
        } satisfies ProcessNodeData,
      },
      {
        id: "proc_2",
        type: "process",
        position: { x: 300, y: 180 },
        data: {
          label: "Phân loại & Phân công",
          process_type: "step",
          executor: "Trưởng phòng Hành chính",
          status: "in_progress",
          duration: "1 ngày làm việc",
          description: "Phân loại công văn theo mức độ ưu tiên",
          document_ref: "CV-2024-001",
        } satisfies ProcessNodeData,
      },
      {
        id: "proc_3",
        type: "process",
        position: { x: 300, y: 350 },
        data: {
          label: "Yêu cầu hợp lệ?",
          process_type: "decision",
          executor: "Lãnh đạo",
        } satisfies ProcessNodeData,
      },
      {
        id: "proc_4",
        type: "process",
        position: { x: 300, y: 500 },
        data: {
          label: "Ký duyệt & Lưu hồ sơ",
          process_type: "end",
          executor: "Giám đốc",
        } satisfies ProcessNodeData,
      },
    ],
    edges: [
      { id: "e1", source: "proc_1", target: "proc_2" },
      { id: "e2", source: "proc_2", target: "proc_3" },
      { id: "e3", source: "proc_3", target: "proc_4", label: "Có" },
      {
        id: "e4",
        source: "proc_3",
        target: "proc_2",
        label: "Không",
        type: "step",
      },
    ],
  },
};
