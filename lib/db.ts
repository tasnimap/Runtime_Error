import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Schedule, Room, Booking, CampusEvent, Registration, Announcement, Assignment } from './types';

const DB_PATH = path.join(process.cwd(), 'campusos.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: Database.Database) {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      course TEXT NOT NULL,
      title TEXT NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      instructor TEXT NOT NULL,
      section TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      room_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      equipment TEXT NOT NULL,
      floor INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      booking_id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      booked_by TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      purpose TEXT NOT NULL,
      FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      end_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      organizer TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      registered INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(event_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL,
      priority TEXT NOT NULL,
      posted_by TEXT NOT NULL,
      expires TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      course TEXT NOT NULL,
      course_title TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      assigned_date TEXT NOT NULL,
      deadline TEXT NOT NULL,
      submission_platform TEXT NOT NULL,
      status TEXT NOT NULL,
      marks INTEGER NOT NULL
    );
  `);

  // Check if seed data is needed (only on empty database)
  const scheduleCount = (db.prepare('SELECT COUNT(*) as count FROM schedules').get() as { count: number }).count;
  if (scheduleCount === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: Database.Database) {
  const dataDir = path.join(process.cwd(), 'data');
  console.log('[CampusOS DB] Seeding database from JSON files...');

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
    VALUES (@id, @course, @title, @day, @start_time, @end_time, @room, @instructor, @section)
  `);

  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
    VALUES (@id, @room_number, @type, @capacity, @equipment, @floor, @status)
  `);

  const insertBooking = db.prepare(`
    INSERT INTO bookings (booking_id, room_id, booked_by, date, start_time, end_time, purpose)
    VALUES (@booking_id, @room_id, @booked_by, @date, @start_time, @end_time, @purpose)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
    VALUES (@id, @name, @description, @date, @start_time, @end_time, @end_date, @venue, @organizer, @capacity, @registered, @status)
  `);

  const insertRegistration = db.prepare(`
    INSERT INTO event_registrations (event_id, student_id, name)
    VALUES (@event_id, @student_id, @name)
  `);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
    VALUES (@id, @title, @body, @date, @priority, @posted_by, @expires)
  `);

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
    VALUES (@id, @course, @course_title, @title, @description, @assigned_date, @deadline, @submission_platform, @status, @marks)
  `);

  const seedTransaction = db.transaction(() => {
    // 1. Schedules
    const schedulesPath = path.join(dataDir, 'schedules.json');
    if (fs.existsSync(schedulesPath)) {
      const schedules = JSON.parse(fs.readFileSync(schedulesPath, 'utf-8'));
      for (const s of schedules) {
        insertSchedule.run(s);
      }
    }

    // 2. Rooms & Bookings
    const roomsPath = path.join(dataDir, 'rooms.json');
    if (fs.existsSync(roomsPath)) {
      const rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf-8'));
      for (const r of rooms) {
        insertRoom.run({
          id: r.id,
          room_number: r.room_number,
          type: r.type,
          capacity: r.capacity,
          equipment: JSON.stringify(r.equipment || []),
          floor: r.floor,
          status: r.status,
        });

        if (Array.isArray(r.bookings)) {
          for (const b of r.bookings) {
            insertBooking.run({
              booking_id: b.booking_id,
              room_id: r.id,
              booked_by: b.booked_by,
              date: b.date,
              start_time: b.start_time,
              end_time: b.end_time,
              purpose: b.purpose,
            });
          }
        }
      }
    }

    // 3. Events & Registrations
    const eventsPath = path.join(dataDir, 'events.json');
    if (fs.existsSync(eventsPath)) {
      const events = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
      for (const e of events) {
        insertEvent.run({
          id: e.id,
          name: e.name,
          description: e.description,
          date: e.date,
          start_time: e.start_time,
          end_time: e.end_time,
          end_date: e.end_date,
          venue: e.venue,
          organizer: e.organizer,
          capacity: e.capacity,
          registered: e.registered,
          status: e.status,
        });

        if (Array.isArray(e.registrations)) {
          for (const reg of e.registrations) {
            insertRegistration.run({
              event_id: e.id,
              student_id: reg.student_id,
              name: reg.name,
            });
          }
        }
      }
    }

    // 4. Announcements
    const annPath = path.join(dataDir, 'announcements.json');
    if (fs.existsSync(annPath)) {
      const announcements = JSON.parse(fs.readFileSync(annPath, 'utf-8'));
      for (const a of announcements) {
        insertAnnouncement.run(a);
      }
    }

    // 5. Assignments
    const asgnPath = path.join(dataDir, 'assignments.json');
    if (fs.existsSync(asgnPath)) {
      const assignments = JSON.parse(fs.readFileSync(asgnPath, 'utf-8'));
      for (const asgn of assignments) {
        insertAssignment.run(asgn);
      }
    }
  });

  seedTransaction();
  console.log('[CampusOS DB] Seeding completed successfully.');
}

// ----------------------------------------------------
// Schedules
// ----------------------------------------------------
export function getSchedules(filter?: { day?: string; course?: string; room?: string; instructor?: string }): Schedule[] {
  const db = getDb();
  let query = 'SELECT * FROM schedules WHERE 1=1';
  const params: unknown[] = [];

  if (filter?.day) {
    query += ' AND LOWER(day) = LOWER(?)';
    params.push(filter.day);
  }
  if (filter?.course) {
    query += ' AND LOWER(course) LIKE LOWER(?)';
    params.push(`%${filter.course}%`);
  }
  if (filter?.room) {
    query += ' AND LOWER(room) = LOWER(?)';
    params.push(filter.room);
  }
  if (filter?.instructor) {
    query += ' AND LOWER(instructor) LIKE LOWER(?)';
    params.push(`%${filter.instructor}%`);
  }
  query += " ORDER BY CASE day WHEN 'Sunday' THEN 1 WHEN 'Monday' THEN 2 WHEN 'Tuesday' THEN 3 WHEN 'Wednesday' THEN 4 WHEN 'Thursday' THEN 5 ELSE 6 END, start_time ASC";

  return db.prepare(query).all(...params) as Schedule[];
}

export function getScheduleById(id: string): Schedule | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as Schedule) || null;
}

export function createSchedule(data: Schedule): Schedule {
  const db = getDb();
  db.prepare(`
    INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
    VALUES (@id, @course, @title, @day, @start_time, @end_time, @room, @instructor, @section)
  `).run(data);
  return getScheduleById(data.id)!;
}

export function updateSchedule(id: string, updates: Partial<Schedule>): Schedule | null {
  const db = getDb();
  const existing = getScheduleById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, id };
  db.prepare(`
    UPDATE schedules SET
      course = @course,
      title = @title,
      day = @day,
      start_time = @start_time,
      end_time = @end_time,
      room = @room,
      instructor = @instructor,
      section = @section
    WHERE id = @id
  `).run(merged);

  return getScheduleById(id);
}

export function deleteSchedule(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  return info.changes > 0;
}

// ----------------------------------------------------
// Rooms & Bookings
// ----------------------------------------------------
interface RawRoom {
  id: string;
  room_number: string;
  type: 'classroom' | 'lab' | 'seminar';
  capacity: number;
  equipment: string;
  floor: number;
  status: 'available' | 'unavailable';
}

function formatRoom(raw: RawRoom, bookings: Booking[]): Room {
  return {
    id: raw.id,
    room_number: raw.room_number,
    type: raw.type,
    capacity: raw.capacity,
    equipment: raw.equipment ? JSON.parse(raw.equipment) : [],
    floor: raw.floor,
    status: raw.status,
    bookings,
  };
}

export function getRooms(filter?: { type?: string; min_capacity?: number; equipment?: string; status?: string }): Room[] {
  const db = getDb();
  let query = 'SELECT * FROM rooms WHERE 1=1';
  const params: unknown[] = [];

  if (filter?.type) {
    query += ' AND LOWER(type) = LOWER(?)';
    params.push(filter.type);
  }
  if (filter?.min_capacity !== undefined) {
    query += ' AND capacity >= ?';
    params.push(filter.min_capacity);
  }
  if (filter?.status) {
    query += ' AND LOWER(status) = LOWER(?)';
    params.push(filter.status);
  }
  query += ' ORDER BY room_number ASC';

  const rawRooms = db.prepare(query).all(...params) as RawRoom[];
  const allBookings = db.prepare('SELECT * FROM bookings ORDER BY date, start_time').all() as (Booking & { room_id: string })[];

  const bookingsByRoom = new Map<string, Booking[]>();
  for (const b of allBookings) {
    if (!bookingsByRoom.has(b.room_id)) {
      bookingsByRoom.set(b.room_id, []);
    }
    bookingsByRoom.get(b.room_id)!.push({
      booking_id: b.booking_id,
      booked_by: b.booked_by,
      date: b.date,
      start_time: b.start_time,
      end_time: b.end_time,
      purpose: b.purpose,
    });
  }

  let results = rawRooms.map(r => formatRoom(r, bookingsByRoom.get(r.id) || []));

  if (filter?.equipment) {
    const eqLower = filter.equipment.toLowerCase();
    results = results.filter(r => r.equipment.some(e => e.toLowerCase().includes(eqLower)));
  }

  return results;
}

export function getRoomById(id: string): Room | null {
  const db = getDb();
  const raw = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as RawRoom | undefined;
  if (!raw) return null;

  const bookings = db.prepare('SELECT * FROM bookings WHERE room_id = ? ORDER BY date, start_time').all(id) as Booking[];
  return formatRoom(raw, bookings);
}

export function getRoomByNumber(roomNumber: string): Room | null {
  const db = getDb();
  const raw = db.prepare('SELECT * FROM rooms WHERE LOWER(room_number) = LOWER(?)').get(roomNumber) as RawRoom | undefined;
  if (!raw) return null;

  const bookings = db.prepare('SELECT * FROM bookings WHERE room_id = ? ORDER BY date, start_time').all(raw.id) as Booking[];
  return formatRoom(raw, bookings);
}

export function createRoom(data: Omit<Room, 'bookings'>): Room {
  const db = getDb();
  db.prepare(`
    INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
    VALUES (@id, @room_number, @type, @capacity, @equipment, @floor, @status)
  `).run({
    ...data,
    equipment: JSON.stringify(data.equipment || []),
  });
  return getRoomById(data.id)!;
}

export function updateRoom(id: string, updates: Partial<Room>): Room | null {
  const db = getDb();
  const existing = getRoomById(id);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...updates,
    id,
    equipment: updates.equipment !== undefined ? JSON.stringify(updates.equipment) : JSON.stringify(existing.equipment),
  };

  db.prepare(`
    UPDATE rooms SET
      room_number = @room_number,
      type = @type,
      capacity = @capacity,
      equipment = @equipment,
      floor = @floor,
      status = @status
    WHERE id = @id
  `).run(merged);

  return getRoomById(id);
}

export function deleteRoom(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  return info.changes > 0;
}

export function bookRoom(params: {
  roomIdOrNumber: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}): { success: boolean; booking?: Booking; error?: string } {
  const db = getDb();
  const room = getRoomById(params.roomIdOrNumber) || getRoomByNumber(params.roomIdOrNumber);
  if (!room) {
    return { success: false, error: `Room "${params.roomIdOrNumber}" not found.` };
  }

  // Check overlapping bookings
  // Two intervals [s1, e1) and [s2, e2) overlap if NOT (e1 <= s2 OR s1 >= e2)
  const conflicts = db.prepare(`
    SELECT * FROM bookings
    WHERE room_id = ? AND date = ?
    AND NOT (end_time <= ? OR start_time >= ?)
  `).all(room.id, params.date, params.start_time, params.end_time) as Booking[];

  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    return {
      success: false,
      error: `Conflict: Room ${room.room_number} is already booked on ${params.date} from ${conflict.start_time} to ${conflict.end_time} by ${conflict.booked_by} ("${conflict.purpose}").`,
    };
  }

  const booking_id = `bk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const booking: Booking = {
    booking_id,
    booked_by: params.booked_by,
    date: params.date,
    start_time: params.start_time,
    end_time: params.end_time,
    purpose: params.purpose,
  };

  db.prepare(`
    INSERT INTO bookings (booking_id, room_id, booked_by, date, start_time, end_time, purpose)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(booking_id, room.id, booking.booked_by, booking.date, booking.start_time, booking.end_time, booking.purpose);

  return { success: true, booking };
}

export function cancelBooking(bookingId: string): { success: boolean; error?: string } {
  const db = getDb();
  const info = db.prepare('DELETE FROM bookings WHERE booking_id = ?').run(bookingId);
  if (info.changes > 0) {
    return { success: true };
  }
  return { success: false, error: `Booking "${bookingId}" not found.` };
}

// ----------------------------------------------------
// Events & Registrations
// ----------------------------------------------------
export function getEvents(filter?: { date?: string; status?: string; venue?: string }): CampusEvent[] {
  const db = getDb();
  let query = 'SELECT * FROM events WHERE 1=1';
  const params: unknown[] = [];

  if (filter?.date) {
    query += ' AND date = ?';
    params.push(filter.date);
  }
  if (filter?.status) {
    query += ' AND LOWER(status) = LOWER(?)';
    params.push(filter.status);
  }
  if (filter?.venue) {
    query += ' AND LOWER(venue) = LOWER(?)';
    params.push(filter.venue);
  }
  query += ' ORDER BY date ASC, start_time ASC';

  const events = db.prepare(query).all(...params) as CampusEvent[];
  const allRegistrations = db.prepare('SELECT event_id, student_id, name FROM event_registrations').all() as (Registration & { event_id: string })[];

  const regsByEvent = new Map<string, Registration[]>();
  for (const r of allRegistrations) {
    if (!regsByEvent.has(r.event_id)) {
      regsByEvent.set(r.event_id, []);
    }
    regsByEvent.get(r.event_id)!.push({ student_id: r.student_id, name: r.name });
  }

  return events.map(e => ({
    ...e,
    registrations: regsByEvent.get(e.id) || [],
  }));
}

export function getEventById(id: string): CampusEvent | null {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as CampusEvent | undefined;
  if (!event) return null;

  const registrations = db.prepare('SELECT student_id, name FROM event_registrations WHERE event_id = ?').all(id) as Registration[];
  return { ...event, registrations };
}

export function getEventByName(nameQuery: string): CampusEvent | null {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE LOWER(name) LIKE LOWER(?) LIMIT 1').get(`%${nameQuery}%`) as CampusEvent | undefined;
  if (!event) return null;

  const registrations = db.prepare('SELECT student_id, name FROM event_registrations WHERE event_id = ?').all(event.id) as Registration[];
  return { ...event, registrations };
}

export function createEvent(data: Omit<CampusEvent, 'registrations'>): CampusEvent {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
    VALUES (@id, @name, @description, @date, @start_time, @end_time, @end_date, @venue, @organizer, @capacity, @registered, @status)
  `).run(data);
  return getEventById(data.id)!;
}

