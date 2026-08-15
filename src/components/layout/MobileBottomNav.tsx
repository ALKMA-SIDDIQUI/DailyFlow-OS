'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  CheckCircle2,
  Trophy,
  User,
  LogOut,
  Sun,
  Moon,
  Plus,
  X,
  Dice5,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useTheme } from '../ui/ThemeProvider';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

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

  const triggerEvent = (eventName: string) => {
    setQuickMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(eventName));
    }
  };

  const mainNav = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Habits', href: '/dashboard/challenges', icon: Trophy },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Action Sheet Drawer */}
      {quickMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-float">
          <div className="glass-panel-glow p-5 rounded-t-3xl border-t border-cyan-500/30 flex flex-col gap-3 shadow-vibe-glow">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-gradient-cyan">Quick Creation & Actions</h3>
              </div>
              <button
                onClick={() => setQuickMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => triggerEvent('dailyflow_open_start_challenge')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-emerald-glow active:scale-95 text-left"
              >
                <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span>Start 21-Day Habit</span>
                  <span className="text-[10px] text-emerald-400/80 font-normal">Build daily streak</span>
                </div>
              </button>

              <button
                onClick={() => triggerEvent('dailyflow_open_create_task')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs shadow-vibe-glow active:scale-95 text-left"
              >
                <Plus className="w-5 h-5 text-cyan-400 stroke-[3] shrink-0" />
                <div className="flex flex-col">
                  <span>Create Task</span>
                  <span className="text-[10px] text-cyan-400/80 font-normal">New mission goal</span>
                </div>
              </button>

              <button
                onClick={() => triggerEvent('dailyflow_open_random_task')}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs shadow-purple-glow active:scale-95 text-left"
              >
                <Dice5 className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span>Random Task</span>
                  <span className="text-[10px] text-purple-400/80 font-normal">Pick next action</span>
                </div>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setQuickMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 font-bold text-xs active:scale-95 text-left"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Toggle visuals</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-3 py-1.5 backdrop-blur-xl pb-safe">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainNav.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 shadow-vibe-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[9px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Central Plus Create Button */}
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-slate-950 font-extrabold shadow-vibe-glow border-2 border-slate-950 active:scale-90 transition-transform"
            title="Create Task or Habit"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {mainNav.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 shadow-vibe-glow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[9px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
