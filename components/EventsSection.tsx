'use client';

import React, { useState } from 'react';
import { CampusEvent, Registration } from '@/lib/types';
import { useToast } from './Toast';
import {
  CalendarCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  Users,
  Building2,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EventsSectionProps {
  events: CampusEvent[];
  onRefresh: () => void;
}

export function EventsSection({ events, onRefresh }: EventsSectionProps) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRegistrationsId, setExpandedRegistrationsId] = useState<string | null>(null);

  // Register Student Modal State
  const [registeringEvent, setRegisteringEvent] = useState<CampusEvent | null>(null);
  const [regForm, setRegForm] = useState({
    student_id: '20-40532',
    name: 'Sakibul Hassan',
  });

  // Add / Edit Event Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    date: '2026-09-08',
    start_time: '14:00',
    end_time: '16:00',
    end_date: '2026-09-08',
    venue: '7C01',
    organizer: 'CSE Department',
    capacity: 60,
    status: 'upcoming' as CampusEvent['status'],
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = events.filter(e => {
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Register Student
  const handleOpenRegister = (event: CampusEvent) => {
    setRegisteringEvent(event);
    setRegForm({
      student_id: '20-40532',
      name: 'Sakibul Hassan',
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;

    try {
      const res = await fetch(`/api/events/${registeringEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(`Registered for ${registeringEvent.name}!`);
      setRegisteringEvent(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Cancel Registration
  const handleCancelRegistration = async (eventId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/cancel-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(`Registration cancelled for student ${studentId}`);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Add / Edit Event
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      name: '',
      description: '',
      date: '2026-09-08',
      start_time: '14:00',
      end_time: '16:00',
      end_date: '2026-09-08',
      venue: '7C01',
      organizer: 'CSE Department',
      capacity: 60,
      status: 'upcoming',
    });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: CampusEvent) => {
    setEditingEvent(event);
    setEventForm({
      name: event.name,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      end_date: event.end_date,
      venue: event.venue,
      organizer: event.organizer,
      capacity: event.capacity,
      status: event.status,
    });
    setEventModalOpen(true);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        const res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Event updated: ${eventForm.name}`);
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...eventForm,
            capacity: Number(eventForm.capacity),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Event created: ${eventForm.name}`);
      }

      setEventModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Event deleted');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getStatusBadge = (status: CampusEvent['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'ongoing':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'full':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event name, venue, organizer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="full">Full</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddEvent}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campus Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map(event => {
          const percentFull = Math.min(100, Math.round((event.registered / event.capacity) * 100));
          const isExpanded = expandedRegistrationsId === event.id;
          const isFull = event.registered >= event.capacity || event.status === 'full';

          return (
            <div
              key={event.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug flex-1">
                    {event.name}
                  </h3>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${getStatusBadge(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {event.date}
                      {event.end_date !== event.date ? ` – ${event.end_date}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {event.start_time} – {event.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Venue: <strong className="text-slate-800">{event.venue}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{event.organizer}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Registration Capacity
                    </span>
                    <span className="font-semibold text-slate-800">
                      {event.registered} / {event.capacity} ({percentFull}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFull ? 'bg-amber-500' : percentFull > 80 ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentFull}%` }}
                    />
                  </div>
                </div>

                {/* Registrations List Accordion */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setExpandedRegistrationsId(isExpanded ? null : event.id)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                  >
                    <span>Registered Students ({event.registrations.length})</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {event.registrations.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No students registered yet</p>
                      ) : (
                        event.registrations.map(reg => (
                          <div
                            key={reg.student_id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{reg.name}</span>
                              <span className="text-slate-500 ml-2 font-mono">({reg.student_id})</span>
                            </div>
                            <button
                              onClick={() => handleCancelRegistration(event.id, reg.student_id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                              title="Cancel registration"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenRegister(event)}
                  disabled={isFull}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-2xs ${
                    isFull
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isFull ? 'Event Full' : 'Register Student'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditEvent(event)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Event"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(event.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Student Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Register for Event
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              {registeringEvent.name} ({registeringEvent.registered}/{registeringEvent.capacity} registered)
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20-40532"
                  value={regForm.student_id}
                  onChange={e => setRegForm({ ...regForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sakibul Hassan"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegisteringEvent(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingEvent ? 'Edit Campus Event' : 'Create New Event'}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AUSTPIC AI Build Hackathon"
                  value={eventForm.name}
                  onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Brief description of the event..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.end_date}
                    onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="text"
                    required
                    placeholder="14:00"
                    value={eventForm.start_time}
                    onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="text"
                    required
                    placeholder="16:00"
                    value={eventForm.end_time}
                    onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue (Room Number)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7C05"
                    value={eventForm.venue}
                    onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organizer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUSTPIC, CSE Dept"
                    value={eventForm.organizer}
                    onChange={e => setEventForm({ ...eventForm, organizer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={eventForm.capacity}
                    onChange={e => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={e => setEventForm({ ...eventForm, status: e.target.value as CampusEvent['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="full">Full</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
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
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Event?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this event and its registered attendee records?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirmId)}
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
