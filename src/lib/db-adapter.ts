import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient, isSupabaseConfigured } from './supabase';
import { User, Task, Challenge, ChallengeLog } from './types';

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'local_db.json');

type UserWithHash = User & { password_hash: string };

interface LocalDbSchema {
  users: UserWithHash[];
  tasks: Task[];
  challenges: Challenge[];
  challenge_logs: ChallengeLog[];
}

function getLocalData(): LocalDbSchema {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      // Seed with initial backup JSON if available
      const backupPath = path.join(process.cwd(), 'scripts', 'old-data-backup.json');
      if (fs.existsSync(backupPath)) {
        const rawBackup = fs.readFileSync(backupPath, 'utf8');
        const backupJson = JSON.parse(rawBackup);
        const initialSchema: LocalDbSchema = {
          users: (backupJson.users || []) as UserWithHash[],
          tasks: (backupJson.tasks || []) as Task[],
          challenges: (backupJson.challenges || []) as Challenge[],
          challenge_logs: (backupJson.challenge_logs || []) as ChallengeLog[],
        };
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialSchema, null, 2));
        return initialSchema;
      }

      const emptySchema: LocalDbSchema = {
        users: [] as UserWithHash[],
        tasks: [] as Task[],
        challenges: [] as Challenge[],
        challenge_logs: [] as ChallengeLog[],
      };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(emptySchema, null, 2));
      return emptySchema;
    }
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(raw) as LocalDbSchema;
  } catch (e) {
    return { users: [], tasks: [], challenges: [], challenge_logs: [] };
  }
}

function saveLocalData(data: LocalDbSchema) {
  try {
    const dir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write local_db.json:', e);
  }
}

// ==================== USER OPERATIONS ====================

export async function dbGetUserById(id: string): Promise<UserWithHash | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data as UserWithHash;
    } catch (e) {}
  }

  const local = getLocalData();
  return local.users.find((u) => u.id === id) || null;
}

export async function dbGetUserByEmail(email: string): Promise<UserWithHash | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      if (!error && data) return data as UserWithHash;
    } catch (e) {}
  }

  const local = getLocalData();
  return local.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function dbGetUserByUsername(username: string): Promise<UserWithHash | null> {
  const cleanUsername = username.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('users').select('*').eq('username', cleanUsername).maybeSingle();
      if (!error && data) return data as UserWithHash;
    } catch (e) {}
  }

  const local = getLocalData();
  return local.users.find((u) => u.username.toLowerCase() === cleanUsername) || null;
}

