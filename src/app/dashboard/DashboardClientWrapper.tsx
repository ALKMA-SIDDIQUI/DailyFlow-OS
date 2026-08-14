'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { DeadlineAlarmListener } from '@/components/ui/DeadlineAlarmListener';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { RandomTaskModal } from '@/components/random/RandomTaskModal';
import { StartChallengeModal } from '@/components/challenges/StartChallengeModal';
import { useRouter } from 'next/navigation';

export function DashboardClientWrapper({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [randomTaskOpen, setRandomTaskOpen] = useState(false);
  const [startChallengeOpen, setStartChallengeOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const fetchUserStreak = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStreakCount(data.stats?.currentStreak || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUserStreak();

    const handleOpenCreateTask = () => setCreateTaskOpen(true);
    const handleOpenStartChallenge = () => setStartChallengeOpen(true);
    const handleOpenRandomTask = () => setRandomTaskOpen(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('dailyflow_open_create_task', handleOpenCreateTask);
      window.addEventListener('dailyflow_open_start_challenge', handleOpenStartChallenge);
      window.addEventListener('dailyflow_open_random_task', handleOpenRandomTask);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dailyflow_open_create_task', handleOpenCreateTask);
        window.removeEventListener('dailyflow_open_start_challenge', handleOpenStartChallenge);
        window.removeEventListener('dailyflow_open_random_task', handleOpenRandomTask);
      }
    };
  }, []);

  const handleTaskOrChallengeUpdated = () => {
    fetchUserStreak();
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <DeadlineAlarmListener />

      {/* Sticky Navbar Header */}
      <Navbar
        user={user}
        streakCount={streakCount}
        onOpenCreateTask={() => setCreateTaskOpen(true)}
        onOpenRandomTask={() => setRandomTaskOpen(true)}
        onOpenStartChallenge={() => setStartChallengeOpen(true)}
      />

      {/* Main Layout Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 pb-24 md:pb-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Android / Mobile Native Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Shared Modals */}
      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onTaskCreated={handleTaskOrChallengeUpdated}
      />

      <RandomTaskModal
        isOpen={randomTaskOpen}
        onClose={() => setRandomTaskOpen(false)}
        onTaskCompleted={handleTaskOrChallengeUpdated}
      />

      <StartChallengeModal
        isOpen={startChallengeOpen}
        onClose={() => setStartChallengeOpen(false)}
        onChallengeCreated={handleTaskOrChallengeUpdated}
      />
    </div>
  );
}
