import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { Task } from '@/lib/types';

export async function PATCH(
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
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, user.id) as Task | undefined;
  if (!existing) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { title, description, category, priority, due_date, deadline_time, reminder_offset, is_random_eligible, status } = body;

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc = description !== undefined ? (description ? description.trim() : null) : existing.description;
    const newCategory = category || existing.category;
    const newPriority = priority || existing.priority;
    const newDueDate = due_date !== undefined ? due_date : existing.due_date;
    const newDeadlineTime = deadline_time !== undefined ? deadline_time : existing.deadline_time;
    const newReminderOffset = reminder_offset !== undefined ? reminder_offset : existing.reminder_offset;
    const newRandomEligible = is_random_eligible !== undefined ? (is_random_eligible ? 1 : 0) : existing.is_random_eligible;
    const newStatus = status || existing.status;

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, category = ?, priority = ?,
          due_date = ?, deadline_time = ?, reminder_offset = ?,
          is_random_eligible = ?, status = ?
      WHERE id = ? AND user_id = ?
    `).run(
      newTitle, newDesc, newCategory, newPriority,
      newDueDate, newDeadlineTime, newReminderOffset,
      newRandomEligible, newStatus,
      taskId, user.id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
    return NextResponse.json({ task: updatedTask, message: 'Task updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

export async function DELETE(
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
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, user.id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, user.id);

  return NextResponse.json({ message: 'Task deleted successfully' });
}
