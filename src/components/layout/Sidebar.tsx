'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CheckSquare, CheckCircle2, Trophy, User, LogOut, Sun, Moon } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useTheme } from '../ui/ThemeProvider';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

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

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Active Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Completed History', href: '/dashboard/completed', icon: CheckCircle2 },
    { label: '21-Day Challenges', href: '/dashboard/challenges', icon: Trophy },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 glass-panel md:min-h-[calc(100vh-65px)] border-r border-white/10 p-4 flex flex-col justify-between">
      <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 shadow-vibe-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Theme Toggle & Logout Controls on Sidebar */}
      <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-white/10 mt-auto">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-300 hover:bg-white/5 transition-all w-full text-left"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-rose-400 hover:bg-rose-500/10 transition-all w-full text-left"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="font-bold">Log Out</span>
        </button>
      </div>
    </aside>
  );
};
