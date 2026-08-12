'use client';

import React, { useState, useEffect } from 'react';
import { ChallengeGrid } from '@/components/challenges/ChallengeGrid';
import { Challenge } from '@/lib/types';
import { Trophy } from 'lucide-react';

export default function ChallengesHubPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges');
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();

    const handleDataUpdated = () => {
      fetchChallenges();
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-slate-100">21-Day Habit Consistency Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build permanent habits through 21 consecutive days of focused execution
          </p>
        </div>
      </div>

      {/* Challenges List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">Loading habits...</div>
      ) : challenges.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-white/10">
          <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-base text-slate-200">No active 21-day habits</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Start a 21-day challenge today to build your daily consistency grid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {challenges.map((challenge) => (
            <ChallengeGrid
              key={challenge.id}
              challenge={challenge}
              onChallengeUpdated={fetchChallenges}
            />
          ))}
        </div>
      )}
    </div>
  );
}
