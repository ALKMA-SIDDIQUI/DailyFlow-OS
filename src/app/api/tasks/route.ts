import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetTasks, dbCreateTask, dbUpdateTask } from '@/lib/db-adapter';
import { Task } from '@/lib/types';
import { getTodayDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const statusParam = searchParams.get('status');
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const todayStr = getTodayDateString();
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Automatic overdue check before listing
  try {
    const allPending = await dbGetTasks(user.id, { status: 'PENDING' });
    for (const t of allPending) {
      if (!t.due_date) continue;
      const isOverdue =
        t.due_date < todayStr ||
        (t.due_date === todayStr && t.deadline_time && t.deadline_time < currentTimeStr);
      if (isOverdue) {
        await dbUpdateTask(t.id, user.id, { status: 'OVERDUE' });
      }
    }
  } catch (e) {
    // Ignore automatic update error
  }

  const tasks = await dbGetTasks(user.id, {
    status: statusParam || undefined,
    category: categoryParam || undefined,
    search: searchParam || undefined,
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, priority, due_date, deadline_time, reminder_offset, is_random_eligible } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const taskId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const cleanCategory = category || 'Personal';
    const cleanPriority = priority || 'Medium';
    const cleanDueDate = due_date || getTodayDateString();
    const cleanDeadlineTime = deadline_time || '23:59';
    const cleanReminderOffset = typeof reminder_offset === 'number' ? reminder_offset : 30;
    const cleanRandomEligible = is_random_eligible !== false;

    const newTask: Task = {
      id: taskId,
      user_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: cleanCategory,
      priority: cleanPriority,
      status: 'PENDING',
      due_date: cleanDueDate,
      deadline_time: cleanDeadlineTime,
      reminder_offset: cleanReminderOffset,
      is_random_eligible: cleanRandomEligible,
      completed_at: null,
      deadline_reminder_sent: false,
      deadline_expired_sent: false,
      challenge_id: null,
      challenge_day_num: null,
      created_at: createdAt,
    };

    const created = await dbCreateTask(newTask);

    return NextResponse.json({ task: created, message: 'Task created successfully' }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
