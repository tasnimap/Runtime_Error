'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Sparkles, Bot, User, Loader2, RotateCcw, Zap, ChevronRight,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; args: any }[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  onClose: () => void;
  onDataMutated: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Next class', prompt: 'When is my next class?' },
  { label: 'Due this week', prompt: 'What assignments do I have due this week?' },
  { label: 'High-priority notices', prompt: 'Show me all high priority announcements.' },
  { label: 'Wednesday schedule', prompt: 'What classes do I have on Wednesday?' },
  { label: 'Free time activities', prompt: "I'm free until 2 PM — is there anything on campus I could drop into?" },
  { label: 'Labs with projector', prompt: 'Which labs have a projector and can fit at least 30 people?' },
];

export function ChatInterface({ onClose, onDataMutated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text.trim() }], history: conversationHistory }),
      });

      const data = await res.json();

      if (!data.success) {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-err`, role: 'assistant',
          content: `⚠️ **Error:** ${data.error || 'Something went wrong.'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      } else {
        const assistantMsg: Message = {
          id: `msg-${Date.now()}-ai`, role: 'assistant',
          content: data.response, toolCalls: data.toolCalls, timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (data.history) setConversationHistory(data.history);
        if (data.didMutate) onDataMutated();
      }
    } catch {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`, role: 'assistant',
        content: '⚠️ **Connection Error:** Could not reach the server.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationHistory, onDataMutated]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };
  const handleReset = () => { setMessages([]); setConversationHistory([]); setInput(''); };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      let rendered = line
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8edf5">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="background:rgba(0,212,255,0.1);padding:2px 6px;border-radius:4px;font-family:JetBrains Mono,monospace;font-size:11px;color:#00d4ff">$1</code>');

      const bulletMatch = line.match(/^(\s*)[•\-\*]\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length > 0 ? 'ml-4' : '';
        return (
          <div key={i} className={`flex items-start gap-1.5 ${indent}`}>
            <span style={{ color: '#00d4ff', marginTop: '3px', fontSize: '10px' }}>▸</span>
            <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^(\s*)[•\-\*]\s+/, '') }} />
          </div>
        );
      }
      if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#e8edf5', fontWeight: 600, fontSize: '13px', marginTop: '8px', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: rendered.replace('### ', '') }} />;
      if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#00d4ff', fontWeight: 700, fontSize: '13px', marginTop: '8px', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: rendered.replace('## ', '') }} />;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const toolNameDisplay = (name: string) => ({
    get_schedules: '📅 Checking schedules',
    get_rooms: '🚪 Checking rooms',
    book_room: '🔑 Booking room',
    cancel_booking: '❌ Cancelling booking',
    get_events: '🎉 Checking events',
    register_event: '✅ Registering',
    cancel_event_registration: '❌ Cancelling registration',
    get_announcements: '📢 Checking announcements',
    add_announcement: '📝 Posting announcement',
    get_assignments: '📚 Checking assignments',
    update_assignment_status: '✏️ Updating assignment',
  }[name] || `🔧 ${name}`);

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #070912 0%, #0a0d18 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,212,255,0.03)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl grad-border flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))' }}>
            <Bot className="w-5 h-5" style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>
              CampusOS Agent
              <span className="inline-flex items-center gap-0.5 tag" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                <Zap className="w-2.5 h-2.5" />
                Gemini
              </span>
            </h3>
            <p style={{ fontSize: '11px', color: '#4b5563' }}>Live data · Tool calling · AUST Campus</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleReset} title="New conversation"
            className="p-2 rounded-lg transition-all" style={{ color: '#4b5563' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00d4ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color: '#4b5563' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl grad-border flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#00d4ff' }} />
            </div>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#e8edf5', fontFamily: 'Outfit, sans-serif' }}>Hey, Sakibul! 👋</h3>
            <p className="text-sm max-w-[280px] mb-6" style={{ color: '#4b5563' }}>
              I read live campus data. Ask me about schedules, rooms, events, announcements, or assignments.
            </p>
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs transition-all group"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,212,255,0.25)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                    }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-medium">{action.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 msg-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center`}
                  style={msg.role === 'user'
                    ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }
                    : { background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(0,212,255,0.25)' }
                  }>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                    : <Bot className="w-3.5 h-3.5" style={{ color: '#00d4ff' }} />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed`}
                  style={msg.role === 'user'
                    ? { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#e8edf5', borderTopRightRadius: '4px' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', borderTopLeftRadius: '4px' }
                  }>
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {msg.toolCalls.map((tc, i) => (
                        <span key={i} className="tag" style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                          {toolNameDisplay(tc.name)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                  <div style={{ fontSize: '10px', color: '#374151', marginTop: '6px' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(0,212,255,0.25)' }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: '#00d4ff' }} />
                </div>
                <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTopLeftRadius: '4px' }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#4b5563' }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00d4ff' }} />
                    <span style={{ fontSize: '12px' }}>Thinking & querying live data...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about campus..."
              rows={1}
              className="os-input resize-none"
              style={{ maxHeight: '120px', paddingRight: '12px' }}
              disabled={isLoading}
            />
          </div>
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #00d4ff, #0099cc)'
                : 'rgba(255,255,255,0.06)',
              color: input.trim() && !isLoading ? '#070912' : '#4b5563',
              boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(0,212,255,0.3)' : 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p style={{ fontSize: '10px', color: '#1f2937', textAlign: 'center', marginTop: '8px' }}>
          Powered by Gemini 2.0 Flash · Reads live SQLite data
        </p>
      </div>
    </div>
  );
}
