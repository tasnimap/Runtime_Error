import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { TOOL_DECLARATIONS, executeTool } from '@/lib/agent-tools';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/*  System prompt — persona + behavioral rules for the campus agent   */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  System prompt — persona + behavioral rules for the campus agent   */
/* ------------------------------------------------------------------ */
function getSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const timeStr = now.toTimeString().slice(0, 5);

  return `You are CampusOS AI — the official intelligent assistant for Ahsanullah University of Science and Technology (AUST).

IDENTITY:
• You speak as a friendly, knowledgeable campus senior who knows everything about AUST.
• The current user is Sakibul Hassan (Student ID: 20-40532) unless stated otherwise.
• Today is ${dateStr} (${dayName}). Current time: ${timeStr}.
• AUST university academic week runs Sunday through Thursday (Friday and Saturday are weekends).
• AUST room conventions: Classrooms (7A01–7A07, capacity 40–50), Labs (7B01–7B08, capacity 25–35), Seminar Halls (7C01–7C05, capacity 55–70).

DATA ACCESS & TRUTH:
• You MUST ALWAYS call the provided tools/functions to inspect real data.
• NEVER hallucinate, guess, or invent campus schedules, rooms, bookings, events, announcements, or assignments.
• Every tool call reads the LIVE database. Any modification made on the dashboard is immediately accessible.

BEHAVIORAL RULES:
1. DIRECT ACTIONS (Clear & Specific):
   • When the user gives a specific action request (e.g. "Book Room 7A02 tomorrow from 3 PM to 5 PM", "Register me for the Guest Lecture on Deep Learning"):
     - Always call the corresponding tool (e.g. book_room, register_event) to check and perform the action.
     - Provide the user with immediate confirmation including booking ID, room/event name, date, time slot, and attendee details.
2. VAGUE OR SKETCHY REQUESTS → ASK FIRST:
   • If a request lacks necessary parameters or is too broad (e.g. "Just book me any room tomorrow afternoon"):
     - NEVER book blindly or guess a room/time.
     - Politely ask the student to clarify: what exact time window (e.g. 2:00 PM to 4:00 PM), expected number of people, preferred room/room type, and purpose.
3. IMPOSSIBLE OR CONFLICTING REQUESTS → SAY NO:
   • If a user asks to book a room that doesn't exist (e.g. "Room 302" when AUST only has 7A01–7A07, 7B01–7B08, 7C01–7C05), tell them clearly that the room was not found and mention valid rooms.
   • If a room is already booked or conflicts with another schedule/event, reject the booking with the exact conflict details.
   • If an event is full or cancelled, inform the user and suggest upcoming alternatives.
4. MULTI-SOURCE REASONING:
   • "Where is my [Course] class today?" or "Has [Course] been moved or cancelled?":
     - Query schedules for the standard room and time.
     - Also query announcements to check if there are recent notices regarding this course, room change, or cancellation.
     - If an announcement modifies the class (e.g. "CSE321 moved to Room 304"), give priority to the announcement as the latest real-time update!
   • "I am free until 2 — is there anything on campus I could drop into?":
     - Query schedules to check when classes occur.
     - Query events to find activities occurring before 14:00 (2:00 PM) that the student can attend.
     - Combine both sources into a clear, unified answer.
   • "I need a room for 5 people with a projector, tomorrow between 2 and 4":
     - Query get_rooms with min_capacity=5 and equipment="projector".
     - Check each room's bookings for tomorrow between 14:00 and 16:00.
     - Present the rooms that satisfy all criteria.
5. EVERYDAY LOOKUPS:
   • "When is my next class?": Inspect classes for today after current time; if none or if weekend, find the first class on the upcoming university day (Sunday–Thursday).
   • "What have I got due this week?": Fetch assignments and filter by deadlines within the current/upcoming week.
   • "Show me all high priority announcements": Fetch announcements with priority="high".
6. FORMATTING:
   • Use clean markdown with bullet points, bold highlights, and clear tables where appropriate. Keep answers sharp, fast, and helpful.`;
}

