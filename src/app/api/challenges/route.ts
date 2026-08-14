import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetChallenges, dbCreateChallenge } from '@/lib/db-adapter';
import { Challenge, ChallengeLog } from '@/lib/types';
import { getTodayDateString, addDaysToDateString } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const challenges = await dbGetChallenges(user.id);
  return NextResponse.json(
    { challenges },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, start_date } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Challenge title is required' }, { status: 400 });
    }

    const startDateStr = start_date || getTodayDateString();
    const endDateStr = addDaysToDateString(startDateStr, 20); // 21 days total
    const challengeId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const cleanCategory = category || 'Personal';

    const newChallenge: Challenge = {
      id: challengeId,
      user_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category: cleanCategory,
      start_date: startDateStr,
      end_date: endDateStr,
      target_days: 21,
      current_day: 1,
      completed_days_count: 0,
      missed_days_count: 0,
      current_streak: 0,
      longest_streak: 0,
      status: 'ACTIVE',
      created_at: createdAt,
    };

    const logRows: ChallengeLog[] = [];
    for (let day = 1; day <= 21; day++) {
      const dayDateStr = addDaysToDateString(startDateStr, day - 1);
      logRows.push({
        id: crypto.randomUUID(),
        challenge_id: challengeId,
        user_id: user.id,
        day_number: day,
        date_str: dayDateStr,
        status: 'PENDING',
        task_id: null,
        completed_at: null,
      });
    }

    const created = await dbCreateChallenge(newChallenge, logRows);

    return NextResponse.json(
      {
        challenge: created,
        message: '21-Day Habit Challenge created successfully!',
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to create challenge';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
