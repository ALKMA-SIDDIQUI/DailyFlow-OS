import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetTasks } from '@/lib/db-adapter';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await dbGetTasks(user.id, { status: 'PENDING' });
  const eligibleTasks = tasks.filter((t) => Boolean(t.is_random_eligible));

  if (eligibleTasks.length === 0) {
    return NextResponse.json({
      task: null,
      message: 'No eligible pending tasks found for random selection.',
    });
  }

  const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
  const selectedTask = eligibleTasks[randomIndex];

  return NextResponse.json({
    task: selectedTask,
    candidatesCount: eligibleTasks.length,
  });
}
