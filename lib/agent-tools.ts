import {
  getSchedules,
  getRooms,
  bookRoom,
  cancelBooking,
  getEvents,
  registerEvent,
  cancelEventRegistration,
  getAnnouncements,
  addAnnouncement,
  getAssignments,
  updateAssignmentStatus,
} from './db-helpers';

// Function Declarations for Gemini Function Calling
export const TOOL_DECLARATIONS = [
  {
    name: 'get_schedules',
    description:
      'Fetch class timetable/schedules. Filter by day of week (Sunday, Monday, Tuesday, Wednesday, Thursday), course code, room number, or instructor name. Returns classes with course code, title, day, start_time, end_time, room, instructor, section.',
    parameters: {
      type: 'OBJECT',
      properties: {
        day: {
          type: 'STRING',
          description: 'Day of week: "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"',
        },
        course: {
          type: 'STRING',
          description: 'Course code like "CSE 4113", "CSE 4137", "IPE 4111"',
        },
        room: {
          type: 'STRING',
          description: 'Room number like "7A03", "7B08", "7A07"',
        },
        instructor: {
          type: 'STRING',
          description: 'Instructor name or partial name',
        },
      },
    },
  },
  {
    name: 'get_rooms',
    description:
      'Fetch campus rooms, their capacities, equipment, and current bookings. Filter by room type ("classroom", "lab", "seminar"), min_capacity, equipment (e.g. "projector", "smart board", "computers", "AC"), or status ("available", "unavailable"). Always call this before booking to check room capabilities and existing bookings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
          description: 'Type of room: "classroom", "lab", or "seminar"',
        },
        min_capacity: {
          type: 'NUMBER',
          description: 'Minimum required capacity (e.g. 30, 40)',
        },
        equipment: {
          type: 'STRING',
          description: 'Required equipment substring: "projector", "smart board", "computers", "AC", "whiteboard", "microphone"',
        },
        status: {
          type: 'STRING',
          description: '"available" or "unavailable"',
        },
      },
    },
  },
  {
    name: 'book_room',
    description:
      'Book a campus room for a specified date and 24h time slot. Performs overlap detection and rejects conflicting bookings. Required: room_number, date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), booked_by, purpose.',
    parameters: {
      type: 'OBJECT',
      properties: {
        room_number: {
          type: 'STRING',
          description: 'The room code (e.g. "7A02", "7B05")',
        },
        date: {
          type: 'STRING',
          description: 'Date in YYYY-MM-DD format (e.g. "2026-09-05")',
        },
        start_time: {
          type: 'STRING',
          description: 'Start time in 24h format (e.g. "15:00")',
        },
        end_time: {
          type: 'STRING',
          description: 'End time in 24h format (e.g. "17:00")',
        },
        booked_by: {
          type: 'STRING',
          description: 'Name of person or club booking (default to "Sakibul Hassan" if unspecified student)',
        },
        purpose: {
          type: 'STRING',
          description: 'Reason for booking (e.g. "Study Session", "Hackathon Preparation")',
        },
      },
      required: ['room_number', 'date', 'start_time', 'end_time', 'booked_by', 'purpose'],
    },
  },
  {
    name: 'cancel_booking',
    description: 'Cancel a room booking using its booking_id (e.g. "bk-001").',
    parameters: {
      type: 'OBJECT',
      properties: {
        booking_id: {
          type: 'STRING',
          description: 'The unique booking ID to cancel',
        },
      },
      required: ['booking_id'],
    },
  },
  {
    name: 'get_events',
    description:
      'Fetch campus events (guest lectures, hackathons, workshops, club meetings). Filter by date (YYYY-MM-DD), status ("upcoming", "ongoing", "completed", "cancelled", "full"), or venue.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: {
          type: 'STRING',
          description: 'Event date (YYYY-MM-DD)',
        },
        status: {
          type: 'STRING',
          description: '"upcoming", "ongoing", "completed", "cancelled", "full"',
        },
        venue: {
          type: 'STRING',
          description: 'Venue room number like "7C01", "7C05"',
        },
      },
    },
  },
  {
    name: 'register_event',
    description:
      'Register a student for a campus event. Verifies that the event has remaining capacity before registering. Automatically marks status as "full" if capacity is reached.',
    parameters: {
      type: 'OBJECT',
      properties: {
        event_id_or_name: {
          type: 'STRING',
          description: 'Event ID (e.g. "evt-002") or event name/keywords (e.g. "Guest Lecture on Deep Learning", "AI Build Hackathon")',
        },
        student_id: {
          type: 'STRING',
          description: 'Student ID (default to "20-40532" if student)',
        },
        student_name: {
          type: 'STRING',
          description: 'Student full name (default to "Sakibul Hassan" if student)',
        },
      },
      required: ['event_id_or_name', 'student_id', 'student_name'],
    },
  },
  {
    name: 'cancel_event_registration',
    description:
      'Cancel a student registration for a campus event. Decrements registered count and updates status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        event_id_or_name: {
          type: 'STRING',
          description: 'Event ID or name',
        },
        student_id: {
          type: 'STRING',
          description: 'Student ID to cancel registration for',
        },
      },
      required: ['event_id_or_name', 'student_id'],
    },
  },
  {
    name: 'get_announcements',
    description:
      'Fetch official campus notices and announcements. Filter by priority ("high", "medium", "low") or active_only.',
    parameters: {
      type: 'OBJECT',
      properties: {
        priority: {
          type: 'STRING',
          description: 'Priority level: "high", "medium", or "low"',
        },
        active_only: {
          type: 'BOOLEAN',
          description: 'If true, only returns non-expired notices',
        },
      },
    },
  },
  {
    name: 'add_announcement',
    description: 'Post a new campus announcement or notice to the university bulletin board.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Announcement headline',
        },
        body: {
          type: 'STRING',
          description: 'Full text body of notice',
        },
        priority: {
          type: 'STRING',
          description: '"high", "medium", or "low"',
        },
        posted_by: {
          type: 'STRING',
          description: 'Author name or department',
        },
        expires: {
          type: 'STRING',
          description: 'Expiry date in YYYY-MM-DD format',
        },
      },
      required: ['title', 'body', 'priority', 'posted_by', 'expires'],
    },
  },
  {
    name: 'get_assignments',
    description:
      'Fetch course assignments, deadlines, and submission status. Filter by status ("pending", "submitted", "graded", "late"), course code, or due_before date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: '"pending", "submitted", "graded", "late"',
        },
        course: {
          type: 'STRING',
          description: 'Course code like "CSE 4113"',
        },
        due_before: {
          type: 'STRING',
          description: 'Deadline date in YYYY-MM-DD format',
        },
      },
    },
  },
  {
    name: 'update_assignment_status',
    description: 'Update the submission status of an assignment (e.g. mark as "submitted").',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: {
          type: 'STRING',
          description: 'Assignment ID (e.g. "asgn-001")',
        },
        status: {
          type: 'STRING',
          description: 'New status: "pending", "submitted", "graded", "late"',
        },
      },
      required: ['id', 'status'],
    },
  },
];

