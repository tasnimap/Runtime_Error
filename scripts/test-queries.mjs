import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'campusos.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('====================================================');
console.log('      CampusOS — Sample Queries Evaluation Suite     ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. "When is my next class?"
console.log('--- 1. Simple Lookup: "When is my next class?" ---');
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayName = daysOfWeek[new Date().getDay()];
const nowTime = new Date().toTimeString().slice(0, 5); // "HH:MM"

let nextClass = db.prepare(`
  SELECT * FROM schedules 
  WHERE day = ? AND start_time >= ? 
  ORDER BY start_time ASC LIMIT 1
`).get(todayName, nowTime);

if (!nextClass) {
  // Check upcoming days
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const todayIdx = dayOrder.indexOf(todayName);
  for (let i = 1; i <= 5; i++) {
    const nextDay = dayOrder[(todayIdx + i) % dayOrder.length];
    nextClass = db.prepare(`SELECT * FROM schedules WHERE day = ? ORDER BY start_time ASC LIMIT 1`).get(nextDay);
    if (nextClass) break;
  }
}
assert(nextClass !== undefined, `Found next class: ${nextClass?.course} (${nextClass?.title}) on ${nextClass?.day} at ${nextClass?.start_time}`);

// 2. "What classes do I have on Wednesday?"
console.log('\n--- 2. Simple Lookup: "What classes do I have on Wednesday?" ---');
const wedClasses = db.prepare(`
  SELECT course, title, start_time, end_time, room, instructor 
  FROM schedules WHERE day = 'Wednesday' 
  ORDER BY start_time ASC
`).all();
assert(wedClasses.length > 0, `Retrieved ${wedClasses.length} classes for Wednesday: ${wedClasses.map(c => c.course).join(', ')}`);

// 3. "What assignments do I have due this week?"
console.log('\n--- 3. Simple Lookup: "What assignments do I have due this week?" ---');
const dueAssignments = db.prepare(`
  SELECT id, course, title, deadline, status 
  FROM assignments 
  WHERE deadline BETWEEN '2026-09-04' AND '2026-09-11'
  ORDER BY deadline ASC
`).all();
assert(dueAssignments.length > 0, `Retrieved ${dueAssignments.length} assignments due between 2026-09-04 and 2026-09-11: ${dueAssignments.map(a => a.course).join(', ')}`);

// 4. "Show me all high priority announcements."
console.log('\n--- 4. Simple Lookup: "Show me all high priority announcements." ---');
const highPriorityAnnouncements = db.prepare(`
  SELECT title, date, priority, posted_by 
  FROM announcements 
  WHERE priority = 'high'
  ORDER BY date DESC
`).all();
assert(highPriorityAnnouncements.length > 0, `Retrieved ${highPriorityAnnouncements.length} high-priority announcements: "${highPriorityAnnouncements[0]?.title}"`);

// 5. "I'm free until 2 PM — is there anything on campus I could drop into?"
console.log('\n--- 5. Multi-Source Reasoning: Free time activities before 14:00 ---');
const eventsBefore2PM = db.prepare(`
  SELECT name, date, start_time, end_time, venue, status 
  FROM events 
  WHERE start_time < '14:00' AND status != 'cancelled'
`).all();
assert(eventsBefore2PM.length > 0, `Found ${eventsBefore2PM.length} events starting before 2:00 PM: ${eventsBefore2PM.map(e => `${e.name} (${e.start_time})`).join('; ')}`);

// 6. "Which labs have a projector and can fit at least 30 people?"
console.log('\n--- 6. Multi-Source Reasoning: Labs with projector >= 30 capacity ---');
const matchingLabs = db.prepare(`
  SELECT room_number, capacity, equipment 
  FROM rooms 
  WHERE type = 'lab' AND capacity >= 30 AND equipment LIKE '%projector%'
  ORDER BY room_number ASC
`).all();
assert(matchingLabs.length === 6, `Found exactly 6 matching labs: ${matchingLabs.map(l => `${l.room_number} (cap ${l.capacity})`).join(', ')}`);

// 7. "Book Room 7A02 tomorrow from 3 PM to 5 PM."
console.log('\n--- 7. Action: Book Room 7A02 (15:00 - 17:00) with Overlap Check ---');
const room7A02 = db.prepare('SELECT id, room_number FROM rooms WHERE room_number = ?').get('7A02');
const targetDate = '2026-09-05';
const startTime = '15:00';
const endTime = '17:00';

// Check conflict before booking
const existingConflict = db.prepare(`
  SELECT * FROM bookings 
  WHERE room_id = ? AND date = ? AND NOT (end_time <= ? OR start_time >= ?)
`).get(room7A02.id, targetDate, startTime, endTime);

assert(!existingConflict, 'Room 7A02 is free during 15:00-17:00 on 2026-09-05');

const testBookingId = `bk-judge-${Date.now()}`;
db.prepare(`
  INSERT INTO bookings (booking_id, room_id, booked_by, date, start_time, end_time, purpose)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(testBookingId, room7A02.id, 'Judge Evaluator', targetDate, startTime, endTime, 'Hackathon Evaluation Test');

// Verify booking exists
const verifiedBooking = db.prepare('SELECT * FROM bookings WHERE booking_id = ?').get(testBookingId);
assert(verifiedBooking !== undefined, `Successfully created booking ${testBookingId}`);

// Verify conflict detection prevents double booking
const overlapAttempt = db.prepare(`
  SELECT * FROM bookings 
  WHERE room_id = ? AND date = ? AND NOT (end_time <= ? OR start_time >= ?)
`).get(room7A02.id, targetDate, '16:00', '18:00');
assert(overlapAttempt !== undefined, 'Overlap correctly detected for 16:00-18:00 conflicting slot');

// Cleanup
db.prepare('DELETE FROM bookings WHERE booking_id = ?').run(testBookingId);
assert(db.prepare('SELECT * FROM bookings WHERE booking_id = ?').get(testBookingId) === undefined, 'Successfully cleaned up test booking');

// 8. "Register me for the Guest Lecture on Deep Learning."
console.log('\n--- 8. Action: Register for Guest Lecture on Deep Learning ---');
const targetEvent = db.prepare(`
  SELECT id, name, capacity, registered 
  FROM events 
  WHERE name LIKE '%Guest Lecture%Deep Learning%'
`).get();
assert(targetEvent !== undefined, `Found event: ${targetEvent?.name} (${targetEvent?.registered}/${targetEvent?.capacity} seats)`);

const testStudentId = '99-88776';
const testStudentName = 'Evaluation Student';
db.prepare(`
  INSERT INTO event_registrations (event_id, student_id, name)
  VALUES (?, ?, ?)
`).run(targetEvent.id, testStudentId, testStudentName);
db.prepare('UPDATE events SET registered = registered + 1 WHERE id = ?').run(targetEvent.id);

const registeredEvent = db.prepare('SELECT registered FROM events WHERE id = ?').get(targetEvent.id);
assert(registeredEvent.registered === targetEvent.registered + 1, `Registration incremented count to ${registeredEvent.registered}`);

// Cleanup
db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?').run(targetEvent.id, testStudentId);
db.prepare('UPDATE events SET registered = registered - 1 WHERE id = ?').run(targetEvent.id);
assert(db.prepare('SELECT registered FROM events WHERE id = ?').get(targetEvent.id).registered === targetEvent.registered, 'Cleaned up registration');

// 9. "I need a room for 5 people with a projector, tomorrow between 2 and 4."
console.log('\n--- 9. Action: Filter rooms for 5 people with projector between 14:00 and 16:00 ---');
const filterDate = '2026-09-05';
const filterStart = '14:00';
const filterEnd = '16:00';

const candidateRooms = db.prepare(`
  SELECT id, room_number, type, capacity, equipment 
  FROM rooms 
  WHERE capacity >= 5 AND equipment LIKE '%projector%' AND status = 'available'
`).all();

const availableRooms = candidateRooms.filter(room => {
  const conflict = db.prepare(`
    SELECT * FROM bookings 
    WHERE room_id = ? AND date = ? AND NOT (end_time <= ? OR start_time >= ?)
  `).get(room.id, filterDate, filterStart, filterEnd);
  return !conflict;
});

assert(availableRooms.length > 0, `Found ${availableRooms.length} available rooms matching criteria (e.g. ${availableRooms.slice(0, 3).map(r => r.room_number).join(', ')})`);

console.log('\n====================================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');
db.close();

if (failed > 0) {
  process.exit(1);
}