export async function dbGetUserByIdentifier(identifier: string): Promise<UserWithHash | null> {
  const clean = identifier.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${clean},username.eq.${clean}`)
        .maybeSingle();
      if (!error && data) return data as UserWithHash;
    } catch (e) {}
  }

  const local = getLocalData();
  return local.users.find((u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean) || null;
}

export async function dbCreateUser(userObj: UserWithHash): Promise<User> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('users')
        .insert(userObj)
        .select('id, email, username, full_name, avatar_url, bio, created_at')
        .single();
      if (!error && data) return data as User;
    } catch (e) {}
  }

  const local = getLocalData();
  local.users.push(userObj);
  saveLocalData(local);

  const { password_hash, ...safeUser } = userObj;
  return safeUser as User;
}

export async function dbUpdateUser(id: string, updates: Partial<UserWithHash>): Promise<User | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, username, full_name, avatar_url, bio, created_at')
        .single();
      if (!error && data) return data as User;
    } catch (e) {}
  }

  const local = getLocalData();
  const idx = local.users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    local.users[idx] = { ...local.users[idx], ...updates };
    saveLocalData(local);
    const { password_hash, ...safeUser } = local.users[idx];
    return safeUser as User;
  }
  return null;
}

// ==================== TASK OPERATIONS ====================

export async function dbGetTasks(
  userId: string,
  options?: { status?: string; category?: string; search?: string }
): Promise<Task[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      let query = supabase.from('tasks').select('*').eq('user_id', userId);
      if (options?.status) {
        const sUpper = options.status.toUpperCase();
        if (sUpper === 'COMPLETED') query = query.eq('status', 'COMPLETED');
        else if (sUpper === 'PENDING' || sUpper === 'ACTIVE') query = query.in('status', ['PENDING', 'OVERDUE']);
        else if (sUpper === 'OVERDUE') query = query.eq('status', 'OVERDUE');
      }
      if (options?.category && options.category !== 'All') query = query.eq('category', options.category);
      if (options?.search?.trim()) query = query.or(`title.ilike.%${options.search.trim()}%,description.ilike.%${options.search.trim()}%`);
      query = query.order('due_date', { ascending: true }).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) return data as Task[];
    } catch (e) {}
  }

  const local = getLocalData();
  let tasks = local.tasks.filter((t) => t.user_id === userId);

  if (options?.status) {
    const sUpper = options.status.toUpperCase();
    if (sUpper === 'COMPLETED') {
      tasks = tasks.filter((t) => t.status === 'COMPLETED');
    } else if (sUpper === 'PENDING' || sUpper === 'ACTIVE') {
      tasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'OVERDUE');
    } else if (sUpper === 'OVERDUE') {
      tasks = tasks.filter((t) => t.status === 'OVERDUE');
    }
  }

  if (options?.category && options.category !== 'All') {
    tasks = tasks.filter((t) => t.category === options.category);
  }

  if (options?.search?.trim()) {
    const term = options.search.trim().toLowerCase();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term))
    );
  }

  return tasks.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
}

export async function dbGetTaskById(id: string, userId: string): Promise<Task | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('tasks').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
      if (!error && data) return data as Task;
    } catch (e) {}
  }

  const local = getLocalData();
  return local.tasks.find((t) => t.id === id && t.user_id === userId) || null;
}

export async function dbCreateTask(taskObj: Task): Promise<Task> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('tasks').insert(taskObj).select('*').single();
      if (!error && data) return data as Task;
    } catch (e) {}
  }

  const local = getLocalData();
  local.tasks.push(taskObj);
  saveLocalData(local);
  return taskObj;
}

export async function dbUpdateTask(id: string, userId: string, updates: Partial<Task>): Promise<Task | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).eq('user_id', userId).select('*').single();
      if (!error && data) return data as Task;
    } catch (e) {}
  }

  const local = getLocalData();
  const idx = local.tasks.findIndex((t) => t.id === id && t.user_id === userId);
  if (idx !== -1) {
    local.tasks[idx] = { ...local.tasks[idx], ...updates };
    saveLocalData(local);
    return local.tasks[idx];
  }
  return null;
}

export async function dbDeleteTask(id: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
      if (!error) return true;
    } catch (e) {}
  }

  const local = getLocalData();
  const initialLen = local.tasks.length;
  local.tasks = local.tasks.filter((t) => !(t.id === id && t.user_id === userId));
  saveLocalData(local);
  return local.tasks.length < initialLen;
}

// ==================== CHALLENGE OPERATIONS ====================

export async function dbGetChallenges(userId: string): Promise<Challenge[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data: challenges, error } = await supabase.from('challenges').select('*').eq('user_id', userId);
      if (!error && challenges) {
        const cIds = challenges.map((c) => c.id);
        const { data: logs } = await supabase.from('challenge_logs').select('*').in('challenge_id', cIds);
        const logsMap: Record<string, ChallengeLog[]> = {};
        (logs || []).forEach((l) => {
          if (!logsMap[l.challenge_id]) logsMap[l.challenge_id] = [];
          logsMap[l.challenge_id].push(l as ChallengeLog);
        });
        return challenges.map((c) => ({ ...(c as Challenge), logs: logsMap[c.id] || [] }));
      }
    } catch (e) {}
  }

  const local = getLocalData();
  const challenges = local.challenges.filter((c) => c.user_id === userId);
  return challenges.map((c) => ({
    ...c,
    logs: local.challenge_logs.filter((l) => l.challenge_id === c.id),
  }));
}

export async function dbGetChallengeById(id: string, userId: string): Promise<Challenge | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data: challenge, error } = await supabase.from('challenges').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
      if (!error && challenge) {
        const { data: logs } = await supabase.from('challenge_logs').select('*').eq('challenge_id', id).order('day_number', { ascending: true });
        return { ...(challenge as Challenge), logs: (logs || []) as ChallengeLog[] };
      }
    } catch (e) {}
  }

  const local = getLocalData();
  const challenge = local.challenges.find((c) => c.id === id && c.user_id === userId);
  if (!challenge) return null;
  return {
    ...challenge,
    logs: local.challenge_logs.filter((l) => l.challenge_id === id).sort((a, b) => a.day_number - b.day_number),
  };
}

export async function dbCreateChallenge(challengeObj: Challenge, logs: ChallengeLog[]): Promise<Challenge> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('challenges').insert(challengeObj).select('*').single();
      if (!error && data) {
        await supabase.from('challenge_logs').insert(logs);
        return { ...(data as Challenge), logs };
      }
    } catch (e) {}
  }

  const local = getLocalData();
  local.challenges.push(challengeObj);
  local.challenge_logs.push(...logs);
  saveLocalData(local);
  return { ...challengeObj, logs };
}

export async function dbUpdateChallenge(id: string, userId: string, updates: Partial<Challenge>): Promise<Challenge | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase.from('challenges').update(updates).eq('id', id).eq('user_id', userId).select('*').single();
      if (!error && data) return data as Challenge;
    } catch (e) {}
  }

  const local = getLocalData();
  const idx = local.challenges.findIndex((c) => c.id === id && c.user_id === userId);
  if (idx !== -1) {
    local.challenges[idx] = { ...local.challenges[idx], ...updates };
    saveLocalData(local);
    return local.challenges[idx];
  }
  return null;
}

export async function dbDeleteChallenge(id: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      await supabase.from('tasks').delete().eq('challenge_id', id).eq('user_id', userId);
      await supabase.from('challenge_logs').delete().eq('challenge_id', id).eq('user_id', userId);
      const { error } = await supabase.from('challenges').delete().eq('id', id).eq('user_id', userId);
      if (!error) return true;
    } catch (e) {}
  }

  const local = getLocalData();
  local.tasks = local.tasks.filter((t) => !(t.challenge_id === id && t.user_id === userId));
  local.challenge_logs = local.challenge_logs.filter((l) => !(l.challenge_id === id && l.user_id === userId));
  local.challenges = local.challenges.filter((c) => !(c.id === id && c.user_id === userId));
  saveLocalData(local);
  return true;
}

export async function dbUpdateChallengeLog(logId: string, userId: string, updates: Partial<ChallengeLog>): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.from('challenge_logs').update(updates).eq('id', logId).eq('user_id', userId);
      if (!error) return true;
    } catch (e) {}
  }

  const local = getLocalData();
  const idx = local.challenge_logs.findIndex((l) => l.id === logId && l.user_id === userId);
  if (idx !== -1) {
    local.challenge_logs[idx] = { ...local.challenge_logs[idx], ...updates };
    saveLocalData(local);
    return true;
  }
  return false;
}
