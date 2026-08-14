import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { dbGetTasks, dbGetChallenges, dbGetUserByUsername, dbUpdateUser } from '@/lib/db-adapter';
import { ActivityHeatmapDay, DailyProgressItem } from '@/lib/types';
import { getTodayDateString, calculateUserStreaks, addDaysToDateString } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStr = getTodayDateString();

    const tasksList = await dbGetTasks(user.id);
    const totalTasks = tasksList.length;
    const completedCount = tasksList.filter((t) => t.status === 'COMPLETED').length;
    const pendingCount = tasksList.filter((t) => t.status === 'PENDING' || t.status === 'OVERDUE').length;
    const overdueCount = tasksList.filter((t) => t.status === 'OVERDUE').length;

    // Today's tasks count
    const todayTasks = tasksList.filter((t) => {
      if (t.due_date === todayStr) return true;
      if (t.status === 'COMPLETED' && t.completed_at && t.completed_at.substring(0, 10) === todayStr) return true;
      return false;
    });

    const todayCompletedTasks = tasksList.filter(
      (t) => t.status === 'COMPLETED' && t.completed_at && t.completed_at.substring(0, 10) === todayStr
    );

    const todayTasksCount = todayTasks.length;
    const todayCompletedCount = todayCompletedTasks.length;
    const todayCompletionRate = todayTasksCount > 0 ? Math.round((todayCompletedCount / todayTasksCount) * 100) : 0;

    // Challenges stats
    const challengesList = await dbGetChallenges(user.id);
    const activeChallengesCount = challengesList.filter((c) => c.status === 'ACTIVE').length;
    const completedChallengesCount = challengesList.filter((c) => c.status === 'COMPLETED').length;

    // Calculate streaks
    const completedDatesSet = new Set<string>();
    tasksList.forEach((t) => {
      if (t.status === 'COMPLETED' && t.completed_at) {
        completedDatesSet.add(t.completed_at.substring(0, 10));
      }
    });

    const datesArray = Array.from(completedDatesSet).sort();
    const { currentStreak, longestStreak } = calculateUserStreaks(datesArray);

    // Generate 14-day daily progress breakdown report (Today, Yesterday, & past days)
    const dailyProgress: DailyProgressItem[] = [];
    for (let i = 13; i >= 0; i--) {
      const dStr = addDaysToDateString(todayStr, -i);

      const compC = tasksList.filter((t) => t.status === 'COMPLETED' && t.completed_at && t.completed_at.substring(0, 10) === dStr).length;
      const pendC = tasksList.filter((t) => t.status === 'PENDING' && t.due_date === dStr).length;
      const overC = tasksList.filter((t) => t.status === 'OVERDUE' && t.due_date === dStr).length;

      const totC = compC + pendC + overC;
      const pct = totC > 0 ? Math.round((compC / totC) * 100) : compC > 0 ? 100 : 0;

      let dayLabel = dStr.substring(5);
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Yesterday';

      dailyProgress.push({
        date: dStr,
        dayLabel,
        totalCount: totC,
        completedCount: compC,
        pendingCount: pendC,
        overdueCount: overC,
        percentage: pct,
      });
    }

    // Generate 30-day activity heatmap grid
    const heatmap: ActivityHeatmapDay[] = [];
    for (let i = 29; i >= 0; i--) {
      const dStr = addDaysToDateString(todayStr, -i);
      const c = tasksList.filter((t) => t.status === 'COMPLETED' && t.completed_at && t.completed_at.substring(0, 10) === dStr).length;

      let level = 0;
      if (c >= 4) level = 4;
      else if (c === 3) level = 3;
      else if (c === 2) level = 2;
      else if (c === 1) level = 1;

      heatmap.push({ date: dStr, count: c, level });
    }

    return NextResponse.json({
      user,
      stats: {
        totalTasks,
        completedCount,
        pendingCount,
        overdueCount,
        todayTasksCount,
        todayCompletedCount,
        todayCompletionRate,
        activeChallengesCount,
        completedChallengesCount,
        currentStreak,
        longestStreak,
        dailyProgress,
        heatmap,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
    return NextResponse.json({
      user,
      stats: {
        totalTasks: 0,
        completedCount: 0,
        pendingCount: 0,
        overdueCount: 0,
        todayTasksCount: 0,
        todayCompletedCount: 0,
        todayCompletionRate: 0,
        activeChallengesCount: 0,
        completedChallengesCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        dailyProgress: [],
        heatmap: [],
      },
      error: errMessage,
    });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { full_name, username, bio } = body;

    const newFullName = full_name ? full_name.trim() : user.full_name;
    const newUsername = username ? username.trim().toLowerCase() : user.username;
    const newBio = bio !== undefined ? (bio ? bio.trim() : null) : user.bio;

    if (newUsername !== user.username) {
      const existing = await dbGetUserByUsername(newUsername);
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const updatedUser = await dbUpdateUser(user.id, {
      full_name: newFullName,
      username: newUsername,
      bio: newBio,
    });

    if (!updatedUser) {
      throw new Error('Profile update failed');
    }

    return NextResponse.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
