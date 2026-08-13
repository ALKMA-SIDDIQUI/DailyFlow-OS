// Standalone Data Migration Script: Seed JSON / SQLite -> Supabase PostgreSQL
const path = require('path');
const fs = require('fs');
const { getSupabaseServerClient, isSupabaseConfigured } = require('../src/lib/supabase');

async function migrateData() {
  console.log('=== DailyFlow OS — Old Data → Supabase PostgreSQL Seeding Script ===\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ ERROR: Supabase environment variables are missing or set to placeholder values in .env.local.');
    console.error('Please add your live NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local to run migration.');
    process.exit(1);
  }

  let users = [];
  let challenges = [];
  let tasks = [];
  let challengeLogs = [];

  const backupJsonPath = path.join(__dirname, 'old-data-backup.json');
  const dbPath = path.join(process.cwd(), 'dailyflow.db');

  if (fs.existsSync(backupJsonPath)) {
    console.log(`[Loading data from backup JSON: ${backupJsonPath}]`);
    const backupData = JSON.parse(fs.readFileSync(backupJsonPath, 'utf8'));
    users = backupData.users || [];
    challenges = backupData.challenges || [];
    tasks = backupData.tasks || [];
    challengeLogs = backupData.challenge_logs || [];
  } else if (fs.existsSync(dbPath)) {
    console.log(`[Loading data from SQLite database: ${dbPath}]`);
    const { DatabaseSync } = require('node:sqlite');
    const sqliteDb = new DatabaseSync(dbPath);
    users = sqliteDb.prepare('SELECT * FROM users').all();
    challenges = sqliteDb.prepare('SELECT * FROM challenges').all();
    tasks = sqliteDb.prepare('SELECT * FROM tasks').all();
    challengeLogs = sqliteDb.prepare('SELECT * FROM challenge_logs').all();
  } else {
    console.error('❌ No backup JSON or SQLite database file found.');
    process.exit(1);
  }

  const supabase = getSupabaseServerClient();

  console.log(`\n[Extracted Old Records]`);
  console.log(`- Users: ${users.length} (Account: ${users[0]?.email || 'N/A'})`);
  console.log(`- Challenges: ${challenges.length} (Title: ${challenges[0]?.title || 'N/A'})`);
  console.log(`- Tasks: ${tasks.length}`);
  console.log(`- Challenge Logs: ${challengeLogs.length}\n`);

  // 1. Migrate Users
  if (users.length > 0) {
    console.log('Pushing Users to Supabase...');
    const { error: userErr } = await supabase.from('users').upsert(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        password_hash: u.password_hash,
        full_name: u.full_name,
        avatar_url: u.avatar_url || null,
        bio: u.bio || null,
        created_at: u.created_at,
      }))
    );
    if (userErr) console.error('Error migrating users:', userErr.message);
    else console.log('✓ Users seeded successfully!');
  }

  // 2. Migrate Challenges
  if (challenges.length > 0) {
    console.log('Pushing Challenges to Supabase...');
    const { error: chalErr } = await supabase.from('challenges').upsert(
      challenges.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        title: c.title,
        description: c.description || null,
        category: c.category || 'Personal',
        start_date: c.start_date,
        end_date: c.end_date,
        target_days: c.target_days || 21,
        current_day: c.current_day || 1,
        completed_days_count: c.completed_days_count || 0,
        missed_days_count: c.missed_days_count || 0,
        current_streak: c.current_streak || 0,
        longest_streak: c.longest_streak || 0,
        status: c.status || 'ACTIVE',
        created_at: c.created_at,
      }))
    );
    if (chalErr) console.error('Error migrating challenges:', chalErr.message);
    else console.log('✓ Challenges seeded successfully!');
  }

  // 3. Migrate Tasks
  if (tasks.length > 0) {
    console.log('Pushing Tasks to Supabase...');
    const { error: taskErr } = await supabase.from('tasks').upsert(
      tasks.map((t) => ({
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        description: t.description || null,
        category: t.category || 'Personal',
        priority: t.priority || 'Medium',
        status: t.status || 'PENDING',
        due_date: t.due_date || null,
        deadline_time: t.deadline_time || null,
        reminder_offset: t.reminder_offset || 30,
        is_random_eligible: Boolean(t.is_random_eligible),
        completed_at: t.completed_at || null,
        deadline_reminder_sent: Boolean(t.deadline_reminder_sent),
        deadline_expired_sent: Boolean(t.deadline_expired_sent),
        challenge_id: t.challenge_id || null,
        challenge_day_num: t.challenge_day_num || null,
        created_at: t.created_at,
      }))
    );
    if (taskErr) console.error('Error migrating tasks:', taskErr.message);
    else console.log('✓ Tasks seeded successfully!');
  }

  // 4. Migrate Challenge Logs
  if (challengeLogs.length > 0) {
    console.log('Pushing Challenge Logs to Supabase...');
    const { error: logErr } = await supabase.from('challenge_logs').upsert(
      challengeLogs.map((l) => ({
        id: l.id,
        challenge_id: l.challenge_id,
        user_id: l.user_id,
        day_number: l.day_number,
        date_str: l.date_str,
        status: l.status || 'PENDING',
        task_id: l.task_id || null,
        completed_at: l.completed_at || null,
      }))
    );
    if (logErr) console.error('Error migrating challenge logs:', logErr.message);
    else console.log('✓ Challenge logs seeded successfully!');
  }

  console.log('\n[PostgreSQL Migration Verification Report]');
  const { count: sbUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: sbChallenges } = await supabase.from('challenges').select('*', { count: 'exact', head: true });
  const { count: sbTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  const { count: sbLogs } = await supabase.from('challenge_logs').select('*', { count: 'exact', head: true });

  console.log(`- Supabase Users Count: ${sbUsers} (Extracted: ${users.length})`);
  console.log(`- Supabase Challenges Count: ${sbChallenges} (Extracted: ${challenges.length})`);
  console.log(`- Supabase Tasks Count: ${sbTasks} (Extracted: ${tasks.length})`);
  console.log(`- Supabase Challenge Logs Count: ${sbLogs} (Extracted: ${challengeLogs.length})`);

  console.log('\n✅ Data Migration Finished!');
}

migrateData().catch(console.error);
