import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Task } from '@/lib/types';
import { getTodayDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const searchParams = req.nextUrl.searchParams;
  const statusParam = searchParams.get('status');
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  const todayStr = getTodayDateString();
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Automatic overdue check before listing
  try {
    db.prepare(`
      UPDATE tasks
      SET status = 'OVERDUE'
      WHERE user_id = ?
        AND status = 'PENDING'
        AND (
          due_date < ?
          OR (due_date = ? AND deadline_time IS NOT NULL AND deadline_time < ?)
        )
    `).run(user.id, todayStr, todayStr, currentTimeStr);
  } catch (e) {
    // Ignore update error
  }

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params: unknown[] = [user.id];

  if (statusParam) {
    const sUpper = statusParam.toUpperCase();
    if (sUpper === 'COMPLETED') {
      query += " AND status = 'COMPLETED'";
    } else if (sUpper === 'PENDING' || sUpper === 'ACTIVE') {
      // Include both PENDING and OVERDUE tasks in active mission list
      query += " AND status IN ('PENDING', 'OVERDUE')";
    } else if (sUpper === 'OVERDUE') {
      query += " AND status = 'OVERDUE'";
    }
  } else {
    // Default to active missions (PENDING + OVERDUE)
    query += " AND status IN ('PENDING', 'OVERDUE')";
  }

  if (categoryParam && categoryParam !== 'All') {
    query += ' AND category = ?';
    params.push(categoryParam);
  }

  if (searchParam && searchParam.trim()) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    const term = `%${searchParam.trim()}%`;
    params.push(term, term);
  }

  // Use single quotes for SQLite string literals in CASE WHEN
  query += " ORDER BY CASE status WHEN 'PENDING' THEN 1 WHEN 'OVERDUE' THEN 2 ELSE 3 END, due_date ASC, created_at DESC";

  const rows = db.prepare(query).all(...params) as Task[];

  return NextResponse.json({ tasks: rows });
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
    const cleanRandomEligible = is_random_eligible === false ? 0 : 1;

    const db = getDb();
    db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, description, category, priority, status,
        due_date, deadline_time, reminder_offset, is_random_eligible,
        completed_at, deadline_reminder_sent, deadline_expired_sent,
        challenge_id, challenge_day_num, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, NULL, 0, 0, NULL, NULL, ?)
    `).run(
      taskId,
      user.id,
      title.trim(),
      description ? description.trim() : null,
      cleanCategory,
      cleanPriority,
      cleanDueDate,
      cleanDeadlineTime,
      cleanReminderOffset,
      cleanRandomEligible,
      createdAt
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;

    return NextResponse.json({ task, message: 'Task created successfully' }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
