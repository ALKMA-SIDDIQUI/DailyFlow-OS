import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Challenge, ChallengeLog } from '@/lib/types';
import { getTodayDateString } from '@/lib/dates';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const challengeId = params.id;
  const db = getDb();

  // Enforce ownership authorization check (IDOR Protection)
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND user_id = ?').get(challengeId, user.id) as Challenge | undefined;

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or access denied' }, { status: 404 });
  }

  // Evaluate missed days for past pending logs
  const todayStr = getTodayDateString();
  try {
    db.prepare(`
      UPDATE challenge_logs
      SET status = 'MISSED'
      WHERE challenge_id = ? AND date_str < ? AND status = 'PENDING'
    `).run(challengeId, todayStr);
  } catch (e) {}

  const logs = db.prepare('SELECT * FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(challengeId) as ChallengeLog[];

  const completedCount = logs.filter(l => l.status === 'COMPLETED').length;
  const missedCount = logs.filter(l => l.status === 'MISSED').length;

  let streak = 0;
  let maxStreak = 0;
  for (const log of logs) {
    if (log.status === 'COMPLETED') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (log.status === 'MISSED') {
      streak = 0;
    }
  }

  const newStatus = completedCount >= 21 ? 'COMPLETED' : challenge.status;

  db.prepare(`
    UPDATE challenges
    SET completed_days_count = ?, missed_days_count = ?, current_streak = ?, longest_streak = ?, status = ?
    WHERE id = ? AND user_id = ?
  `).run(completedCount, missedCount, streak, Math.max(challenge.longest_streak, maxStreak), newStatus, challengeId, user.id);

  challenge.completed_days_count = completedCount;
  challenge.missed_days_count = missedCount;
  challenge.current_streak = streak;
  challenge.longest_streak = Math.max(challenge.longest_streak, maxStreak);
  challenge.status = newStatus;
  challenge.logs = logs;

  return NextResponse.json({ challenge });
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
  const db = getDb();

  // Enforce ownership authorization check (IDOR Protection)
  const existing = db.prepare('SELECT id FROM challenges WHERE id = ? AND user_id = ?').get(challengeId, user.id);
  if (!existing) {
    return NextResponse.json({ error: 'Challenge not found or access denied' }, { status: 404 });
  }

  // Delete associated tasks linked to this challenge
  db.prepare('DELETE FROM tasks WHERE challenge_id = ? AND user_id = ?').run(challengeId, user.id);

  // Delete challenge logs
  db.prepare('DELETE FROM challenge_logs WHERE challenge_id = ? AND user_id = ?').run(challengeId, user.id);

  // Delete challenge entity
  db.prepare('DELETE FROM challenges WHERE id = ? AND user_id = ?').run(challengeId, user.id);

  return NextResponse.json({ message: 'Challenge deleted successfully' });
}
