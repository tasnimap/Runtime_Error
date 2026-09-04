'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Sparkles,
  Database,
  Clock,
  DoorOpen,
  CalendarCheck,
  Bell,
  FileCheck2,
} from 'lucide-react';

export type SystemTab = 'schedules' | 'rooms' | 'events' | 'announcements' | 'assignments';

interface NavbarProps {
  activeTab: SystemTab;
  setActiveTab: (tab: SystemTab) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  counts: {
    schedules: number;
    rooms: number;
    events: number;
    announcements: number;
    assignments: number;
  };
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Navbar({
  activeTab,
  setActiveTab,
  isChatOpen,
  setIsChatOpen,
  counts,
}: NavbarProps) {
  const now = useLiveClock();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const tabs: { id: SystemTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'schedules', label: 'Schedules', icon: <Calendar className="w-4 h-4" />, count: counts.schedules },
    { id: 'rooms', label: 'Rooms & Bookings', icon: <DoorOpen className="w-4 h-4" />, count: counts.rooms },
    { id: 'events', label: 'Campus Events', icon: <CalendarCheck className="w-4 h-4" />, count: counts.events },
    { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" />, count: counts.announcements },
    { id: 'assignments', label: 'Assignments', icon: <FileCheck2 className="w-4 h-4" />, count: counts.assignments },
  ];

  return (
    <header className="navbar sticky top-0 z-30">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grad-border flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))',
              }}
            >
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white"
                  style={{ fontFamily: 'Outfit, sans-serif' }}>
                  CampusOS
                </span>
                <span className="tag"
                  style={{
                    background: 'rgba(0,212,255,0.1)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0,212,255,0.25)',
                  }}>
                  AUST Campus
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
                Intelligent University Management Platform
              </p>
            </div>
          </div>

          {/* Center Info */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                <strong className="text-slate-300">{dateStr}</strong> · {timeStr}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(0,212,255,0.06)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#00d4ff',
              }}>
              <Database className="w-3.5 h-3.5" />
              <span className="font-medium">Live SQLite</span>
            </div>
          </div>

          {/* AI Agent Button */}
          <button
            id="ai-agent-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="os-btn os-btn-primary flex items-center gap-2"
            style={isChatOpen ? {
              background: 'rgba(0,212,255,0.15)',
              color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.3)',
              boxShadow: '0 0 20px rgba(0,212,255,0.2)',
            } : {}}
          >
            <Sparkles className="w-4 h-4" style={{ color: isChatOpen ? '#00d4ff' : '#fbbf24' }} />
            <span>AI Agent</span>
            <span className="tag" style={{
              background: 'rgba(255,255,255,0.15)',
              color: isChatOpen ? '#00d4ff' : '#070912',
              border: 'none',
            }}>Gemini</span>
          </button>
        </div>

        {/* System Navigation Tabs */}
        <div className="flex space-x-1 border-t overflow-x-auto scrollbar-none"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'tab-active'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-600'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    background: isActive ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#00d4ff' : '#6b7280',
                    border: isActive ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

