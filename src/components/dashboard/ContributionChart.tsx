'use client';

import React from 'react';
import { ActivityHeatmapDay } from '@/lib/types';
import { Activity } from 'lucide-react';

interface ContributionChartProps {
  heatmap: ActivityHeatmapDay[];
}

export const ContributionChart: React.FC<ContributionChartProps> = ({ heatmap }) => {
  const getLevelStyle = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-cyan-400 border-cyan-300 shadow-vibe-glow text-slate-950 font-bold';
      case 3:
        return 'bg-cyan-500/80 border-cyan-400 text-slate-950 font-bold';
      case 2:
        return 'bg-cyan-600/50 border-cyan-500/60 text-cyan-200';
      case 1:
        return 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300';
      default:
        return 'bg-slate-900/60 border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-glass">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm sm:text-base text-slate-100">
            30-Day Activity Heatmap
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <span>Less</span>
          <div className="w-3 h-3 rounded bg-slate-900/60 border border-slate-800"></div>
          <div className="w-3 h-3 rounded bg-cyan-900/40 border border-cyan-700/50"></div>
          <div className="w-3 h-3 rounded bg-cyan-600/50 border border-cyan-500/60"></div>
          <div className="w-3 h-3 rounded bg-cyan-400 border border-cyan-300"></div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 xl:grid-cols-30 gap-1.5 overflow-x-auto pb-2">
        {heatmap.map((day, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all hover:scale-110 ${getLevelStyle(
              day.level
            )}`}
            title={`${day.date}: ${day.count} completed task(s)`}
          >
            <span className="text-[10px] font-mono font-semibold">{day.count}</span>
            <span className="text-[9px] font-mono opacity-80 truncate max-w-full">
              {day.date.substring(8)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