export function updateEvent(id: string, updates: Partial<CampusEvent>): CampusEvent | null {
  const db = getDb();
  const existing = getEventById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, id };
  db.prepare(`
    UPDATE events SET
      name = @name,
      description = @description,
      date = @date,
      start_time = @start_time,
      end_time = @end_time,
      end_date = @end_date,
      venue = @venue,
      organizer = @organizer,
      capacity = @capacity,
      registered = @registered,
      status = @status
    WHERE id = @id
  `).run(merged);

  return getEventById(id);
}

export function deleteEvent(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return info.changes > 0;
}

export function registerEvent(params: {
  eventIdOrName: string;
  student_id: string;
  name: string;
}): { success: boolean; event?: CampusEvent; error?: string } {
  const db = getDb();
  const event = getEventById(params.eventIdOrName) || getEventByName(params.eventIdOrName);
  if (!event) {
    return { success: false, error: `Event "${params.eventIdOrName}" not found.` };
  }

  // Check if already registered
  const existingReg = db.prepare('SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?').get(event.id, params.student_id);
  if (existingReg) {
    return { success: false, error: `Student ${params.student_id} is already registered for this event.` };
  }

  // Check capacity
  if (event.registered >= event.capacity || event.status === 'full') {
    return { success: false, error: `Event "${event.name}" is already at full capacity (${event.registered}/${event.capacity}).` };
  }

  const registerTx = db.transaction(() => {
    db.prepare('INSERT INTO event_registrations (event_id, student_id, name) VALUES (?, ?, ?)').run(event.id, params.student_id, params.name);
    const newCount = event.registered + 1;
    const newStatus = newCount >= event.capacity ? 'full' : event.status;
    db.prepare('UPDATE events SET registered = ?, status = ? WHERE id = ?').run(newCount, newStatus, event.id);
  });

  registerTx();
  return { success: true, event: getEventById(event.id)! };
}

