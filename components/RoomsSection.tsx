'use client';

import React, { useState } from 'react';
import { Room, Booking } from '@/lib/types';
import { useToast } from './Toast';
import {
  DoorOpen,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  Tv,
  XCircle,
  CalendarPlus,
  Trash2,
  Edit3,
  CheckCircle,
} from 'lucide-react';

interface RoomsSectionProps {
  rooms: Room[];
  onRefresh: () => void;
}

export function RoomsSection({ rooms, onRefresh }: RoomsSectionProps) {
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({
    booked_by: '',
    date: '2026-09-05',
    start_time: '14:00',
    end_time: '16:00',
    purpose: '',
  });

  // Add / Edit Room Modal State
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: '',
    type: 'classroom' as Room['type'],
    capacity: 40,
    equipment: 'whiteboard, projector, AC',
    floor: 7,
    status: 'available' as Room['status'],
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = rooms.filter(r => {
    const matchesType = selectedType === 'All' || r.type.toLowerCase() === selectedType.toLowerCase();
    const matchesEq = !equipmentFilter || r.equipment.some(e => e.toLowerCase().includes(equipmentFilter.toLowerCase()));
    const matchesSearch = r.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesEq && matchesSearch;
  });

  // Handle Booking
  const handleOpenBook = (room: Room) => {
    setBookingRoom(room);
    setBookingForm({
      booked_by: 'Sakibul Hassan',
      date: '2026-09-05',
      start_time: '14:00',
      end_time: '16:00',
      purpose: 'Project Discussion & Presentation',
    });
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRoom) return;

    try {
      const res = await fetch(`/api/rooms/${bookingRoom.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast(`Room ${bookingRoom.room_number} booked successfully for ${bookingForm.date}!`);
      setBookingRoom(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch('/api/rooms/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('Booking cancelled successfully');
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Add / Edit Room
  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      room_number: '',
      type: 'classroom',
      capacity: 40,
      equipment: 'whiteboard, projector, AC',
      floor: 7,
      status: 'available',
    });
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      type: room.type,
      capacity: room.capacity,
      equipment: room.equipment.join(', '),
      floor: room.floor,
      status: room.status,
    });
    setRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        room_number: roomForm.room_number,
        type: roomForm.type,
        capacity: Number(roomForm.capacity),
        equipment: roomForm.equipment.split(',').map(s => s.trim()).filter(Boolean),
        floor: Number(roomForm.floor),
        status: roomForm.status,
      };

      if (editingRoom) {
        const res = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Room ${payload.room_number} updated`);
      } else {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        showToast(`Room ${payload.room_number} created`);
      }

      setRoomModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      showToast('Room deleted');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search room number (e.g. 7A02)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={equipmentFilter}
            onChange={e => setEquipmentFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Equipment</option>
            <option value="projector">Has Projector</option>
            <option value="smart board">Has Smart Board</option>
            <option value="computers">Has Computers</option>
            <option value="microphone">Has Microphone</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddRoom}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Type Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Classroom', 'Lab', 'Seminar'].map(t => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedType === t
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {t === 'All' ? 'All Room Types' : t + 's'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 hidden md:block">
          Showing {filtered.length} of {rooms.length} rooms
        </span>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(room => (
          <div
            key={room.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 border border-slate-200">
                    {room.room_number}
                  </div>
                  <div>
                    <span className="capitalize font-semibold text-slate-900 text-sm block">
                      {room.type}
                    </span>
                    <span className="text-[11px] text-slate-500">Floor {room.floor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {room.capacity}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      room.status === 'available'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
              </div>

              {/* Equipment Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {room.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-md text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Bookings List */}
              <div className="border-t border-slate-100 pt-3 mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Current Bookings</span>
                  <span className="text-slate-400 font-normal">({room.bookings.length})</span>
                </div>
                {room.bookings.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No scheduled bookings</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {room.bookings.map(b => (
                      <div
                        key={b.booking_id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {b.date} · {b.start_time}–{b.end_time}
                          </div>
                          <p className="text-slate-600 truncate">{b.purpose}</p>
                          <span className="text-[11px] text-slate-500 block">By {b.booked_by}</span>
                        </div>
                        <button
                          onClick={() => handleCancelBooking(b.booking_id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition"
                          title="Cancel this booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions: Book Room + Edit / Delete */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleOpenBook(room)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Book Room</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditRoom(room)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Edit Room"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(room.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete Room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Room Modal */}
      {bookingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Book Room {bookingRoom.room_number}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Capacity {bookingRoom.capacity} · {bookingRoom.type} · Floor {bookingRoom.floor}
            </p>

            <form onSubmit={handleBookSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Booked By (Name / Org)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nusrat Jahan, AUSTPIC"
                  value={bookingForm.booked_by}
                  onChange={e => setBookingForm({ ...bookingForm, booked_by: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="text"
                    required
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    placeholder="15:00"
                    value={bookingForm.start_time}
                    onChange={e => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="text"
                    required
                    pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                    placeholder="17:00"
                    value={bookingForm.end_time}
                    onChange={e => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Class, Workshop, Club Meeting"
                  value={bookingForm.purpose}
                  onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingRoom(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
            </h2>
            <form onSubmit={handleRoomSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7A08"
                    value={roomForm.room_number}
                    onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={roomForm.type}
                    onChange={e => setRoomForm({ ...roomForm, type: e.target.value as Room['type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="seminar">Seminar Hall</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomForm.capacity}
                    onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                  <input
                    type="number"
                    required
                    value={roomForm.floor}
                    onChange={e => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={roomForm.status}
                    onChange={e => setRoomForm({ ...roomForm, status: e.target.value as Room['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipment (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="whiteboard, projector, AC, smart board"
                  value={roomForm.equipment}
                  onChange={e => setRoomForm({ ...roomForm, equipment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingRoom ? 'Save Changes' : 'Create Room'}
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
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Room?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this room? Any associated bookings will also be removed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(deleteConfirmId)}
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
