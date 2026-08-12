'use client';

import React, { useState, useEffect } from 'react';
import { X, Dice5, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { Task } from '@/lib/types';
import { playRandomTaskTickSound, playRandomTaskSelectSound, playTaskCompleteSound } from '@/lib/alarms';
import { useToast } from '../ui/Toast';

interface RandomTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted: () => void;
}

export const RandomTaskModal: React.FC<RandomTaskModalProps> = ({ isOpen, onClose, onTaskCompleted }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [displayTitle, setDisplayTitle] = useState('Initiating Mission Randomizer...');
  const [emptyState, setEmptyState] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchRandomTask = async () => {
    setLoading(true);
    setSpinning(true);
    setEmptyState(false);
    setSelectedTask(null);

    const placeholderTitles = [
      '⚡ Revising Data Structures & Algorithms',
      '🎯 Completing System Architecture Review',
      '🔥 Practicing 1 Hour Focused Coding',
      '🧠 Reading Technical Documentation',
      '🚀 Optimizing Database Queries',
      '💪 Completing Daily Physical Workout'
    ];

    // Play slot machine ticker animation
    let count = 0;
    const interval = setInterval(() => {
      setDisplayTitle(placeholderTitles[count % placeholderTitles.length]);
      playRandomTaskTickSound();
      count++;
    }, 100);

    try {
      const res = await fetch('/api/tasks/random');
      const data = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        setSpinning(false);
        setLoading(false);

        if (!data.task) {
          setEmptyState(true);
          setDisplayTitle('No random tasks available. Add some tasks first.');
        } else {
          setSelectedTask(data.task);
          setDisplayTitle(data.task.title);
          playRandomTaskSelectSound();
        }
      }, 1500);
    } catch (e) {
      clearInterval(interval);
      setSpinning(false);
      setLoading(false);
      showToast('Error selecting random task', 'error');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRandomTask();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCompleteRandom = async () => {
    if (!selectedTask || completing) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/complete`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to complete task');

      playTaskCompleteSound();
      showToast(`✓ Mission Accomplished: "${selectedTask.title}"!`, 'success');
      onTaskCompleted();
      onClose();
    } catch (e) {
      showToast('Failed to complete task', 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel-glow p-6 rounded-2xl border border-purple-500/40 shadow-purple-glow text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-purple-glow flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Dice5 className={`w-7 h-7 text-purple-400 ${spinning ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gradient-hero mb-1">
          {spinning ? '🎲 Randomizing Mission...' : emptyState ? 'No Tasks Available' : 'Your Next Mission'}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {spinning ? 'Fate is choosing your next task...' : 'Accept the mission and boost your streak!'}
        </p>

        {/* Selected Mission Box */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10 mb-6 min-h-[100px] flex flex-col items-center justify-center gap-2">
          {spinning ? (
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
              <Zap className="w-4 h-4 animate-bounce" />
              <span>{displayTitle}</span>
            </div>
          ) : emptyState ? (
            <div className="text-slate-400 text-xs py-2">
              <p>Your random mission queue is empty.</p>
              <p className="mt-1 text-cyan-400">Create new tasks and ensure &quot;Random Task Eligibility&quot; is enabled!</p>
            </div>
          ) : (
            <>
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                [{selectedTask?.category}] • {selectedTask?.priority} Priority
              </span>
              <h4 className="text-base font-bold text-slate-100">{selectedTask?.title}</h4>
              {selectedTask?.description && (
                <p className="text-xs text-slate-400">{selectedTask.description}</p>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={fetchRandomTask}
            disabled={spinning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
            <span>Spin Again</span>
          </button>

          {selectedTask && !spinning && (
            <button
              onClick={handleCompleteRandom}
              disabled={completing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-emerald-glow transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completing ? 'Completing...' : 'Complete Mission'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
