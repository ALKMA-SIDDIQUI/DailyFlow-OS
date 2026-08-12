'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useToast } from './Toast';
import {
  startContinuousDeadlineAlarm,
  stopContinuousDeadlineAlarm,
  setAudioMuted,
  getAudioMuted,
} from '@/lib/alarms';
import { BellOff, Volume2, VolumeX, AlertTriangle, Clock, X, Check } from 'lucide-react';

interface ActiveAlarm {
  taskId: string;
  title: string;
  type: 'reminder' | 'overdue';
  offset?: number;
}

export function DeadlineAlarmListener() {
  const { showToast } = useToast();
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIsMuted(getAudioMuted());

    // Request Browser Notification permission if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    const checkDeadlines = async () => {
      try {
        const res = await fetch('/api/tasks?status=PENDING');
        if (!res.ok) return;
        const data = await res.json();
        const pendingTasks = data.tasks || [];

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const task of pendingTasks) {
          if (!task.due_date || !task.deadline_time) continue;

          const [h, m] = task.deadline_time.split(':').map(Number);
          const deadlineMinutes = h * 60 + m;
          const reminderOffset = task.reminder_offset || 30;
          const reminderMinutes = deadlineMinutes - reminderOffset;

          // Check for approaching reminder
          if (
            task.due_date === todayStr &&
            currentMinutes >= reminderMinutes &&
            currentMinutes < deadlineMinutes &&
            !task.deadline_reminder_sent
          ) {
            triggerAlarm({
              taskId: task.id,
              title: task.title,
              type: 'reminder',
              offset: reminderOffset,
            });

            showToast(`⏰ Deadline Approaching: "${task.title}" is due in ${reminderOffset} minutes!`, 'info');

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('DailyFlow Alarm', {
                body: `Deadline approaching: "${task.title}" is due in ${reminderOffset}m.`,
                icon: '/favicon.ico',
              });
            }

            // Mark reminder sent in backend
            await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deadline_reminder_sent: 1 }),
            });
            break;
          }

          // Check for overdue deadline
          const isTaskPastDeadline =
            task.due_date < todayStr ||
            (task.due_date === todayStr && currentMinutes >= deadlineMinutes);

          if (isTaskPastDeadline && !task.deadline_expired_sent) {
            triggerAlarm({
              taskId: task.id,
              title: task.title,
              type: 'overdue',
            });

            showToast(`🚨 Task Overdue: "${task.title}" has passed its deadline!`, 'error');

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('DailyFlow Overdue Alert', {
                body: `Task Overdue: "${task.title}" has passed its deadline!`,
                icon: '/favicon.ico',
              });
            }

            // Mark expired notification sent
            await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deadline_expired_sent: 1, status: 'OVERDUE' }),
            });
            break;
          }
        }
      } catch (e) {
        // Ignore background errors
      }
    };

    // Run check immediately and then every 30s
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);

    return () => clearInterval(interval);
  }, [showToast]);

  const triggerAlarm = (alarm: ActiveAlarm) => {
    setActiveAlarm(alarm);
    setCountdown(30);

    // Start 30-second continuous audio alarm
    startContinuousDeadlineAlarm(() => {
      // Auto-off callback after 30 seconds
      handleTurnOffAlarm();
    });

    // Start 30-second countdown for UI timer display
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleTurnOffAlarm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTurnOffAlarm = () => {
    stopContinuousDeadlineAlarm();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActiveAlarm(null);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setAudioMuted(newMuted);
    if (newMuted) {
      stopContinuousDeadlineAlarm();
    }
    showToast(newMuted ? 'Sound Alarms Muted' : 'Sound Alarms Enabled', 'info');
  };

  return (
    <>
      {/* Active Alarm Floating Banner (Popped up when alarm triggers) */}
      {activeAlarm && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-bounce">
          <div className="glass-panel p-4 rounded-2xl border-2 border-rose-500/80 bg-slate-950/95 shadow-rose-glow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>
                  {activeAlarm.type === 'overdue' ? '🚨 TASK OVERDUE ALARM' : '⏰ DEADLINE APPROACHING ALARM'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                  Auto-off in {countdown}s
                </span>
                <button
                  onClick={toggleMute}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-200">
              <p className="font-semibold text-sm text-slate-100">&quot;{activeAlarm.title}&quot;</p>
              <p className="text-slate-400 mt-0.5">
                {activeAlarm.type === 'overdue'
                  ? 'This task has passed its deadline! Alarm will automatically silence in 30s.'
                  : `This task is due in ${activeAlarm.offset || 30} minutes!`}
              </p>
            </div>

            {/* Manual Turn Off Alarm Button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleTurnOffAlarm}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-rose-glow transition-all active:scale-95"
              >
                <BellOff className="w-4 h-4" />
                <span>Turn Off Alarm & Sound</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
