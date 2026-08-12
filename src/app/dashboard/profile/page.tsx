'use client';

import React, { useState, useEffect } from 'react';
import { User, DashboardStats } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { User as UserIcon, Upload, Camera, Save, Lock, Flame, Trophy, CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';
import { formatPrettyDate } from '@/lib/dates';

export default function ProfilePage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      // First try /api/profile
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setFullName(data.user.full_name || '');
          setUsername(data.user.username || '');
          setBio(data.user.bio || '');
        }
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        // Fallback to /api/auth/me if /api/profile stats fail
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            setUser(meData.user);
            setFullName(meData.user.full_name || '');
            setUsername(meData.user.username || '');
            setBio(meData.user.bio || '');
          }
        }
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showToast('Only JPEG, PNG, WEBP, and GIF images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload avatar');

      showToast('Avatar updated successfully!', 'success');
      fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading avatar';
      showToast(msg, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || savingProfile) return;

    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          bio: bio.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      showToast('Profile details updated!', 'success');
      fetchProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating profile';
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || savingPassword) return;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing password';
      showToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs font-mono">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center border border-white/10">
        <p className="text-xs text-slate-400 mb-4">Unable to load profile data.</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-2xl font-extrabold text-slate-100">User Profile & Account</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your identity, avatar, and security settings</p>
      </div>

      {/* Profile Overview Card & Avatar Upload */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400 shadow-vibe-glow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 font-extrabold text-3xl shadow-vibe-glow">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          )}

          <label
            htmlFor="avatarUploadInput"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-vibe-glow cursor-pointer transition-transform hover:scale-110"
            title="Upload New Avatar"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
          </label>
          <input
            type="file"
            id="avatarUploadInput"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl font-bold text-slate-100">{user.full_name}</h2>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              @{user.username}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          {user.bio && <p className="text-xs text-slate-300 mt-2 italic">&quot;{user.bio}&quot;</p>}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Member since {formatPrettyDate(user.created_at?.substring(0, 10))}
            </span>
          </div>
        </div>
      </div>

      {/* Productivity Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
            <div className="text-xl font-bold text-slate-100">{stats.completedCount}</div>
            <div className="text-[11px] text-slate-400">Completed Tasks</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <Flame className="w-5 h-5 mx-auto text-amber-400 mb-1" />
            <div className="text-xl font-bold text-amber-400">{stats.currentStreak} Days</div>
            <div className="text-[11px] text-slate-400">Current Streak</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <Trophy className="w-5 h-5 mx-auto text-purple-400 mb-1" />
            <div className="text-xl font-bold text-purple-400">{stats.longestStreak} Days</div>
            <div className="text-[11px] text-slate-400">Longest Streak</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
            <div className="text-xl font-bold text-cyan-400">{stats.completedChallengesCount}</div>
            <div className="text-[11px] text-slate-400">Habits Completed</div>
          </div>
        </div>
      )}

      {/* Edit Profile Form */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          Edit Profile Information
        </h3>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Bio</label>
            <textarea
              rows={2}
              placeholder="Tell us about your productivity goals..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-vibe-glow transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 mb-8">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-purple-400" />
          Security & Password Change
        </h3>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password (Min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-purple-glow transition-all active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
