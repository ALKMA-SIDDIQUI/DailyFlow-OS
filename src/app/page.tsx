import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldCheck, Trophy, Dice5, Flame, Clock, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-vibe-glow">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-wider text-gradient-hero">
              DailyFlow
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 shadow-vibe-glow transition-all active:scale-95"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-vibe-glow">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Next-Gen VibeCode Productivity OS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-gradient-hero leading-[1.1]">
          Master Consistency. Execute Tasks. Conquer Habits.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          DailyFlow pairs normal task management with 21-day consistency habit tracking, 🎲 mission randomizer, Web Audio deadline alarms, and interactive activity charts.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-extrabold text-sm shadow-vibe-glow transition-all hover:scale-105 active:scale-95"
          >
            <span>Start Your 21-Day Journey</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-2xl glass-panel text-slate-200 hover:text-white font-bold text-sm hover:border-cyan-400/40 transition-all"
          >
            Existing User Sign In
          </Link>
        </div>

        {/* Core Pillars Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition-all shadow-glass">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">21-Day Habit Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Build unshakeable consistency. Automatically advance daily occurrences, visualize missed days, and preserve streak history.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-400/40 transition-all shadow-glass">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
              <Dice5 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">🎲 Mission Randomizer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Break decision fatigue. Spin your task pool in slot-machine style and complete random missions instantly.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all shadow-glass">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">Deadline & Sound Alarms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Idempotent reminder alerts with Web Audio API sound synthesis prevent overdue tasks before they happen.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>© 2026 DailyFlow Vibe OS • Engineered for Peak Productivity</p>
      </footer>
    </div>
  );
}
