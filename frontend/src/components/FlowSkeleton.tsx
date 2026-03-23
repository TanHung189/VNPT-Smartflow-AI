import React from 'react';

const FlowSkeleton = () => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center transition-opacity duration-500">
      <div className="relative flex flex-col items-center gap-12 mt-[-5%] overflow-hidden p-8">
        
        {/* Node 1 */}
        <div className="w-72 h-24 bg-slate-800/80 rounded-2xl border border-slate-600 shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="p-4 flex gap-4 h-full items-center">
            <div className="w-12 h-12 rounded-full bg-slate-700/70" />
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-slate-700/70 rounded w-3/4" />
              <div className="h-2 bg-slate-700/70 rounded w-1/2" />
            </div>
          </div>
        </div>

        {/* Nối 1-2 */}
        <div className="w-1 h-12 bg-slate-600/50 absolute top-[6rem] animate-pulse" />

        {/* Node 2 */}
        <div className="w-72 h-24 bg-slate-800/80 rounded-2xl border border-slate-600 shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="p-4 flex gap-4 h-full items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20" />
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-emerald-500/20 rounded w-5/6" />
              <div className="h-2 bg-slate-700/70 rounded w-2/3" />
            </div>
          </div>
        </div>

        {/* Nối 2-3 */}
        <div className="w-1 h-12 bg-slate-600/50 absolute top-[15rem] animate-pulse" />

        {/* Node 3 */}
        <div className="w-72 h-24 bg-slate-800/80 rounded-2xl border border-slate-600 shadow-2xl relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="p-4 flex gap-4 h-full items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20" />
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-amber-500/20 rounded w-full" />
              <div className="h-2 bg-slate-700/70 rounded w-1/3" />
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="absolute -bottom-16 text-cyan-400 font-bold tracking-[0.2em] uppercase text-sm animate-pulse flex items-center gap-3 bg-slate-800/80 py-2 px-6 rounded-full border border-cyan-500/30">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          AI đang thiết kế sơ đồ...
        </div>
      </div>
    </div>
  );
};

export default FlowSkeleton;
