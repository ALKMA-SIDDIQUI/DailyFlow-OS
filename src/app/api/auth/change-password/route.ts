import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const db = getDb();
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, row.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to update password';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
