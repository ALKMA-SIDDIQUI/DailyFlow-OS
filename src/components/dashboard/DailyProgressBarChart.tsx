'use client';

import React, { useState } from 'react';
import { DailyProgressItem } from '@/lib/types';
import { BarChart3, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';

interface DailyProgressBarChartProps {
  dailyProgress?: DailyProgressItem[];
}

export const DailyProgressBarChart: React.FC<DailyProgressBarChartProps> = ({
  dailyProgress = [],
}) => {
  const [timeframe, setTimeframe] = useState<7 | 14>(7);

  const displayData = dailyProgress.slice(-timeframe);

  const todayItem = dailyProgress.find((d) => d.dayLabel === 'Today') || {
    percentage: 0,
    completedCount: 0,
    totalCount: 0,
  };
  const yesterdayItem = dailyProgress.find((d) => d.dayLabel === 'Yesterday') || {
    percentage: 0,
    completedCount: 0,
    totalCount: 0,
  };

  const avg7Day = Math.round(
    dailyProgress.slice(-7).reduce((acc, curr) => acc + curr.percentage, 0) /
      Math.max(1, dailyProgress.slice(-7).length)
  );

  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-glass flex flex-col gap-5">
      {/* Header & Metric Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-slate-100">
              Daily Completion Progress Bar Chart
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Track your percentage completion report for Today, Yesterday, and past days
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setTimeframe(7)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeframe === 7
                ? 'bg-cyan-500 text-slate-950 shadow-vibe-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe(14)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeframe === 14
                ? 'bg-cyan-500 text-slate-950 shadow-vibe-glow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            14 Days
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              Today&apos;s Progress
            </span>
            <span className="text-xl font-extrabold text-slate-100">
              {todayItem.percentage}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {todayItem.completedCount} of {todayItem.totalCount || todayItem.completedCount} tasks
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-xs border border-cyan-500/40 shadow-vibe-glow">
            {todayItem.percentage}%
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
              Yesterday&apos;s Progress
            </span>
            <span className="text-xl font-extrabold text-slate-100">
              {yesterdayItem.percentage}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              {yesterdayItem.completedCount} of {yesterdayItem.totalCount || yesterdayItem.completedCount} tasks
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs border border-purple-500/40 shadow-purple-glow">
            {yesterdayItem.percentage}%
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              7-Day Average
            </span>
            <span className="text-xl font-extrabold text-slate-100">
              {avg7Day}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              Weekly completion rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-xs border border-emerald-500/40 shadow-emerald-glow">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar Chart Canvas */}
      <div className="pt-4 pb-2">
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-3 px-2 sm:px-4 border-b border-white/10 pb-2">
          {displayData.map((item, index) => {
            const isToday = item.dayLabel === 'Today';
            const isYesterday = item.dayLabel === 'Yesterday';
            const barHeight = Math.max(8, item.percentage);

            let barGradient = 'from-slate-700 to-slate-800 border-slate-600';
            if (item.percentage === 100) {
              barGradient = 'from-emerald-400 to-cyan-500 border-emerald-300 shadow-emerald-glow';
            } else if (item.percentage >= 60) {
              barGradient = 'from-cyan-400 to-blue-600 border-cyan-300 shadow-vibe-glow';
            } else if (item.percentage > 0) {
              barGradient = 'from-purple-500 to-indigo-600 border-purple-400 shadow-purple-glow';
            }

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on Hover/Touch */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 z-20 pointer-events-none bg-slate-900 border border-cyan-500/40 p-2 rounded-xl text-center shadow-xl w-32 left-1/2 -translate-x-1/2">
                  <div className="text-[10px] font-mono text-cyan-300 font-bold">
                    {item.date} ({item.dayLabel})
                  </div>
                  <div className="text-xs font-extrabold text-white">
                    {item.percentage}% Done
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {item.completedCount} completed
                  </div>
                </div>

                {/* Percentage Badge atop bar */}
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-all ${
                    isToday
                      ? 'text-cyan-300 scale-110 font-black'
                      : item.percentage > 0
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {item.percentage}%
                </span>

                {/* Vertical Bar */}
                <div className="w-full max-w-[36px] bg-slate-900/60 rounded-t-xl overflow-hidden p-0.5 border border-white/5 flex items-end h-full">
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-t-lg bg-gradient-to-t border-t ${barGradient} transition-all duration-500 group-hover:brightness-125 ${
                      isToday ? 'animate-pulse' : ''
                    }`}
                  />
                </div>

                {/* Day Label below bar */}
                <div
                  className={`mt-2 text-center transition-all ${
                    isToday
                      ? 'px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-[10px]'
                      : isYesterday
                      ? 'text-purple-300 font-semibold text-[10px]'
                      : 'text-slate-400 text-[10px] font-mono'
                  }`}
                >
                  <span className="truncate block max-w-[50px]">{item.dayLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
