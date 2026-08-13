-- DailyFlow OS — Supabase PostgreSQL Production Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'Personal',
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  due_date DATE,
  deadline_time VARCHAR(10),
  reminder_offset INTEGER DEFAULT 30,
  is_random_eligible BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  deadline_reminder_sent BOOLEAN DEFAULT FALSE,
  deadline_expired_sent BOOLEAN DEFAULT FALSE,
  challenge_id UUID,
  challenge_day_num INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'Personal',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_days INTEGER NOT NULL DEFAULT 21,
  current_day INTEGER NOT NULL DEFAULT 1,
  completed_days_count INTEGER NOT NULL DEFAULT 0,
  missed_days_count INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key link for tasks -> challenges
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL;

-- 4. Challenge Logs Table
CREATE TABLE IF NOT EXISTS challenge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date_str DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ
);

-- 5. Production Indexes for Rapid Isolation & Performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_challenges_user_status ON challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_logs_challenge ON challenge_logs(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_logs_user_date ON challenge_logs(user_id, date_str);
