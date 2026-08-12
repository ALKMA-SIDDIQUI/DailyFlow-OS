import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';
import { Challenge, ChallengeLog } from '@/lib/types';
import { getTodayDateString, addDaysToDateString, getDaysDifference } from '@/lib/dates';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const todayStr = getTodayDateString();

  // Fetch user challenges
  const challenges = db.prepare(`
    SELECT * FROM challenges WHERE user_id = ? ORDER BY created_at DESC
  `).all(user.id) as Challenge[];

  // Evaluate missed days across all active challenges
  for (const c of challenges) {
    if (c.status === 'ACTIVE') {
      // Mark past pending logs as MISSED
      db.prepare(`
        UPDATE challenge_logs
        SET status = 'MISSED'
        WHERE challenge_id = ? AND date_str < ? AND status = 'PENDING'
      `).run(c.id, todayStr);

      // Recalculate stats for this challenge
      const logs = db.prepare('SELECT * FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(c.id) as ChallengeLog[];
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

      // Determine current active day based on today's date relative to start date
      const startDiff = getDaysDifference(c.start_date, todayStr);
      const calculatedCurrentDay = Math.min(21, Math.max(1, startDiff + 1));

      const newStatus = completedCount >= 21 ? 'COMPLETED' : 'ACTIVE';

      db.prepare(`
        UPDATE challenges
        SET completed_days_count = ?, missed_days_count = ?, current_streak = ?, longest_streak = ?, current_day = ?, status = ?
        WHERE id = ?
      `).run(completedCount, missedCount, streak, Math.max(c.longest_streak, maxStreak), calculatedCurrentDay, newStatus, c.id);

      c.completed_days_count = completedCount;
      c.missed_days_count = missedCount;
      c.current_streak = streak;
      c.longest_streak = Math.max(c.longest_streak, maxStreak);
      c.current_day = calculatedCurrentDay;
      c.status = newStatus;
      c.logs = logs;
    } else {
      c.logs = db.prepare('SELECT * FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(c.id) as ChallengeLog[];
    }
  }

  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, start_date } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Challenge title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanDesc = description ? description.trim() : null;
    const cleanCategory = category || 'Personal';
    const startDateStr = start_date || getTodayDateString();
    const endDateStr = addDaysToDateString(startDateStr, 20);

    const challengeId = generateId();
    const createdAt = new Date().toISOString();

    const db = getDb();

    // Insert challenge entity
    db.prepare(`
      INSERT INTO challenges (
        id, user_id, title, description, category, start_date, end_date,
        target_days, current_day, completed_days_count, missed_days_count,
        current_streak, longest_streak, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 21, 1, 0, 0, 0, 0, 'ACTIVE', ?)
    `).run(challengeId, user.id, cleanTitle, cleanDesc, cleanCategory, startDateStr, endDateStr, createdAt);

    // Create 21 daily challenge log entries
    const logInsertStmt = db.prepare(`
      INSERT INTO challenge_logs (id, challenge_id, user_id, day_number, date_str, status, task_id, completed_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, NULL)
    `);

    const taskInsertStmt = db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, description, category, priority, status,
        due_date, deadline_time, reminder_offset, is_random_eligible,
        completed_at, deadline_reminder_sent, deadline_expired_sent,
        challenge_id, challenge_day_num, created_at
      ) VALUES (?, ?, ?, ?, ?, 'High', 'PENDING', ?, '22:00', 30, 0, NULL, 0, 0, ?, ?, ?)
    `);

    // Create Day 1 task
    const day1TaskId = generateId();
    const day1TaskTitle = `${cleanTitle} (Day 1/21)`;
    taskInsertStmt.run(
      day1TaskId,
      user.id,
      day1TaskTitle,
      cleanDesc || `21-Day Consistency Challenge Day 1`,
      cleanCategory,
      startDateStr,
      challengeId,
      1,
      createdAt
    );

    // Populate logs for days 1..21
    for (let day = 1; day <= 21; day++) {
      const logId = generateId();
      const dayDateStr = addDaysToDateString(startDateStr, day - 1);
      const assignedTaskId = day === 1 ? day1TaskId : null;
      logInsertStmt.run(logId, challengeId, user.id, day, dayDateStr, assignedTaskId);
    }

    const createdChallenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId) as Challenge;
    createdChallenge.logs = db.prepare('SELECT * FROM challenge_logs WHERE challenge_id = ? ORDER BY day_number ASC').all(challengeId) as ChallengeLog[];

    return NextResponse.json({ challenge: createdChallenge, message: '21-Day Challenge started successfully!' }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to start challenge';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
