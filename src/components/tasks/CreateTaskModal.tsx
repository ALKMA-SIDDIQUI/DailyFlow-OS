'use client';

import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, Bell, Sparkles } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getTodayDateString } from '@/lib/dates';
import { TaskCategory, TaskPriority } from '@/lib/types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [reminderOffset, setReminderOffset] = useState(30);
  const [isRandomEligible, setIsRandomEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          due_date: dueDate,
          deadline_time: deadlineTime,
          reminder_offset: Number(reminderOffset),
          is_random_eligible: isRandomEligible,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      showToast('Task created successfully!', 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      setTitle('');
      setDescription('');
      onTaskCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating task';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-float">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto glass-panel-glow p-6 rounded-2xl shadow-vibe-glow border border-cyan-500/30">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-gradient-cyan">Create New Mission Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Study Java DSA & Algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Detail mission goals or study topics..."
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
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
                <option value="Coding">Coding</option>
                <option value="Health">Health</option>
                <option value="Fitness">Fitness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Deadline Time
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Reminder Alarm
              </label>
              <select
                value={reminderOffset}
                onChange={(e) => setReminderOffset(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              >
                <option value={15}>15 mins before</option>
                <option value={30}>30 mins before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="randomEligible"
                checked={isRandomEligible}
                onChange={(e) => setIsRandomEligible(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 accent-cyan-400 cursor-pointer"
              />
              <label htmlFor="randomEligible" className="text-xs text-slate-300 cursor-pointer select-none">
                Eligible for 🎲 Random Task
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-vibe-glow transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Creating...' : 'Create Mission'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
