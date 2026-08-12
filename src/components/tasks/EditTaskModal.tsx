'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { Task, TaskCategory, TaskPriority } from '@/lib/types';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onTaskUpdated }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('22:00');
  const [reminderOffset, setReminderOffset] = useState(30);
  const [isRandomEligible, setIsRandomEligible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCategory(task.category || 'Personal');
      setPriority(task.priority || 'Medium');
      setDueDate(task.due_date || '');
      setDeadlineTime(task.deadline_time || '22:00');
      setReminderOffset(task.reminder_offset || 30);
      setIsRandomEligible(Boolean(task.is_random_eligible));
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
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
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      showToast('Task updated successfully!', 'success');
      onTaskUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating task';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto glass-panel-glow p-6 rounded-2xl shadow-vibe-glow border border-purple-500/30">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-gradient-purple">Edit Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline Time</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-purple-glow transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
