import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { dbGetUserByIdentifier } from '@/lib/db-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const loginIdentifier = body.loginIdentifier || body.identifier;
    const password = body.password;

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const cleanIdentifier = String(loginIdentifier).trim().toLowerCase();
    const user = await dbGetUserByIdentifier(cleanIdentifier);

    if (!user) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    await createSessionCookie(user.id, user.email, user.username);

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
    };

    return NextResponse.json({
      user: safeUser,
      message: 'Login successful',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
