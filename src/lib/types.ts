export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskCategory = 'Work' | 'Personal' | 'Health' | 'Study' | 'Coding' | 'Fitness' | 'Other';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';
export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
export type ChallengeLogStatus = 'PENDING' | 'COMPLETED' | 'MISSED';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null; // YYYY-MM-DD
  deadline_time?: string | null; // HH:MM
  reminder_offset?: number | null; // minutes before deadline
  is_random_eligible: boolean | number;
  completed_at?: string | null;
  deadline_reminder_sent: boolean | number;
  deadline_expired_sent: boolean | number;
  challenge_id?: string | null;
  challenge_day_num?: number | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: TaskCategory;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  target_days: number;
  current_day: number;
  completed_days_count: number;
  missed_days_count: number;
  current_streak: number;
  longest_streak: number;
  status: ChallengeStatus;
  created_at: string;
  logs?: ChallengeLog[];
}

export interface ChallengeLog {
  id: string;
  challenge_id: string;
  user_id: string;
  day_number: number;
  date_str: string; // YYYY-MM-DD
  status: ChallengeLogStatus;
  task_id?: string | null;
  completed_at?: string | null;
}

export interface DailyProgressItem {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 'Today', 'Yesterday', 'Wed 12', etc.
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  percentage: number;
}

export interface DashboardStats {
  todayTasksCount: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
  currentStreak: number;
  longestStreak: number;
  activeChallengesCount: number;
  completedChallengesCount: number;
  todayCompletionRate: number; // percentage 0-100
  dailyProgress?: DailyProgressItem[];
  heatmap?: ActivityHeatmapDay[];
}

export interface ActivityHeatmapDay {
  date: string; // YYYY-MM-DD
  count: number; // completed task count
  level: number; // 0, 1, 2, 3, 4
}
