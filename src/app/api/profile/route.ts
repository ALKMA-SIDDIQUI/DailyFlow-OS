import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ActivityHeatmapDay, DailyProgressItem } from '@/lib/types';
import { getTodayDateString, calculateUserStreaks, addDaysToDateString } from '@/lib/dates';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const todayStr = getTodayDateString();

    // Tasks statistics (using single quotes for SQLite string literals)
    const totalTasksRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?").get(user.id) as { count: number } || { count: 0 };
    const completedTasksRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'COMPLETED'").get(user.id) as { count: number } || { count: 0 };
    const pendingTasksRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ('PENDING', 'OVERDUE')").get(user.id) as { count: number } || { count: 0 };
    const overdueTasksRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'OVERDUE'").get(user.id) as { count: number } || { count: 0 };

    const todayTasksRow = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE user_id = ? AND (due_date = ? OR (status = 'COMPLETED' AND SUBSTR(completed_at, 1, 10) = ?))
    `).get(user.id, todayStr, todayStr) as { count: number } || { count: 0 };

    const todayCompletedRow = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE user_id = ? AND status = 'COMPLETED' AND SUBSTR(completed_at, 1, 10) = ?
    `).get(user.id, todayStr) as { count: number } || { count: 0 };

    const todayCompletionRate = todayTasksRow.count > 0
      ? Math.round((todayCompletedRow.count / todayTasksRow.count) * 100)
      : 0;

    // Challenges statistics
    const activeChallengesRow = db.prepare("SELECT COUNT(*) as count FROM challenges WHERE user_id = ? AND status = 'ACTIVE'").get(user.id) as { count: number } || { count: 0 };
    const completedChallengesRow = db.prepare("SELECT COUNT(*) as count FROM challenges WHERE user_id = ? AND status = 'COMPLETED'").get(user.id) as { count: number } || { count: 0 };

    // Calculate streak from all completed tasks dates
    const completedTaskDates = db.prepare(`
      SELECT DISTINCT SUBSTR(completed_at, 1, 10) as date_str
      FROM tasks
      WHERE user_id = ? AND status = 'COMPLETED' AND completed_at IS NOT NULL
      ORDER BY date_str ASC
    `).all(user.id) as { date_str: string }[];

    const datesArray = completedTaskDates.map(d => d.date_str).filter(Boolean);
    const { currentStreak, longestStreak } = calculateUserStreaks(datesArray);

    // Generate 14-day daily progress breakdown report (Today, Yesterday, & past days)
    const dailyProgress: DailyProgressItem[] = [];
    for (let i = 13; i >= 0; i--) {
      const dStr = addDaysToDateString(todayStr, -i);
      
      const compRow = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE user_id = ? AND status = 'COMPLETED' AND SUBSTR(completed_at, 1, 10) = ?
      `).get(user.id, dStr) as { count: number } || { count: 0 };

      const pendRow = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE user_id = ? AND status = 'PENDING' AND due_date = ?
      `).get(user.id, dStr) as { count: number } || { count: 0 };

      const overRow = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE user_id = ? AND status = 'OVERDUE' AND due_date = ?
      `).get(user.id, dStr) as { count: number } || { count: 0 };

      const compC = compRow.count;
      const pendC = pendRow.count;
      const overC = overRow.count;
      const totC = compC + pendC + overC;
      const pct = totC > 0 ? Math.round((compC / totC) * 100) : (compC > 0 ? 100 : 0);

      let dayLabel = dStr.substring(5); // MM-DD
      if (i === 0) dayLabel = 'Today';
      else if (i === 1) dayLabel = 'Yesterday';

      dailyProgress.push({
        date: dStr,
        dayLabel,
        totalCount: totC,
        completedCount: compC,
        pendingCount: pendC,
        overdueCount: overC,
        percentage: pct
      });
    }

    // Generate 30-day activity heatmap grid for recent activity
    const heatmap: ActivityHeatmapDay[] = [];
    for (let i = 29; i >= 0; i--) {
      const dStr = addDaysToDateString(todayStr, -i);
      const countRow = db.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE user_id = ? AND status = 'COMPLETED' AND SUBSTR(completed_at, 1, 10) = ?
      `).get(user.id, dStr) as { count: number } || { count: 0 };

      const c = countRow.count;
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
        totalTasks: totalTasksRow.count,
        completedCount: completedTasksRow.count,
        pendingCount: pendingTasksRow.count,
        overdueCount: overdueTasksRow.count,
        todayTasksCount: todayTasksRow.count,
        todayCompletedCount: todayCompletedRow.count,
        todayCompletionRate,
        activeChallengesCount: activeChallengesRow.count,
        completedChallengesCount: completedChallengesRow.count,
        currentStreak,
        longestStreak,
        dailyProgress,
        heatmap
      }
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
        heatmap: []
      },
      error: errMessage
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

    const db = getDb();

    if (newUsername !== user.username) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(newUsername, user.id);
      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    db.prepare(`
      UPDATE users
      SET full_name = ?, username = ?, bio = ?
      WHERE id = ?
    `).run(newFullName, newUsername, newBio, user.id);

    const updatedUser = db.prepare('SELECT id, email, username, full_name, avatar_url, bio, created_at FROM users WHERE id = ?').get(user.id);

    return NextResponse.json({ user: updatedUser, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
