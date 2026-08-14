import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetTaskById, dbUpdateTask, dbDeleteTask } from '@/lib/db-adapter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = await dbGetTaskById(params.id, user.id);
  if (!task) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await dbGetTaskById(params.id, user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
    if (body.category !== undefined) updates.category = body.category;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.deadline_time !== undefined) updates.deadline_time = body.deadline_time;
    if (body.reminder_offset !== undefined) updates.reminder_offset = body.reminder_offset;
    if (body.is_random_eligible !== undefined) updates.is_random_eligible = Boolean(body.is_random_eligible);
    if (body.deadline_reminder_sent !== undefined) updates.deadline_reminder_sent = Boolean(body.deadline_reminder_sent);
    if (body.deadline_expired_sent !== undefined) updates.deadline_expired_sent = Boolean(body.deadline_expired_sent);

    const updatedTask = await dbUpdateTask(params.id, user.id, updates);
    if (!updatedTask) {
      throw new Error('Failed to update task');
    }

    return NextResponse.json({ task: updatedTask, message: 'Task updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to update task';
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

  const existing = await dbGetTaskById(params.id, user.id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
  }

  const success = await dbDeleteTask(params.id, user.id);
  if (!success) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Task deleted successfully' });
}
