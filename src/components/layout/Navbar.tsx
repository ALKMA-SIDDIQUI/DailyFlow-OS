'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { Flame, Plus, Dice5, Trophy, LogOut, User as UserIcon, Menu, X, ShieldCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';

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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* App Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-vibe-glow group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wider text-gradient-hero">
                DailyFlow
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 -mt-1 uppercase">
                Vibe OS
              </span>
            </div>
          </Link>

          {/* Current Streak Badge */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{streakCount} Day Streak</span>
            </div>
          )}
        </div>

        {/* Quick Action Buttons & Profile Menu */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenRandomTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all shadow-purple-glow active:scale-95"
              title="Select Random Mission"
            >
              <Dice5 className="w-4 h-4 text-purple-400 animate-spin-slow" />
              <span className="hidden md:inline">Random Task</span>
            </button>

            <button
              onClick={onOpenStartChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all shadow-emerald-glow active:scale-95"
              title="Start 21-Day Habit"
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">21-Day Habit</span>
            </button>

            <button
              onClick={onOpenCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-vibe-glow active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Task</span>
            </button>

            {/* Profile & Avatar */}
            <div className="relative group ml-2">
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 transition-colors">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-cyan-400/50 shadow-vibe-glow"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
