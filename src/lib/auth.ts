import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { User } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dailyflow_vibecode_secure_secret_key_2026_x789'
);

const COOKIE_NAME = 'dailyflow_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days (>= 30 mins)

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createSessionCookie(userId: string, email: string, username: string) {
  const token = await new SignJWT({ userId, email, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });

  return token;
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { userId: string };

    if (!payload?.userId) return null;

    const db = getDb();
    const row = db.prepare('SELECT id, email, username, full_name, avatar_url, bio, created_at FROM users WHERE id = ?').get(payload.userId) as Record<string, unknown> | undefined;

    if (!row) return null;

    // Convert database row to a plain JS object to avoid null prototype React Flight serialization errors
    return {
      id: String(row.id),
      email: String(row.email),
      username: String(row.username),
      full_name: String(row.full_name),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      bio: row.bio ? String(row.bio) : null,
      created_at: String(row.created_at),
    };
  } catch (error) {
    return null;
  }
}
