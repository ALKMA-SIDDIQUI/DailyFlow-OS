import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { dbGetUserByEmail, dbGetUserByUsername, dbCreateUser } from '@/lib/db-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, full_name } = body;

    if (!email || !username || !password || !full_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanFullName = String(full_name).trim();

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check existing email
    const existingEmail = await dbGetUserByEmail(cleanEmail);
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Check existing username
    const existingUsername = await dbGetUserByUsername(cleanUsername);
    if (existingUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newUser = await dbCreateUser({
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      password_hash: passwordHash,
      full_name: cleanFullName,
      avatar_url: null,
      bio: null,
      created_at: createdAt,
    });

    await createSessionCookie(newUser.id, newUser.email, newUser.username);

    return NextResponse.json({
      user: newUser,
      message: 'Account created successfully',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
