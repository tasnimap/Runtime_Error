'use client';

import React, { useState } from 'react';
import { Schedule } from '@/lib/types';
import { useToast } from './Toast';
import { Plus, Search, Trash2, Edit3, Clock, MapPin, User, BookOpen, X } from 'lucide-react';

interface SchedulesSectionProps {
  schedules: Schedule[];
  onRefresh: () => void;
}

const DAYS = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sunday: { bg: 'rgba(168,85,247,0.15)', text: '#c4b5fd', border: 'rgba(168,85,247,0.3)' },
  Monday: { bg: 'rgba(0,212,255,0.12)', text: '#67e8f9', border: 'rgba(0,212,255,0.3)' },
  Tuesday: { bg: 'rgba(34,211,153,0.12)', text: '#6ee7b7', border: 'rgba(34,211,153,0.3)' },
  Wednesday: { bg: 'rgba(251,191,36,0.12)', text: '#fcd34d', border: 'rgba(251,191,36,0.3)' },
  Thursday: { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
};

export function SchedulesSection({ schedules, onRefresh }: SchedulesSectionProps) {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    course: '', title: '', day: 'Sunday' as Schedule['day'],
    start_time: '08:00', end_time: '08:50', room: '7A01',
    instructor: '', section: 'A',
  });

  const filtered = schedules.filter(s => {
    const matchesDay = selectedDay === 'All' || s.day === selectedDay;
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.course.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) ||
      s.instructor.toLowerCase().includes(q) || s.room.toLowerCase().includes(q);
    return matchesDay && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({ course: '', title: '', day: 'Sunday', start_time: '08:00', end_time: '08:50', room: '7A01', instructor: '', section: 'A' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({ course: schedule.course, title: schedule.title, day: schedule.day, start_time: schedule.start_time, end_time: schedule.end_time, room: schedule.room, instructor: schedule.instructor, section: schedule.section });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        const res = await fetch(`/api/schedules/${editingSchedule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Schedule for ${formData.course} updated successfully`);
      } else {
        const res = await fetch('/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`New class added: ${formData.course}`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Schedule deleted successfully');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e8edf5', padding: '8px 12px', width: '100%', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '14px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '600' as const, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4b5563' }} />
          <input
            type="text"
            placeholder="Search course, instructor, room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="os-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <button id="add-schedule-btn" onClick={handleOpenAdd} className="os-btn os-btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Class</span>
        </button>
      </div>

      {/* Day Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map(day => {
          const isActive = selectedDay === day;
          const col = day !== 'All' ? DAY_COLORS[day] : null;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={isActive
                ? (col
                  ? { background: col.bg, color: col.text, border: `1px solid ${col.border}` }
                  : { background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' })
                : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {day}
            </button>
          );
        })}
        <span className="ml-auto text-xs hidden md:block" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length}/{schedules.length} classes
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(schedule => {
          const dayCol = DAY_COLORS[schedule.day] || { bg: 'rgba(255,255,255,0.06)', text: '#9ca3af', border: 'rgba(255,255,255,0.1)' };
          return (
            <div
              key={schedule.id}
              className="glass card-3d rounded-2xl p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-base flex items-center gap-1.5" style={{ color: '#00d4ff', fontFamily: 'Outfit, sans-serif' }}>
                    <BookOpen className="w-4 h-4" />
                    {schedule.course}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Sec {schedule.section}
                    </span>
                    <span className="tag" style={{ background: dayCol.bg, color: dayCol.text, border: `1px solid ${dayCol.border}` }}>
                      {schedule.day}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium mb-3 line-clamp-2" style={{ color: '#9ca3af' }}>
                  {schedule.title}
                </h3>

                <hr className="hr-glow mb-3" />

                {/* Details */}
                <div className="space-y-2 text-xs" style={{ color: '#6b7280' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" style={{ color: '#00d4ff', opacity: 0.7 }} />
                    <span>{schedule.start_time} – {schedule.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" style={{ color: '#a855f7', opacity: 0.7 }} />
                    <span>Room <strong style={{ color: '#e8edf5' }}>{schedule.room}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" style={{ color: '#34d399', opacity: 0.7 }} />
                    <span className="truncate" style={{ color: '#9ca3af' }}>{schedule.instructor}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 flex items-center justify-end gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => handleOpenEdit(schedule)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: '#6b7280', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(schedule.id)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: '#6b7280', background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl" style={{ border: '1px dashed rgba(255,255,255,0.08)', color: '#374151' }}>
            No schedules found.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-lg w-full p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>
                {editingSchedule ? 'Edit Class Schedule' : 'Add Class to Timetable'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg transition" style={{ color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Course Code</label>
                  <input type="text" required placeholder="e.g. CSE 4113" value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })} className="os-input" />
                </div>
                <div>
                  <label style={labelStyle}>Section</label>
                  <input type="text" required placeholder="e.g. A, B1" value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })} className="os-input" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Course Title</label>
                <input type="text" required placeholder="Full course name" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} className="os-input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={labelStyle}>Day</label>
                  <select value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value as Schedule['day'] })} className="os-input">
                    {DAYS.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Start Time</label>
                  <input type="text" required placeholder="08:00" value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="os-input" />
                </div>
                <div>
                  <label style={labelStyle}>End Time</label>
                  <input type="text" required placeholder="08:50" value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="os-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Room</label>
                  <input type="text" required placeholder="e.g. 7A07" value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })} className="os-input" />
                </div>
                <div>
                  <label style={labelStyle}>Instructor</label>
                  <input type="text" required placeholder="Instructor Name" value={formData.instructor}
                    onChange={e => setFormData({ ...formData, instructor: e.target.value })} className="os-input" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="os-btn os-btn-ghost" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="os-btn os-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingSchedule ? 'Save Changes' : 'Create Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="modal-backdrop">
          <div className="modal-panel max-w-sm w-full p-6 mx-4">
            <h3 className="text-base font-bold mb-2" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>Delete Schedule?</h3>
            <p className="text-sm mb-5" style={{ color: '#6b7280' }}>This will permanently remove the class from the timetable database.</p>
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
