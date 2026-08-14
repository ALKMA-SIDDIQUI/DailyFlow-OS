'use client';

import React, { useState } from 'react';
import { X, Trophy, Sparkles, Calendar } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getTodayDateString } from '@/lib/dates';
import { TaskCategory } from '@/lib/types';

interface StartChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

export const StartChallengeModal: React.FC<StartChallengeModalProps> = ({ isOpen, onClose, onChallengeCreated }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          start_date: startDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start challenge');

      showToast('🎉 21-Day Habit Challenge Started!', 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      setTitle('');
      setDescription('');
      onChallengeCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting challenge';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto glass-panel-glow p-6 rounded-2xl border border-emerald-500/40 shadow-emerald-glow">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-gradient-hero">Start 21-Day Consistency Habit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Science shows it takes 21 consecutive days to forge a new habit. DailyFlow will guide your daily progress, track your streaks, and build your consistency chart.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Habit Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Study Java DSA for 1 Hour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Why is this habit important to your growth?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              >
                <option value="Study">Study</option>
                <option value="Coding">Coding</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-emerald-glow transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Initiating...' : 'Begin 21-Day Journey'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
