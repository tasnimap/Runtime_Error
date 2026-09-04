'use client';

import React, { useState } from 'react';
import { Schedule } from '@/lib/types';
import { useToast } from './Toast';
import { Plus, Search, Trash2, Edit3, Clock, MapPin, User, BookOpen } from 'lucide-react';

interface SchedulesSectionProps {
  schedules: Schedule[];
  onRefresh: () => void;
}

const DAYS = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export function SchedulesSection({ schedules, onRefresh }: SchedulesSectionProps) {
  const { showToast } = useToast();
  const [selectedDay, setSelectedDay] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    day: 'Sunday' as Schedule['day'],
    start_time: '08:00',
    end_time: '08:50',
    room: '7A01',
    instructor: '',
    section: 'A',
  });

  const filtered = schedules.filter(s => {
    const matchesDay = selectedDay === 'All' || s.day === selectedDay;
    const matchesSearch =
      s.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDay && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      course: '',
      title: '',
      day: 'Sunday',
      start_time: '08:00',
      end_time: '08:50',
      room: '7A01',
      instructor: '',
      section: 'A',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      course: schedule.course,
      title: schedule.title,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room,
      instructor: schedule.instructor,
      section: schedule.section,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        // Edit
        const res = await fetch(`/api/schedules/${editingSchedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Schedule for ${formData.course} updated successfully`);
      } else {
        // Add
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`New class added: ${formData.course}`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Schedule deleted successfully');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course, title, instructor, or room..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Add Class Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Class to Timetable</span>
        </button>
      </div>

      {/* Day Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedDay === day
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {day}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 hidden md:block">
          Showing {filtered.length} of {schedules.length} classes
        </span>
      </div>

      {/* Timetable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(schedule => (
          <div
            key={schedule.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative group flex flex-col justify-between"
          >
            <div>
              {/* Header: Course code + Section + Day badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  {schedule.course}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    Sec {schedule.section}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {schedule.day}
                  </span>
                </div>
              </div>

              {/* Course Title */}
              <h3 className="text-sm font-medium text-slate-700 mb-3 line-clamp-2">
                {schedule.title}
              </h3>

              {/* Time, Room, Instructor Info */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {schedule.start_time} – {schedule.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Room: <strong className="text-slate-800 font-semibold">{schedule.room}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{schedule.instructor}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(schedule)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Edit schedule"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteConfirmId(schedule.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Delete class"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
            No class schedules found matching your filter.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingSchedule ? 'Edit Class Schedule' : 'Add Class to Timetable'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE 4113"
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B, B1/B2, CS"
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="Full course name"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Day</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value as Schedule['day'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {DAYS.filter(d => d !== 'All').map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    placeholder="13:00"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    placeholder="13:50"
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7A07"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor</label>
                  <input
                    type="text"
                    required
                    placeholder="Instructor Name"
                    value={formData.instructor}
                    onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingSchedule ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Schedule?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to remove this class from the timetable? This change will be saved to the database.
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
