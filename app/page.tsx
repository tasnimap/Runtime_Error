'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider } from '@/components/Toast';
import { Navbar, SystemTab } from '@/components/Navbar';
import { SchedulesSection } from '@/components/SchedulesSection';
import { RoomsSection } from '@/components/RoomsSection';
import { EventsSection } from '@/components/EventsSection';
import { AnnouncementsSection } from '@/components/AnnouncementsSection';
import { AssignmentsSection } from '@/components/AssignmentsSection';
import { ChatInterface } from '@/components/ChatInterface';
import { Schedule, Room, CampusEvent, Announcement, Assignment } from '@/lib/types';
import { RefreshCw, Database } from 'lucide-react';

function CampusDashboard() {
  const [activeTab, setActiveTab] = useState<SystemTab>('schedules');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Data State
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all 5 systems from live SQLite backend
  const fetchAllData = useCallback(async () => {
    try {
      const [schRes, roomRes, evtRes, annRes, asgnRes] = await Promise.all([
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/rooms').then(r => r.json()),
        fetch('/api/events').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json()),
        fetch('/api/assignments').then(r => r.json()),
      ]);

      if (schRes.success) setSchedules(schRes.data);
      if (roomRes.success) setRooms(roomRes.data);
      if (evtRes.success) setEvents(evtRes.data);
      if (annRes.success) setAnnouncements(annRes.data);
      if (asgnRes.success) setAssignments(asgnRes.data);
    } catch (err) {
      console.error('Failed to load campus data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        counts={{
          schedules: schedules.length,
          rooms: rooms.length,
          events: events.length,
          announcements: announcements.length,
          assignments: assignments.length,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Campus Data Manager Dashboard */}
        <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto ${isChatOpen ? 'lg:pr-96 xl:pr-[430px]' : ''}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Connecting to live SQLite database...</p>
            </div>
          ) : (
            <div>
              {activeTab === 'schedules' && (
                <SchedulesSection schedules={schedules} onRefresh={fetchAllData} />
              )}
              {activeTab === 'rooms' && (
                <RoomsSection rooms={rooms} onRefresh={fetchAllData} />
              )}
              {activeTab === 'events' && (
                <EventsSection events={events} onRefresh={fetchAllData} />
              )}
              {activeTab === 'announcements' && (
                <AnnouncementsSection announcements={announcements} onRefresh={fetchAllData} />
              )}
              {activeTab === 'assignments' && (
                <AssignmentsSection assignments={assignments} onRefresh={fetchAllData} />
              )}
            </div>
          )}
        </main>

        {/* Right Side / Drawer: AI Agent Assistant */}
        <div
          className={`fixed top-16 right-0 bottom-0 z-40 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 transform flex flex-col ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ChatInterface
            onClose={() => setIsChatOpen(false)}
            onDataMutated={fetchAllData}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <CampusDashboard />
    </ToastProvider>
  );
}
