import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: 'Logged out successfully' });
}
