'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, CheckCircle2, Trophy, User } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Habits', href: '/dashboard/challenges', icon: Trophy },
    { label: 'Completed', href: '/dashboard/completed', icon: CheckCircle2 },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-2 py-2 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/30 shadow-vibe-glow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
