import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email/Username and Password are required' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const db = getDb();

    // Support login via email or username
    const row = db.prepare(`
      SELECT id, email, username, password_hash, full_name, avatar_url, bio, created_at
      FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
    `).get(cleanIdentifier, cleanIdentifier) as (User & { password_hash: string }) | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, row.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set authenticated session cookie
    await createSessionCookie(row.id, row.email, row.username);

    const user: User = {
      id: row.id,
      email: row.email,
      username: row.username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      bio: row.bio,
      created_at: row.created_at
    };

    return NextResponse.json({ user, message: 'Logged in successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
