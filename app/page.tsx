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
import { Cpu } from 'lucide-react';

function CampusDashboard() {
  const [activeTab, setActiveTab] = useState<SystemTab>('schedules');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="grid-bg min-h-screen flex flex-col" style={{ position: 'relative' }}>
      {/* Ambient orbs */}
      <div className="orb orb-cyan" style={{ width: '600px', height: '600px', top: '-100px', left: '-100px' }} />
      <div className="orb orb-violet" style={{ width: '500px', height: '500px', bottom: '0', right: '-100px', animationDelay: '-10s' }} />
      <div className="orb orb-cyan" style={{ width: '300px', height: '300px', top: '50%', left: '50%', opacity: 0.06 }} />

      {/* Navbar */}
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <main className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto ${isChatOpen ? 'lg:pr-[460px]' : ''}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-2xl grad-border flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))' }}>
                <Cpu className="w-6 h-6 animate-spin" style={{ color: '#00d4ff' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
                Connecting to live SQLite database...
              </p>
            </div>
          ) : (
            <div>
              {activeTab === 'schedules' && <SchedulesSection schedules={schedules} onRefresh={fetchAllData} />}
              {activeTab === 'rooms' && <RoomsSection rooms={rooms} onRefresh={fetchAllData} />}
              {activeTab === 'events' && <EventsSection events={events} onRefresh={fetchAllData} />}
              {activeTab === 'announcements' && <AnnouncementsSection announcements={announcements} onRefresh={fetchAllData} />}
              {activeTab === 'assignments' && <AssignmentsSection assignments={assignments} onRefresh={fetchAllData} />}
            </div>
          )}
        </main>

        {/* Chat Drawer */}
        <div
          className={`fixed top-[105px] right-0 bottom-0 z-40 w-full sm:w-[440px] flex flex-col transition-transform duration-300 transform ${
            isChatOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            backdropFilter: 'blur(32px)',
            background: 'rgba(7,9,18,0.95)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          }}
        >
          <ChatInterface onClose={() => setIsChatOpen(false)} onDataMutated={fetchAllData} />
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
