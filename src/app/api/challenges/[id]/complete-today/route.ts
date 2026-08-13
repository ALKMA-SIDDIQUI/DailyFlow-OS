import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetChallengeById, dbCreateTask, dbUpdateChallengeLog, dbUpdateChallenge } from '@/lib/db-adapter';
import { Task } from '@/lib/types';
import { getTodayDateString } from '@/lib/dates';

export async function POST(
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

  let targetLog = logsList.find((l) => l.date_str === todayStr);
  if (!targetLog) {
    targetLog = logsList.find((l) => l.day_number === challenge.current_day);
  }

  if (!targetLog) {
    return NextResponse.json({ error: 'No active challenge day log found for today' }, { status: 400 });
  }

  if (targetLog.status === 'COMPLETED') {
    return NextResponse.json({ message: 'Today’s habit was already completed!' });
  }

  const nowISO = new Date().toISOString();

  // Create linked completed task
  const taskId = crypto.randomUUID();
  const newTask: Task = {
    id: taskId,
    user_id: user.id,
    title: `${challenge.title} (Day ${targetLog.day_number}/21)`,
    description: challenge.description || `Completed Day ${targetLog.day_number} of 21-day habit challenge`,
    category: challenge.category || 'Personal',
    priority: 'High',
    status: 'COMPLETED',
    due_date: todayStr,
    deadline_time: '22:00',
    reminder_offset: 30,
    is_random_eligible: false,
    completed_at: nowISO,
    deadline_reminder_sent: false,
    deadline_expired_sent: false,
    challenge_id: challengeId,
    challenge_day_num: targetLog.day_number,
    created_at: nowISO,
  };

  await dbCreateTask(newTask);

  // Mark challenge log completed
  await dbUpdateChallengeLog(targetLog.id, user.id, {
    status: 'COMPLETED',
    task_id: taskId,
    completed_at: nowISO,
  });

  // Update in-memory log list for stats computation
  targetLog.status = 'COMPLETED';

  const completedCount = logsList.filter((l) => l.status === 'COMPLETED').length;
  const missedCount = logsList.filter((l) => l.status === 'MISSED').length;

  let streak = 0;
  let maxStreak = 0;
  for (const l of logsList) {
    if (l.status === 'COMPLETED') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (l.status === 'MISSED') {
      streak = 0;
    }
  }

  const nextDay = Math.min(21, challenge.current_day + 1);
  const newStatus = completedCount >= 21 ? 'COMPLETED' : 'ACTIVE';
  const longestStreakVal = Math.max(challenge.longest_streak || 0, maxStreak);

  await dbUpdateChallenge(challengeId, user.id, {
    current_day: nextDay,
    completed_days_count: completedCount,
    missed_days_count: missedCount,
    current_streak: streak,
    longest_streak: longestStreakVal,
    status: newStatus,
  });

  return NextResponse.json({
    message: `Day ${targetLog.day_number} completed! ${streak} day streak 🔥`,
    streak,
    completedCount,
  });
}
