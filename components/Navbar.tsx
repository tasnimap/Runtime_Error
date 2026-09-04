'use client';

import React from 'react';
import {
  Calendar,
  Layers,
  Sparkles,
  Database,
  Clock,
  BookOpen,
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

export function Navbar({
  activeTab,
  setActiveTab,
  isChatOpen,
  setIsChatOpen,
  counts,
}: NavbarProps) {
  const tabs: { id: SystemTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'schedules', label: 'Schedules', icon: <Calendar className="w-4 h-4" />, count: counts.schedules },
    { id: 'rooms', label: 'Rooms & Bookings', icon: <DoorOpen className="w-4 h-4" />, count: counts.rooms },
    { id: 'events', label: 'Campus Events', icon: <CalendarCheck className="w-4 h-4" />, count: counts.events },
    { id: 'announcements', label: 'Announcements', icon: <Bell className="w-4 h-4" />, count: counts.announcements },
    { id: 'assignments', label: 'Assignments', icon: <FileCheck2 className="w-4 h-4" />, count: counts.assignments },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CampusOS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AUST Campus
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Intelligent University Management Platform
              </p>
            </div>
          </div>

          {/* Center Info: Academic Simulated Clock & DB Status */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                <strong className="text-slate-800">Friday, 04 Sep 2026</strong> · 16:12
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Live SQLite (Single Source of Truth)</span>
            </div>
          </div>

          {/* AI Agent Drawer Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              isChatOpen
                ? 'bg-slate-900 text-white shadow-slate-900/20 ring-2 ring-slate-900'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Agent</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">Gemini</span>
          </button>
        </div>

        {/* System Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-100 pt-1 overflow-x-auto scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 font-semibold bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                  }`}
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
