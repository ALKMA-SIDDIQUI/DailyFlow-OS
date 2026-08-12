'use client';

import React, { useState, useEffect } from 'react';
import { ChallengeGrid } from '@/components/challenges/ChallengeGrid';
import { Challenge } from '@/lib/types';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SingleChallengePage({ params }: { params: { id: string } }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/challenges/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setChallenge(data.challenge || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [params.id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs font-mono">Loading challenge details...</div>;
  }

  if (!challenge) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-white/10">
        <h3 className="font-bold text-base text-slate-200">Challenge Not Found</h3>
        <Link href="/dashboard/challenges" className="text-xs text-cyan-400 font-semibold hover:underline mt-2 inline-block">
          ← Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/challenges" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Habits</span>
      </Link>

      <ChallengeGrid
        challenge={challenge}
        onChallengeUpdated={fetchChallenge}
      />
    </div>
  );
}
