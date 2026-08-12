'use client';

import React, { useState, useEffect } from 'react';
import { TaskCard } from '@/components/tasks/TaskCard';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { Task } from '@/lib/types';
import { CheckSquare, Search, Filter } from 'lucide-react';

export default function ActiveTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      let url = '/api/tasks?status=PENDING';
      if (categoryFilter !== 'All') {
        url += `&category=${categoryFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Listen for data update events dispatched across app modals
    const handleDataUpdated = () => {
      fetchTasks();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dailyflow_data_updated', handleDataUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dailyflow_data_updated', handleDataUpdated);
      }
    };
  }, [categoryFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-slate-100">Active & Pending Missions</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage and execute your active tasks</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs sm:text-sm bg-slate-900"
          >
            <option value="All">All Categories</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Study">Study</option>
            <option value="Coding">Coding</option>
            <option value="Health">Health</option>
            <option value="Fitness">Fitness</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">Loading missions...</div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-white/10">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-base text-slate-200">No active tasks found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search or category filter.'
              : 'Your mission queue is clear! Use "New Task" in the top bar to create one.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdated={fetchTasks}
              onEdit={(t) => setEditingTask(t)}
            />
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
}
