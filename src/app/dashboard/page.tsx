'use client';

import React, { useState, useEffect } from 'react';
import { StatCards } from '@/components/dashboard/StatCards';
import { ContributionChart } from '@/components/dashboard/ContributionChart';
import { DailyProgressBarChart } from '@/components/dashboard/DailyProgressBarChart';
import { TaskCard } from '@/components/tasks/TaskCard';
import { ChallengeGrid } from '@/components/challenges/ChallengeGrid';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { Task, Challenge, DashboardStats, ActivityHeatmapDay, User } from '@/lib/types';
import { Sparkles, Trophy, CheckSquare, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayTasksCount: 0,
    pendingCount: 0,
    completedCount: 0,
    overdueCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    activeChallengesCount: 0,
    completedChallengesCount: 0,
    todayCompletionRate: 0,
    dailyProgress: [],
    heatmap: [],
  });

  const triggerStartChallenge = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dailyflow_open_start_challenge'));
    }
  };

  const [heatmap, setHeatmap] = useState<ActivityHeatmapDay[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchDashboardData = async () => {
    try {
      const profileRes = await fetch('/api/profile', { cache: 'no-store' });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        if (pData.user) {
          setUser(pData.user);
        }
        if (pData.stats) {
          setStats(pData.stats);
          setHeatmap(pData.stats.heatmap || []);
        }
      } else {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) setUser(meData.user);
        }
      }

      const tasksRes = await fetch('/api/tasks?status=PENDING', { cache: 'no-store' });
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTodayTasks(tData.tasks || []);
      }

      const chalRes = await fetch('/api/challenges', { cache: 'no-store' });
      if (chalRes.ok) {
        const cData = await chalRes.json();
        setChallenges(cData.challenges || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleDataUpdated = () => {
      fetchDashboardData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dailyflow_data_updated', handleDataUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dailyflow_data_updated', handleDataUpdated);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-widest uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              <span>User Productivity Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gradient-hero">
              Welcome {user ? user.full_name : ''} on DailyFlow OS
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Track your daily tasks, maintain your 21-day consistency streaks, and level up your productivity workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <StatCards stats={stats} />

      {/* Daily Progress Bar Chart (Today % & Past Days Report) */}
      <DailyProgressBarChart dailyProgress={stats.dailyProgress} />

      {/* Activity Heatmap Chart */}
      <ContributionChart heatmap={heatmap} />

      {/* 21-Day Habit Challenges Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-lg text-slate-100">21-Day Consistency Habits</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={triggerStartChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-emerald-glow transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Start Habit</span>
            </button>
            <Link
              href="/dashboard/challenges"
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              View All Habits →
            </Link>
          </div>
        </div>

        {challenges.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-white/10">
            <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="font-bold text-sm text-slate-200">Ready to build a 21-day habit?</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Commit to 21 consecutive days of consistent action and watch your streak explode.
            </p>
            <button
              onClick={triggerStartChallenge}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-emerald-glow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Begin 21-Day Journey</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {challenges.slice(0, 2).map((challenge) => (
              <ChallengeGrid
                key={challenge.id}
                challenge={challenge}
                onChallengeUpdated={fetchDashboardData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending Missions Board */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="font-extrabold text-lg text-slate-100">Active Mission Board</h2>
          </div>
          <Link
            href="/dashboard/tasks"
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            View All Tasks →
          </Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center border border-dashed border-white/10">
            <CheckSquare className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="font-bold text-sm text-slate-200">Your mission board is clear</h3>
            <p className="text-xs text-slate-400 mt-1">
              You have completed all pending tasks! Click &quot;New Task&quot; to queue up your next mission.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayTasks.slice(0, 6).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskUpdated={fetchDashboardData}
                onEdit={(t) => setEditingTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={fetchDashboardData}
      />
    </div>
  );
}