// Helper wrapper around lib/db
export async function executeTool(name: string, args: any): Promise<{ result: any; didMutate: boolean }> {
  switch (name) {
    case 'get_schedules': {
      const data = getSchedules(args);
      return { result: data, didMutate: false };
    }
    case 'get_rooms': {
      const data = getRooms(args);
      return { result: data, didMutate: false };
    }
    case 'book_room': {
      const data = bookRoom({
        roomIdOrNumber: args.room_number,
        booked_by: args.booked_by || 'Sakibul Hassan',
        date: args.date,
        start_time: args.start_time,
        end_time: args.end_time,
        purpose: args.purpose || 'Campus Room Booking',
      });
      return { result: data, didMutate: data.success };
    }
    case 'cancel_booking': {
      const data = cancelBooking(args.booking_id);
      return { result: data, didMutate: data.success };
    }
    case 'get_events': {
      const data = getEvents(args);
      return { result: data, didMutate: false };
    }
    case 'register_event': {
      const data = registerEvent({
        eventIdOrName: args.event_id_or_name,
        student_id: args.student_id || '20-40532',
        name: args.student_name || 'Sakibul Hassan',
      });
      return { result: data, didMutate: data.success };
    }
    case 'cancel_event_registration': {
      const data = cancelEventRegistration({
        eventIdOrName: args.event_id_or_name,
        student_id: args.student_id,
      });
      return { result: data, didMutate: data.success };
    }
    case 'get_announcements': {
      const data = getAnnouncements(args);
      return { result: data, didMutate: false };
    }
    case 'add_announcement': {
      const data = addAnnouncement(args);
      return { result: data, didMutate: true };
    }
    case 'get_assignments': {
      const data = getAssignments(args);
      return { result: data, didMutate: false };
    }
    case 'update_assignment_status': {
      const data = updateAssignmentStatus(args.id, args.status);
      return { result: data, didMutate: !!data };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
