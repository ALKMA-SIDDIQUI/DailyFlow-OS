'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/types';
import { Trophy, Flame, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { playTaskCompleteSound } from '@/lib/alarms';
import { useToast } from '../ui/Toast';
import { getTodayDateString } from '@/lib/dates';

interface ChallengeGridProps {
  challenge: Challenge;
  onChallengeUpdated: () => void;
}

export const ChallengeGrid: React.FC<ChallengeGridProps> = ({ challenge, onChallengeUpdated }) => {
  const { showToast } = useToast();
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const todayStr = getTodayDateString();

  const handleCompleteToday = async () => {
    if (completing) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/challenges/${challenge.id}/complete-today`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete challenge day');

      playTaskCompleteSound();
      showToast(data.message || 'Today’s challenge completed!', 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      onChallengeUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error completing challenge day';
      showToast(msg, 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (deleting) return;
    if (!confirm(`Are you sure you want to delete the 21-Day Habit "${challenge.title}"?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete challenge');

      showToast('21-Day Habit Challenge deleted', 'info');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      onChallengeUpdated();
    } catch (e) {
      showToast('Failed to delete challenge', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const logs = challenge.logs || [];
  const todayLog = logs.find(l => l.date_str === todayStr) || logs.find(l => l.day_number === challenge.current_day);
  const isTodayCompleted = todayLog?.status === 'COMPLETED';

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all shadow-glass flex flex-col gap-4">
      {/* Challenge Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="font-bold text-base sm:text-lg text-slate-100">{challenge.title}</h3>
          </div>
          {challenge.description && (
            <p className="text-xs text-slate-400 mt-1">{challenge.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Day {challenge.current_day}/21
          </span>
          <div className="flex items-center gap-1 text-amber-400 font-mono text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
            <span>{challenge.current_streak} Streak</span>
          </div>
          {/* Delete Challenge Button */}
          <button
            onClick={handleDeleteChallenge}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ml-1"
            title="Delete 21-Day Habit Challenge"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 21-Day Visual Grid Blocks */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
          <span>21-Day Habit Journey</span>
          <span>{challenge.completed_days_count}/21 Days Completed</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 21 }).map((_, index) => {
            const dayNum = index + 1;
            const log = logs.find(l => l.day_number === dayNum);
            const status = log ? log.status : 'PENDING';
            const isToday = log ? log.date_str === todayStr : dayNum === challenge.current_day;

            let blockStyle = 'bg-slate-900/60 border-slate-800 text-slate-500';
            let icon = null;

            if (status === 'COMPLETED') {
              blockStyle = 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-emerald-glow';
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
            } else if (status === 'MISSED') {
              blockStyle = 'bg-rose-500/30 border-rose-400 text-rose-300 shadow-rose-glow';
              icon = <XCircle className="w-3.5 h-3.5 text-rose-400" />;
            } else if (isToday) {
              blockStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse shadow-vibe-glow ring-1 ring-cyan-400';
            }

            return (
              <div
                key={dayNum}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${blockStyle}`}
                title={`Day ${dayNum} - ${status}${log ? ` (${log.date_str})` : ''}`}
              >
                <span className="text-[10px] font-mono font-bold">D{dayNum}</span>
                {icon ? (
                  <div className="mt-0.5">{icon}</div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">{isToday ? 'Today' : ''}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Summary Footer & Quick Completion */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="text-xs text-slate-300 font-mono">
          Completed <span className="text-emerald-400 font-bold">{challenge.completed_days_count}</span> days,
          Missed <span className="text-rose-400 font-bold">{challenge.missed_days_count}</span> days,
          Current streak: <span className="text-amber-400 font-bold">{challenge.current_streak}</span> days
        </div>

        {challenge.status === 'ACTIVE' && (
          <button
            onClick={handleCompleteToday}
            disabled={completing || isTodayCompleted}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              isTodayCompleted
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-glow'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isTodayCompleted ? 'Today Completed ✓' : completing ? 'Recording...' : 'Complete Today’s Habit'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
