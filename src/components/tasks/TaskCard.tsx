'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { CheckCircle2, Circle, Clock, Calendar, AlertCircle, Trash2, Edit3, Flame, Trophy } from 'lucide-react';
import { playTaskCompleteSound } from '@/lib/alarms';
import { useToast } from '../ui/Toast';
import { formatPrettyDate, formatPrettyDateTime } from '@/lib/dates';

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdated, onEdit }) => {
  const { showToast } = useToast();
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleComplete = async () => {
    if (task.status === 'COMPLETED' || completing) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete task');

      playTaskCompleteSound();
      showToast(`✓ "${task.title}" completed!`, 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      onTaskUpdated();
    } catch (e) {
      showToast('Failed to mark task as completed', 'error');
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      showToast('Task deleted', 'info');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dailyflow_data_updated'));
      }
      onTaskUpdated();
    } catch (e) {
      showToast('Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Badge styling helpers
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-glow';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medium':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = task.status === 'OVERDUE';

  return (
    <div
      className={`glass-panel p-4 sm:p-5 rounded-2xl transition-all duration-300 hover:border-cyan-400/30 flex flex-col justify-between gap-3 ${
        isCompleted
          ? 'opacity-70 bg-slate-950/40 border-slate-800'
          : isOverdue
          ? 'border-rose-500/50 bg-rose-950/20 shadow-rose-glow'
          : 'hover:shadow-vibe-glow'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={handleToggleComplete}
            disabled={completing || isCompleted}
            className={`mt-1 shrink-0 transition-transform active:scale-90 ${
              isCompleted ? 'text-emerald-400 cursor-default' : 'text-slate-500 hover:text-cyan-400'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-sm sm:text-base leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority & Category Badges */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
          <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
            {task.priority}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {task.category}
          </span>
        </div>
      </div>

      {/* Footer Info: Deadline, Timestamps, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          {task.due_date && (
            <div className={`flex items-center gap-1 font-mono text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.due_date}</span>
              {task.deadline_time && (
                <span className="flex items-center gap-0.5 ml-1">
                  <Clock className="w-3 h-3" />
                  {task.deadline_time}
                </span>
              )}
            </div>
          )}

          {isCompleted && task.completed_at && (
            <div className="text-[11px] text-emerald-400 font-mono">
              Completed: {formatPrettyDateTime(task.completed_at)}
            </div>
          )}

          {task.challenge_id && (
            <div className="flex items-center gap-1 text-[11px] text-purple-400 font-mono">
              <Trophy className="w-3 h-3 text-purple-400" />
              <span>Challenge Day {task.challenge_day_num}/21</span>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 ml-auto">
          {!isCompleted && onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Edit Task"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