export function cancelEventRegistration(params: {
  eventIdOrName: string;
  student_id: string;
}): { success: boolean; event?: CampusEvent; error?: string } {
  const db = getDb();
  const event = getEventById(params.eventIdOrName) || getEventByName(params.eventIdOrName);
  if (!event) {
    return { success: false, error: `Event "${params.eventIdOrName}" not found.` };
  }

  const existingReg = db.prepare('SELECT * FROM event_registrations WHERE event_id = ? AND student_id = ?').get(event.id, params.student_id);
  if (!existingReg) {
    return { success: false, error: `Registration not found for student ${params.student_id} in event "${event.name}".` };
  }

  const cancelTx = db.transaction(() => {
    db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?').run(event.id, params.student_id);
    const newCount = Math.max(0, event.registered - 1);
    const newStatus = event.status === 'full' && newCount < event.capacity ? 'upcoming' : event.status;
    db.prepare('UPDATE events SET registered = ?, status = ? WHERE id = ?').run(newCount, newStatus, event.id);
  });

  cancelTx();
  return { success: true, event: getEventById(event.id)! };
}

// ----------------------------------------------------
// Announcements
// ----------------------------------------------------
export function getAnnouncements(filter?: { priority?: string; active_only?: boolean; current_date?: string }): Announcement[] {
  const db = getDb();
  let query = 'SELECT * FROM announcements WHERE 1=1';
  const params: unknown[] = [];

  if (filter?.priority) {
    query += ' AND LOWER(priority) = LOWER(?)';
    params.push(filter.priority);
  }
  if (filter?.active_only && filter?.current_date) {
    query += ' AND expires >= ?';
    params.push(filter.current_date);
  }
  query += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, date DESC";

  return db.prepare(query).all(...params) as Announcement[];
}

