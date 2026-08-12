'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { CheckCircle2, Clock, Flame, Trophy, AlertTriangle, Target, Zap } from 'lucide-react';

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: "Today's Progress",
      value: `${stats.todayCompletionRate}%`,
      subtitle: `${stats.todayTasksCount} total tasks today`,
      icon: Target,
      color: 'from-cyan-500 to-blue-600',
      glow: 'shadow-vibe-glow',
      textColor: 'text-cyan-400',
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} Days`,
      subtitle: `Longest: ${stats.longestStreak} days`,
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20',
      textColor: 'text-amber-400',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingCount,
      subtitle: `${stats.overdueCount} overdue`,
      icon: Clock,
      color: 'from-purple-500 to-indigo-600',
      glow: 'shadow-purple-glow',
      textColor: 'text-purple-400',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedCount,
      subtitle: 'Historical total',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-glow',
      textColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 ${card.glow}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-gradient-to-tr ${card.color} text-slate-950 shadow-md`}>
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor}`}>
                {card.value}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
