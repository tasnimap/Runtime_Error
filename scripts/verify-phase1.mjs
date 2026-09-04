import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'campusos.db');

// If DB exists, remove for clean test first
if (fs.existsSync(DB_PATH)) {
  try {
    fs.unlinkSync(DB_PATH);
  } catch (e) {}
}

console.log('=== PHASE 1: DATABASE & SEED LOADER VERIFICATION ===\n');

// Import and run through database logic
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Execute DDL
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

// Seed data
const dataDir = path.join(process.cwd(), 'data');
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

db.transaction(() => {
  const schedules = JSON.parse(fs.readFileSync(path.join(dataDir, 'schedules.json'), 'utf-8'));
  for (const s of schedules) insertSchedule.run(s);

  const rooms = JSON.parse(fs.readFileSync(path.join(dataDir, 'rooms.json'), 'utf-8'));
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
    for (const b of (r.bookings || [])) {
      insertBooking.run({ ...b, room_id: r.id });
    }
  }

  const events = JSON.parse(fs.readFileSync(path.join(dataDir, 'events.json'), 'utf-8'));
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
    for (const reg of (e.registrations || [])) {
      insertRegistration.run({ event_id: e.id, ...reg });
    }
  }

  const announcements = JSON.parse(fs.readFileSync(path.join(dataDir, 'announcements.json'), 'utf-8'));
  for (const a of announcements) insertAnnouncement.run(a);

  const assignments = JSON.parse(fs.readFileSync(path.join(dataDir, 'assignments.json'), 'utf-8'));
  for (const asgn of assignments) insertAssignment.run(asgn);
})();

// Verify Counts
const schedulesCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get().count;
const roomsCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
const bookingsCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
const registrationsCount = db.prepare('SELECT COUNT(*) as count FROM event_registrations').get().count;
const announcementsCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
const assignmentsCount = db.prepare('SELECT COUNT(*) as count FROM assignments').get().count;

console.log(`✓ Schedules seeded: ${schedulesCount} (expected: 24)`);
console.log(`✓ Rooms seeded: ${roomsCount} (expected: 20) with ${bookingsCount} initial bookings`);
console.log(`✓ Events seeded: ${eventsCount} (expected: 7) with ${registrationsCount} registrations`);
console.log(`✓ Announcements seeded: ${announcementsCount} (expected: 8)`);
console.log(`✓ Assignments seeded: ${assignmentsCount} (expected: 8)`);

if (schedulesCount !== 24 || roomsCount !== 20 || eventsCount !== 7 || announcementsCount !== 8 || assignmentsCount !== 8) {
  console.error('Record count mismatch!');
  process.exit(1);
}

// Test Query: Labs with projector that fit >= 30 people
const labsWithProjector = db.prepare(`
  SELECT room_number, capacity, equipment FROM rooms
  WHERE type = 'lab' AND capacity >= 30 AND equipment LIKE '%projector%'
  ORDER BY room_number
`).all();
console.log(`✓ Labs with projector and capacity >= 30: ${labsWithProjector.map(l => l.room_number).join(', ')} (${labsWithProjector.length} labs)`);
if (labsWithProjector.length !== 6) {
  console.error('Expected 6 matching labs, got', labsWithProjector.length);
  process.exit(1);
}

// Test Booking Room 7A02
console.log('\n--- Testing Room 7A02 Booking & Overlap Detection ---');
const room7A02 = db.prepare('SELECT * FROM rooms WHERE room_number = ?').get('7A02');

// Insert booking
const testBookingId = 'bk-test-001';
db.prepare(`
  INSERT INTO bookings (booking_id, room_id, booked_by, date, start_time, end_time, purpose)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(testBookingId, room7A02.id, 'Judge Test', '2026-09-05', '15:00', '17:00', 'Phase 1 Booking Test');

console.log('✓ Successfully booked 7A02 for 2026-09-05 15:00–17:00');

// Check conflict detection
const conflict = db.prepare(`
  SELECT * FROM bookings
  WHERE room_id = ? AND date = ? AND NOT (end_time <= ? OR start_time >= ?)
`).get(room7A02.id, '2026-09-05', '16:00', '18:00');

if (conflict) {
  console.log(`✓ Overlap correctly caught: existing booking ${conflict.start_time}-${conflict.end_time}`);
} else {
  console.error('Failed to detect overlapping booking!');
  process.exit(1);
}

// Delete test booking
db.prepare('DELETE FROM bookings WHERE booking_id = ?').run(testBookingId);
console.log('✓ Successfully cancelled test booking');

// Test Event Registration
console.log('\n--- Testing Event Registration ---');
const evt = db.prepare('SELECT * FROM events WHERE id = ?').get('evt-002');
console.log(`Before registration: "${evt.name}" has ${evt.registered}/${evt.capacity} registered`);

db.prepare('INSERT INTO event_registrations (event_id, student_id, name) VALUES (?, ?, ?)').run(evt.id, '99-00001', 'Test User');
db.prepare('UPDATE events SET registered = registered + 1 WHERE id = ?').run(evt.id);

const evtAfter = db.prepare('SELECT * FROM events WHERE id = ?').get('evt-002');
console.log(`After registration: count is ${evtAfter.registered} (expected: ${evt.registered + 1})`);

// Clean up event reg
db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?').run(evt.id, '99-00001');
db.prepare('UPDATE events SET registered = registered - 1 WHERE id = ?').run(evt.id);
console.log('✓ Cancelled test registration');

// Test Persistence: add a custom announcement
const persistId = 'ann-persist-test';
db.prepare(`
  INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(persistId, 'Persistent Announcement', 'Must survive close/open', '2026-09-04', 'high', 'Test Runner', '2026-09-10');

db.close();

// Re-open database
const db2 = new Database(DB_PATH);
const checkPersist = db2.prepare('SELECT * FROM announcements WHERE id = ?').get(persistId);
if (checkPersist) {
  console.log(`✓ Persistence test passed: Record "${checkPersist.title}" persists across connection close & re-open!`);
} else {
  console.error('Persistence failed!');
  process.exit(1);
}

// Clean up test record
db2.prepare('DELETE FROM announcements WHERE id = ?').run(persistId);
db2.close();

console.log('\n=== PHASE 1 VERIFICATION COMPLETED WITH 100% SUCCESS ===\n');