/* ------------------------------------------------------------------ */
/*  Build the Gemini-compatible tool config from our declarations      */
/* ------------------------------------------------------------------ */
function buildToolsConfig(): any[] {
  return [
    {
      functionDeclarations: TOOL_DECLARATIONS.map((d) => ({
        name: d.name,
        description: d.description,
        parameters: d.parameters,
      })),
    },
  ] as any[];
}

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/*  Body: { messages: [{ role, content }], history?: Content[] }       */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY or GOOGLE_API_KEY not set. Add it to .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, history } = body as {
      messages: { role: string; content: string }[];
      history?: any[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No messages provided' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const FALLBACK_MODEL = 'gemini-3.5-flash';

    // Build the contents array from the conversation history
    const contents: any[] = [];

    // Add prior conversation history if provided
    if (history && history.length > 0) {
      contents.push(...history);
    }

    // Add the latest user message
    const latestMessage = messages[messages.length - 1];
    contents.push({
      role: 'user',
      parts: [{ text: latestMessage.content }],
    });

    // Tool calling loop — keep going until the model produces a text response
    const MAX_TOOL_ROUNDS = 10;
    const toolCalls: any[] = [];
    let finalText = '';
    const updatedHistory = [...contents];

    const generateWithFallback = async (chatContents: any[]) => {
      try {
        return await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: chatContents,
          config: {
            tools: buildToolsConfig(),
            systemInstruction: getSystemPrompt(),
          },
        });
      } catch (err: any) {
        console.warn(`[CampusOS AI] Primary model (${PRIMARY_MODEL}) failed: ${err.message}. Retrying with fallback (${FALLBACK_MODEL})...`);
        return await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: chatContents,
          config: {
            tools: buildToolsConfig(),
            systemInstruction: getSystemPrompt(),
          },
        });
      }
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await generateWithFallback(updatedHistory);

      // Check for function calls
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        // Record model's function call turn, preserving thought signatures and IDs
        if (response.candidates?.[0]?.content) {
          updatedHistory.push(response.candidates[0].content);
        } else {
          updatedHistory.push({
            role: 'model',
            parts: functionCalls.map((fc: any) => ({
              functionCall: {
                name: fc.name,
                args: fc.args,
                ...(fc.id ? { id: fc.id } : {}),
              },
            })),
          });
        }

        // Execute each function call and collect results
        const functionResponses: any[] = [];
        for (const fc of functionCalls) {
          try {
            const { result, didMutate } = await executeTool(fc.name!, fc.args || {});
            if (didMutate) {
              toolCalls.push({ name: fc.name, args: fc.args, mutated: true });
            }
            const functionRespPayload: any = {
              name: fc.name,
              response: { result },
            };
            if (fc.id) {
              functionRespPayload.id = fc.id;
            }
            functionResponses.push({
              functionResponse: functionRespPayload,
            });
          } catch (toolError: any) {
            const errorPayload: any = {
              name: fc.name,
              response: { error: toolError.message || 'Tool execution error' },
            };
            if (fc.id) {
              errorPayload.id = fc.id;
            }
            functionResponses.push({
              functionResponse: errorPayload,
            });
          }
        }

        // Send function results back to the model
        updatedHistory.push({
          role: 'user',
          parts: functionResponses,
        });

        // Continue the loop to let the model process the results
        continue;
      }

      // No function calls — model produced a text response
      finalText = response.text || '';
      if (!finalText && response.candidates?.[0]?.content?.parts) {
        finalText = response.candidates[0].content.parts
          .filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join('\n');
      }

      if (response.candidates?.[0]?.content) {
        updatedHistory.push(response.candidates[0].content);
      } else {
        updatedHistory.push({
          role: 'model',
          parts: [{ text: finalText }],
        });
      }
      break;
    }

    // Determine if any tool call mutated data (so the client knows to refresh the dashboard)
    const didMutate = toolCalls.some((tc) => tc.mutated);

    return NextResponse.json({
      success: true,
      response: finalText,
      didMutate,
      toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })),
      history: updatedHistory,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
