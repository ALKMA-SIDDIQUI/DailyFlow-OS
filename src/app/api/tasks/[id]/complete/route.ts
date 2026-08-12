import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Task, Challenge } from '@/lib/types';
import { getTodayDateString } from '@/lib/dates';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskId = params.id;
  const db = getDb();

  // Enforce ownership authorization check (IDOR Protection)
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, user.id) as Task | undefined;
  if (!task) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  const completedAt = new Date().toISOString();

  // Update task state in database
  db.prepare(`
    UPDATE tasks
    SET status = 'COMPLETED', completed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(completedAt, taskId, user.id);

  // If this task belongs to a 21-Day Challenge, update challenge state as well
  if (task.challenge_id && task.challenge_day_num) {
    db.prepare(`
      UPDATE challenge_logs
      SET status = 'COMPLETED', completed_at = ?
      WHERE challenge_id = ? AND day_number = ? AND user_id = ?
    `).run(completedAt, task.challenge_id, task.challenge_day_num, user.id);

    // Recalculate challenge progress & streak
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND user_id = ?').get(task.challenge_id, user.id) as Challenge | undefined;

    if (challenge) {
      const logs = db.prepare('SELECT day_number, status, date_str FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(challenge.id) as { day_number: number; status: string; date_str: string }[];

      const completedCount = logs.filter(l => l.status === 'COMPLETED').length;
      const missedCount = logs.filter(l => l.status === 'MISSED').length;

      // Calculate current streak for challenge
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

      const challengeStatus = completedCount >= 21 ? 'COMPLETED' : 'ACTIVE';
      const nextDay = Math.min(21, challenge.current_day + 1);

      db.prepare(`
        UPDATE challenges
        SET completed_days_count = ?,
            missed_days_count = ?,
            current_streak = ?,
            longest_streak = ?,
            current_day = ?,
            status = ?
        WHERE id = ?
      `).run(
        completedCount,
        missedCount,
        streak,
        Math.max(challenge.longest_streak, maxStreak),
        nextDay,
        challengeStatus,
        challenge.id
      );
    }
  }

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;

  return NextResponse.json({
    task: updatedTask,
    message: 'Task completed successfully!'
  });
}
