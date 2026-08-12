import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { getTodayDateString } from '@/lib/dates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, full_name } = body;

    // Server-side validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanFullName = full_name.trim();

    const db = getDb();

    // Check existing email or username
    const existing = db.prepare('SELECT email, username FROM users WHERE email = ? OR username = ?').get(cleanEmail, cleanUsername) as { email: string; username: string } | undefined;

    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      if (existing.username === cleanUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, full_name, avatar_url, bio, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)
    `).run(userId, cleanEmail, cleanUsername, passwordHash, cleanFullName, createdAt);

    // Create active session cookie
    await createSessionCookie(userId, cleanEmail, cleanUsername);

    const user = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      full_name: cleanFullName,
      avatar_url: null,
      bio: null,
      created_at: createdAt
    };

    return NextResponse.json({ user, message: 'Account created successfully' }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
