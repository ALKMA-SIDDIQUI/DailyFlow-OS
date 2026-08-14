import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetChallengeById, dbUpdateChallenge, dbDeleteChallenge, dbUpdateChallengeLog } from '@/lib/db-adapter';
import { getTodayDateString } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const challengeId = params.id;
  const challenge = await dbGetChallengeById(challengeId, user.id);

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or access denied' }, { status: 404 });
  }

  const todayStr = getTodayDateString();
  const logsList = challenge.logs || [];

  // Evaluate missed days for past pending logs
  for (const l of logsList) {
    if (l.date_str < todayStr && l.status === 'PENDING') {
      l.status = 'MISSED';
      await dbUpdateChallengeLog(l.id, user.id, { status: 'MISSED' });
    }
  }

  const completedCount = logsList.filter((l) => l.status === 'COMPLETED').length;
  const missedCount = logsList.filter((l) => l.status === 'MISSED').length;

  let streak = 0;
  let maxStreak = 0;
  for (const log of logsList) {
    if (log.status === 'COMPLETED') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (log.status === 'MISSED') {
      streak = 0;
    }
  }

  const newStatus = completedCount >= 21 ? 'COMPLETED' : challenge.status;
  const longestStreakVal = Math.max(challenge.longest_streak || 0, maxStreak);

  await dbUpdateChallenge(challengeId, user.id, {
    completed_days_count: completedCount,
    missed_days_count: missedCount,
    current_streak: streak,
    longest_streak: longestStreakVal,
    status: newStatus,
  });

  return NextResponse.json({
    challenge: {
      ...challenge,
      completed_days_count: completedCount,
      missed_days_count: missedCount,
      current_streak: streak,
      longest_streak: longestStreakVal,
      status: newStatus,
      logs: logsList,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const challengeId = params.id;
  const existing = await dbGetChallengeById(challengeId, user.id);

  if (!existing) {
    return NextResponse.json({ error: 'Challenge not found or access denied' }, { status: 404 });
  }

  await dbDeleteChallenge(challengeId, user.id);

  return NextResponse.json({ message: 'Challenge deleted successfully' });
}
