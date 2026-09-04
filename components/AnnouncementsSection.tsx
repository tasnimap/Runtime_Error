'use client';

import React, { useState } from 'react';
import { Announcement } from '@/lib/types';
import { useToast } from './Toast';
import { Bell, Plus, Search, Calendar, User, Clock, Trash2, Edit3, X } from 'lucide-react';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onRefresh: () => void;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  high: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.3)', accent: '#ef4444' },
  medium: { bg: 'rgba(251,191,36,0.1)', text: '#fcd34d', border: 'rgba(251,191,36,0.3)', accent: '#f59e0b' },
  low: { bg: 'rgba(255,255,255,0.05)', text: '#6b7280', border: 'rgba(255,255,255,0.1)', accent: '#4b5563' },
};

export function AnnouncementsSection({ announcements, onRefresh }: AnnouncementsSectionProps) {
  const { showToast } = useToast();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '', body: '', date: '2026-09-04',
    priority: 'high' as Announcement['priority'],
    posted_by: '', expires: '2026-09-10',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = announcements.filter(a => {
    const matchesPriority = priorityFilter === 'All' || a.priority.toLowerCase() === priorityFilter.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) || a.posted_by.toLowerCase().includes(q);
    return matchesPriority && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', body: '', date: '2026-09-04', priority: 'high', posted_by: 'CSE Department', expires: '2026-09-10' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setFormData({ title: a.title, body: a.body, date: a.date, priority: a.priority, posted_by: a.posted_by, expires: a.expires });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('Announcement updated');
      } else {
        const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast('New announcement posted');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Announcement deleted');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4b5563' }} />
          <input type="text" placeholder="Search announcements..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="os-input" style={{ paddingLeft: '36px' }} />
        </div>
        <button id="add-announcement-btn" onClick={handleOpenAdd} className="os-btn os-btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'High', 'Medium', 'Low'].map(p => {
          const isActive = priorityFilter === p;
          const pKey = p.toLowerCase();
          const col = pKey !== 'all' ? PRIORITY_STYLES[pKey] : null;
          return (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={isActive
                ? (col ? { background: col.bg, color: col.text, border: `1px solid ${col.border}` } : { background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' })
                : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
              {p === 'All' ? 'All Priorities' : `${p} Priority`}
            </button>
          );
        })}
        <span className="ml-auto text-xs hidden md:block" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length}/{announcements.length} notices
        </span>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filtered.map(ann => {
          const pStyle = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.low;
          return (
            <div key={ann.id} className="glass card-3d rounded-2xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              style={{ borderLeft: `3px solid ${pStyle.accent}` }}>
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag" style={{ background: pStyle.bg, color: pStyle.text, border: `1px solid ${pStyle.border}` }}>
                    {ann.priority} Priority
                  </span>
                  <span className="text-xs" style={{ color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>{ann.id}</span>
                </div>
                <h3 className="text-base font-bold leading-snug" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>{ann.title}</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#6b7280' }}>{ann.body}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs pt-2" style={{ color: '#4b5563' }}>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" style={{ color: '#00d4ff', opacity: 0.6 }} />
                    <span>Posted by <strong style={{ color: '#9ca3af' }}>{ann.posted_by}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#a855f7', opacity: 0.6 }} />
                    <span>{ann.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b', opacity: 0.6 }} />
                    <span>Expires: {ann.expires}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center md:flex-col gap-1 shrink-0">
                <button onClick={() => handleOpenEdit(ann)} className="p-2 rounded-lg transition-all" style={{ color: '#6b7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirmId(ann.id)} className="p-2 rounded-lg transition-all" style={{ color: '#6b7280' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)', color: '#374151' }}>
            No announcements found.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg w-full p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>
                {editingAnnouncement ? 'Edit Announcement' : 'Post New Notice'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg" style={{ color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label style={labelStyle}>Headline / Title</label>
                <input type="text" required placeholder="e.g. CSE 4113 Class Rescheduled" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} className="os-input" />
              </div>
              <div>
                <label style={labelStyle}>Announcement Body</label>
                <textarea required rows={4} placeholder="Full text of the notice..." value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })} className="os-input" style={{ resize: 'vertical' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as Announcement['priority'] })} className="os-input">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date Posted</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="os-input" />
                </div>
                <div>
                  <label style={labelStyle}>Expires Date</label>
                  <input type="date" required value={formData.expires} onChange={e => setFormData({ ...formData, expires: e.target.value })} className="os-input" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Posted By</label>
                <input type="text" required placeholder="e.g. Prof. Dr. Md. Shahriar Mahbub" value={formData.posted_by}
                  onChange={e => setFormData({ ...formData, posted_by: e.target.value })} className="os-input" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="os-btn os-btn-ghost">Cancel</button>
                <button type="submit" className="os-btn os-btn-primary">{editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm w-full p-6 mx-4">
            <h3 className="text-base font-bold mb-2" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>Delete Announcement?</h3>
            <p className="text-sm mb-5" style={{ color: '#6b7280' }}>Are you sure you want to remove this notice?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="os-btn os-btn-ghost">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="os-btn os-btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
