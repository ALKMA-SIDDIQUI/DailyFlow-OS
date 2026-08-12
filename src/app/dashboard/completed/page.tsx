'use client';

import React, { useState, useEffect } from 'react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Task } from '@/lib/types';
import { CheckCircle2, History, Search } from 'lucide-react';

export default function CompletedTasksHistoryPage() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompletedTasks = async () => {
    try {
      let url = '/api/tasks?status=COMPLETED';
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCompletedTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-slate-100">Completed Tasks History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Review your historical mission accomplishments</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search completed tasks history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">Loading history...</div>
      ) : completedTasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-white/10">
          <History className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-base text-slate-200">No completed tasks yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete your first task from the dashboard or active tasks page to start building your productivity history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdated={fetchCompletedTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
