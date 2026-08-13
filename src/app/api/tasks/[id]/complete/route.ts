import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetTaskById, dbUpdateTask, dbGetChallenges, dbUpdateChallengeLog } from '@/lib/db-adapter';
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
  const task = await dbGetTaskById(taskId, user.id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  const nowISO = new Date().toISOString();
  const todayStr = getTodayDateString();

  const updatedTask = await dbUpdateTask(taskId, user.id, {
    status: 'COMPLETED',
    completed_at: nowISO,
  });

  if (!updatedTask) {
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }

  // If task is linked to a 21-day habit challenge, mark corresponding challenge log completed
  if (task.challenge_id) {
    const challenges = await dbGetChallenges(user.id);
    const chal = challenges.find((c) => c.id === task.challenge_id);
    if (chal && chal.logs) {
      const todayLog = chal.logs.find((l) => l.date_str === todayStr);
      if (todayLog) {
        await dbUpdateChallengeLog(todayLog.id, user.id, {
          status: 'COMPLETED',
          completed_at: nowISO,
        });
      }
    }
  }

  return NextResponse.json({
    task: updatedTask,
    message: 'Task completed successfully',
  });
}
