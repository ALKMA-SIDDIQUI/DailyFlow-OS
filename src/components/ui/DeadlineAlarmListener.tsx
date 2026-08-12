'use client';

import { useEffect } from 'react';
import { useToast } from './Toast';
import { playDeadlineAlarmSound } from '@/lib/alarms';

export function DeadlineAlarmListener() {
  const { showToast } = useToast();

  useEffect(() => {
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
            playDeadlineAlarmSound();
            showToast(`⏰ Deadline Approaching: "${task.title}" is due in ${reminderOffset} minutes!`, 'info');

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('DailyFlow Alarm', {
                body: `Deadline approaching: "${task.title}" is due soon.`,
                icon: '/favicon.ico'
              });
            }

            // Mark reminder sent in backend idempotently
            await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deadline_reminder_sent: 1 })
            });
          }

          // Check for overdue deadline
          const isTaskPastDeadline =
            task.due_date < todayStr ||
            (task.due_date === todayStr && currentMinutes >= deadlineMinutes);

          if (isTaskPastDeadline && !task.deadline_expired_sent) {
            playDeadlineAlarmSound();
            showToast(`🚨 Task Overdue: "${task.title}" has passed its deadline!`, 'error');

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('DailyFlow Overdue Alert', {
                body: `Task Overdue: "${task.title}" has passed its deadline!`,
                icon: '/favicon.ico'
              });
            }

            // Mark expired notification sent
            await fetch(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deadline_expired_sent: 1, status: 'OVERDUE' })
            });
          }
        }
      } catch (e) {
        // Ignore background polling errors
      }
    };

    // Run check immediately and then every 30s
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);

    return () => clearInterval(interval);
  }, [showToast]);

  return null;
}