export function getAnnouncementById(id: string): Announcement | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM announcements WHERE id = ?').get(id) as Announcement) || null;
}

export function createAnnouncement(data: Announcement): Announcement {
  const db = getDb();
  db.prepare(`
    INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
    VALUES (@id, @title, @body, @date, @priority, @posted_by, @expires)
  `).run(data);
  return getAnnouncementById(data.id)!;
}

export function updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
  const db = getDb();
  const existing = getAnnouncementById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, id };
  db.prepare(`
    UPDATE announcements SET
      title = @title,
      body = @body,
      date = @date,
      priority = @priority,
      posted_by = @posted_by,
      expires = @expires
    WHERE id = @id
  `).run(merged);

  return getAnnouncementById(id);
}

export function deleteAnnouncement(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
  return info.changes > 0;
}

// ----------------------------------------------------
// Assignments
// ----------------------------------------------------
export function getAssignments(filter?: { status?: string; course?: string; due_before?: string }): Assignment[] {
  const db = getDb();
  let query = 'SELECT * FROM assignments WHERE 1=1';
  const params: unknown[] = [];

  if (filter?.status) {
    query += ' AND LOWER(status) = LOWER(?)';
    params.push(filter.status);
  }
  if (filter?.course) {
    query += ' AND LOWER(course) LIKE LOWER(?)';
    params.push(`%${filter.course}%`);
  }
  if (filter?.due_before) {
    query += ' AND deadline <= ?';
    params.push(filter.due_before);
  }
  query += ' ORDER BY deadline ASC';

  return db.prepare(query).all(...params) as Assignment[];
}

export function getAssignmentById(id: string): Assignment | null {
  const db = getDb();
  return (db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment) || null;
}

export function createAssignment(data: Assignment): Assignment {
  const db = getDb();
  db.prepare(`
    INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
    VALUES (@id, @course, @course_title, @title, @description, @assigned_date, @deadline, @submission_platform, @status, @marks)
  `).run(data);
  return getAssignmentById(data.id)!;
}

export function updateAssignment(id: string, updates: Partial<Assignment>): Assignment | null {
  const db = getDb();
  const existing = getAssignmentById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, id };
  db.prepare(`
    UPDATE assignments SET
      course = @course,
      course_title = @course_title,
      title = @title,
      description = @description,
      assigned_date = @assigned_date,
      deadline = @deadline,
      submission_platform = @submission_platform,
      status = @status,
      marks = @marks
    WHERE id = @id
  `).run(merged);

  return getAssignmentById(id);
}

export function deleteAssignment(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  return info.changes > 0;
}
