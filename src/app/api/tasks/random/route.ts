import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Task } from '@/lib/types';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  
  // Select uncompleted random-eligible tasks for this user only
  const eligibleTasks = db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ?
      AND status = 'PENDING'
      AND is_random_eligible = 1
  `).all(user.id) as Task[];

  if (eligibleTasks.length === 0) {
    return NextResponse.json({
      task: null,
      message: 'No random tasks available. Add some tasks first.'
    });
  }

  // Pick a random task
  const randomIndex = Math.floor(Math.random() * eligibleTasks.length);
  const randomTask = eligibleTasks[randomIndex];

  return NextResponse.json({
    task: randomTask,
    totalEligible: eligibleTasks.length
  });
}
