'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Flame, Plus, Dice5, Trophy, LogOut, ShieldCheck, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { setAudioMuted, getAudioMuted } from '@/lib/alarms';
import { useTheme } from '../ui/ThemeProvider';

interface NavbarProps {
  user: User | null;
  onOpenCreateTask: () => void;
  onOpenRandomTask: () => void;
  onOpenStartChallenge: () => void;
  streakCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenCreateTask,
  onOpenRandomTask,
  onOpenStartChallenge,
  streakCount = 0,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(getAudioMuted());
  }, []);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setAudioMuted(nextMuted);
    showToast(nextMuted ? 'Audio alarms muted' : 'Audio alarms enabled', 'info');
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('Logged out successfully', 'info');
      router.push('/login');
      router.refresh();
    } catch (e) {
      showToast('Failed to logout', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-3 lg:px-8 py-2.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* App Logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-vibe-glow group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-wider text-gradient-hero">
                DailyFlow
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyan-400/80 -mt-1 uppercase">
                Vibe OS
              </span>
            </div>
          </Link>

          {/* Current Streak Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{streakCount} Day Streak</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons & Profile Menu */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all border bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-300 active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              ) : (
                <Moon className="w-4 h-4 text-purple-400 fill-purple-400/20" />
              )}
            </button>

            {/* Audio Mute/Unmute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl transition-colors border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-cyan-300'
              }`}
              title={isMuted ? 'Unmute Audio Alarms' : 'Mute Audio Alarms'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={onOpenRandomTask}
              className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all shadow-purple-glow active:scale-95"
              title="Select Random Mission"
            >
              <Dice5 className="w-4 h-4 text-purple-400 animate-spin-slow" />
              <span className="hidden md:inline">Random Task</span>
            </button>

            <button
              onClick={onOpenStartChallenge}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all shadow-emerald-glow active:scale-95"
              title="Start 21-Day Habit"
            >
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">21-Day Habit</span>
            </button>

            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition-all shadow-vibe-glow active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Profile & Avatar */}
            <div className="relative group">
              <Link href="/dashboard/profile" className="flex items-center gap-2 p-0.5 rounded-full hover:bg-white/5 transition-colors">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-cyan-400/50 shadow-vibe-glow"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-vibe-glow transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
