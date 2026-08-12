import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';
import { Challenge, ChallengeLog } from '@/lib/types';
import { getTodayDateString, addDaysToDateString } from '@/lib/dates';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const challengeId = params.id;
  const db = getDb();
  const todayStr = getTodayDateString();
  const completedAt = new Date().toISOString();

  // Enforce ownership authorization check (IDOR Protection)
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND user_id = ?').get(challengeId, user.id) as Challenge | undefined;

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found or access denied' }, { status: 404 });
  }

  // Find the log entry for current_day or today's date
  let currentLog = db.prepare(`
    SELECT * FROM challenge_logs
    WHERE challenge_id = ? AND (day_number = ? OR date_str = ?)
    ORDER BY day_number ASC
  `).get(challengeId, challenge.current_day, todayStr) as ChallengeLog | undefined;

  if (!currentLog) {
    return NextResponse.json({ error: 'No active challenge day found to complete' }, { status: 400 });
  }

  if (currentLog.status === 'COMPLETED') {
    return NextResponse.json({ message: 'Today’s challenge occurrence is already completed!', challenge });
  }

  // Mark log as completed
  db.prepare(`
    UPDATE challenge_logs
    SET status = 'COMPLETED', completed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(completedAt, currentLog.id, user.id);

  // If a task was linked to this log, update task status as well
  if (currentLog.task_id) {
    db.prepare(`
      UPDATE tasks
      SET status = 'COMPLETED', completed_at = ?
      WHERE id = ? AND user_id = ?
    `).run(completedAt, currentLog.task_id, user.id);
  }

  // Recalculate logs & streak
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

  const nextDayNum = currentLog.day_number + 1;
  const challengeStatus = completedCount >= 21 ? 'COMPLETED' : 'ACTIVE';

  // If there's a next day (<= 21), create the task for next day
  if (nextDayNum <= 21) {
    const nextLog = logs.find(l => l.day_number === nextDayNum);
    if (nextLog && !nextLog.task_id) {
      const nextTaskId = generateId();
      const nextTaskTitle = `${challenge.title} (Day ${nextDayNum}/21)`;
      const nextDueDate = addDaysToDateString(challenge.start_date, nextDayNum - 1);

      db.prepare(`
        INSERT INTO tasks (
          id, user_id, title, description, category, priority, status,
          due_date, deadline_time, reminder_offset, is_random_eligible,
          completed_at, deadline_reminder_sent, deadline_expired_sent,
          challenge_id, challenge_day_num, created_at
        ) VALUES (?, ?, ?, ?, ?, 'High', 'PENDING', ?, '22:00', 30, 0, NULL, 0, 0, ?, ?, ?)
      `).run(
        nextTaskId,
        user.id,
        nextTaskTitle,
        challenge.description || `21-Day Consistency Challenge Day ${nextDayNum}`,
        challenge.category,
        nextDueDate,
        challengeId,
        nextDayNum,
        completedAt
      );

      // Link task to next day log
      db.prepare('UPDATE challenge_logs SET task_id = ? WHERE id = ?').run(nextTaskId, nextLog.id);
    }
  }

  db.prepare(`
    UPDATE challenges
    SET completed_days_count = ?,
        missed_days_count = ?,
        current_streak = ?,
        longest_streak = ?,
        current_day = ?,
        status = ?
    WHERE id = ? AND user_id = ?
  `).run(
    completedCount,
    missedCount,
    streak,
    Math.max(challenge.longest_streak, maxStreak),
    Math.min(21, nextDayNum),
    challengeStatus,
    challengeId,
    user.id
  );

  const updatedChallenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId) as Challenge;
  updatedChallenge.logs = db.prepare('SELECT * FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(challengeId) as ChallengeLog[];

  return NextResponse.json({
    challenge: updatedChallenge,
    message: `Day ${currentLog.day_number} of 21 completed! Streak: ${streak} days.`
  });
}
