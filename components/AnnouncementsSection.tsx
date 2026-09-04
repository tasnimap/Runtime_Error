'use client';

import React, { useState } from 'react';
import { Announcement } from '@/lib/types';
import { useToast } from './Toast';
import {
  Bell,
  Plus,
  Search,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
} from 'lucide-react';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onRefresh: () => void;
}

export function AnnouncementsSection({ announcements, onRefresh }: AnnouncementsSectionProps) {
  const { showToast } = useToast();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    date: '2026-09-04',
    priority: 'high' as Announcement['priority'],
    posted_by: '',
    expires: '2026-09-10',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = announcements.filter(a => {
    const matchesPriority = priorityFilter === 'All' || a.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.posted_by.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      body: '',
      date: '2026-09-04',
      priority: 'high',
      posted_by: 'CSE Department',
      expires: '2026-09-10',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      date: announcement.date,
      priority: announcement.priority,
      posted_by: announcement.posted_by,
      expires: announcement.expires,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('Announcement updated');
      } else {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('New announcement posted');
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Announcement deleted');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'High', 'Medium', 'Low'].map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              priorityFilter === p
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {p === 'All' ? 'All Priorities' : `${p} Priority`}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 hidden md:block">
          Showing {filtered.length} of {announcements.length} notices
        </span>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map(ann => (
          <div
            key={ann.id}
            className={`bg-white border rounded-2xl p-5 hover:shadow-md transition relative flex flex-col md:flex-row md:items-start justify-between gap-4 ${
              ann.priority === 'high' ? 'border-l-4 border-l-rose-500 border-slate-200' : 'border-slate-200'
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${getPriorityBadge(
                    ann.priority
                  )}`}
                >
                  {ann.priority} Priority
                </span>
                <span className="text-xs text-slate-400 font-mono">{ann.id}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {ann.title}
              </h3>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ann.body}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Posted by <strong className="text-slate-700 font-medium">{ann.posted_by}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date: {ann.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expires: {ann.expires}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center md:flex-col gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <button
                onClick={() => handleOpenEdit(ann)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Edit Announcement"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmId(ann.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            No announcements found matching the filter.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Post New Notice'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE 4113 Class Rescheduled"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Full text of the notice..."
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Posted</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expires Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expires}
                    onChange={e => setFormData({ ...formData, expires: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Posted By</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Dr. Md. Shahriar Mahbub"
                  value={formData.posted_by}
                  onChange={e => setFormData({ ...formData, posted_by: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Announcement?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to remove this notice?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
