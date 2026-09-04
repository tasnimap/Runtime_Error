'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  RotateCcw,
  Zap,
  MessageSquare,
  ChevronRight,
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: text.trim() }],
            history: conversationHistory,
          }),
        });

        const data = await res.json();

        if (!data.success) {
          const errorMsg: Message = {
            id: `msg-${Date.now()}-err`,
            role: 'assistant',
            content: `⚠️ **Error:** ${data.error || 'Something went wrong. Please try again.'}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        } else {
          const assistantMsg: Message = {
            id: `msg-${Date.now()}-ai`,
            role: 'assistant',
            content: data.response,
            toolCalls: data.toolCalls,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          // Update conversation history for multi-turn
          if (data.history) {
            setConversationHistory(data.history);
          }

          // If any tool mutated data, refresh the dashboard
          if (data.didMutate) {
            onDataMutated();
          }
        }
      } catch (err: any) {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `⚠️ **Connection Error:** Could not reach the server. Please check your connection.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationHistory, onDataMutated]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationHistory([]);
    setInput('');
  };

  // Simple markdown renderer for bold, italic, bullet points, and code
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Convert **bold** and *italic*
      let rendered = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-emerald-700">$1</code>');

      // Handle bullet points
      const bulletMatch = line.match(/^(\s*)[•\-\*]\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length > 0 ? 'ml-4' : '';
        return (
          <div key={i} className={`flex items-start gap-1.5 ${indent}`}>
            <span className="text-emerald-500 mt-1 text-xs">•</span>
            <span dangerouslySetInnerHTML={{ __html: rendered.replace(/^(\s*)[•\-\*]\s+/, '') }} />
          </div>
        );
      }

      // Handle headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="font-semibold text-sm mt-2 mb-1" dangerouslySetInnerHTML={{ __html: rendered.replace('### ', '') }} />;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="font-bold text-sm mt-2 mb-1" dangerouslySetInnerHTML={{ __html: rendered.replace('## ', '') }} />;
      }

      // Empty line = spacer
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const toolNameDisplay = (name: string) => {
    const map: Record<string, string> = {
      get_schedules: '📅 Checking schedules',
      get_rooms: '🚪 Checking rooms',
      book_room: '🔑 Booking room',
      cancel_booking: '❌ Cancelling booking',
      get_events: '🎉 Checking events',
      register_event: '✅ Registering for event',
      cancel_event_registration: '❌ Cancelling registration',
      get_announcements: '📢 Checking announcements',
      add_announcement: '📝 Posting announcement',
      get_assignments: '📚 Checking assignments',
      update_assignment_status: '✏️ Updating assignment',
    };
    return map[name] || `🔧 ${name}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              CampusOS Agent
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Zap className="w-2.5 h-2.5" />
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Live data · Tool calling · AUST Campus</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            title="New conversation"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">Hey, Sakibul! 👋</h3>
            <p className="text-sm text-slate-500 max-w-[280px] mb-6">
              I read live campus data. Ask me anything about schedules, rooms, events, announcements, or assignments.
            </p>
            <div className="w-full space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="text-left px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs text-slate-700 hover:text-emerald-800 transition-all group shadow-sm"
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-medium">{action.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white rounded-tr-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-md shadow-sm'
                  }`}
                >
                  {/* Tool calls badge */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {msg.toolCalls.map((tc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          {toolNameDisplay(tc.name)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className={msg.role === 'user' ? '' : 'prose-sm'}>
                    {renderMarkdown(msg.content)}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-xs">Thinking & querying live data...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about campus..."
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              style={{ maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Powered by Gemini 2.0 Flash · Reads live SQLite data
        </p>
      </div>
    </div>
  );
}
