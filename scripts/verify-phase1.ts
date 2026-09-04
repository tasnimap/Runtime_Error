import {
  getDb,
  getSchedules,
  getRooms,
  getEvents,
  getAnnouncements,
  getAssignments,
  bookRoom,
  cancelBooking,
  registerEvent,
  cancelEventRegistration,
  createAnnouncement,
  deleteAnnouncement,
} from '../lib/db';

async function main() {
  console.log('=== PHASE 1: DATABASE & SEED LOADER VERIFICATION ===\n');

  // Initialize and load seed data
  getDb();

  // 1. Verify seed record counts
  const schedules = getSchedules();
  const rooms = getRooms();
  const events = getEvents();
  const announcements = getAnnouncements();
  const assignments = getAssignments();

  console.log(`✓ Schedules loaded: ${schedules.length} (expected: 24)`);
  console.log(`✓ Rooms loaded: ${rooms.length} (expected: 20)`);
  console.log(`✓ Events loaded: ${events.length} (expected: 7)`);
  console.log(`✓ Announcements loaded: ${announcements.length} (expected: 8)`);
  console.log(`✓ Assignments loaded: ${assignments.length} (expected: 8)`);

  if (schedules.length !== 24 || rooms.length !== 20 || events.length !== 7 || announcements.length !== 8 || assignments.length !== 8) {
    throw new Error('Seed record count mismatch!');
  }

  // 2. Test query filters
  console.log('\n--- Testing Query Filters ---');
  const sundayClasses = getSchedules({ day: 'Sunday' });
  console.log(`✓ Sunday classes: ${sundayClasses.length} found (first: ${sundayClasses[0]?.course} at ${sundayClasses[0]?.start_time})`);

  const projectorLabs = getRooms({ type: 'lab', min_capacity: 30, equipment: 'projector' });
  console.log(`✓ Labs with projector & capacity >= 30: ${projectorLabs.map(r => r.room_number).join(', ')} (expected 6 labs)`);
  if (projectorLabs.length !== 6) {
    throw new Error(`Expected 6 projector labs, got ${projectorLabs.length}`);
  }

  // 3. Test Room Booking & Conflict Validation
  console.log('\n--- Testing Room Booking & Conflict Detection ---');
  const bookResult = bookRoom({
    roomIdOrNumber: '7A02',
    booked_by: 'Judge Test',
    date: '2026-09-05',
    start_time: '15:00',
    end_time: '17:00',
    purpose: 'Hackathon Test Booking',
  });
  console.log(`✓ Booking created: success=${bookResult.success}, booking_id=${bookResult.booking?.booking_id}`);
  if (!bookResult.success || !bookResult.booking) {
    throw new Error('Failed to create booking: ' + bookResult.error);
  }

  // Test overlapping booking (same date, overlapping time 16:00-18:00)
  const conflictResult = bookRoom({
    roomIdOrNumber: '7A02',
    booked_by: 'Another Person',
    date: '2026-09-05',
    start_time: '16:00',
    end_time: '18:00',
    purpose: 'Overlapping Booking Test',
  });
  console.log(`✓ Conflict detection test: success=${conflictResult.success} (expected false), error="${conflictResult.error}"`);
  if (conflictResult.success) {
    throw new Error('Conflict validation failed: overlapping booking was accepted!');
  }

  // Cancel the test booking
  const cancelResult = cancelBooking(bookResult.booking.booking_id);
  console.log(`✓ Booking cancel test: success=${cancelResult.success}`);
  if (!cancelResult.success) {
    throw new Error('Failed to cancel booking');
  }

  // 4. Test Event Registration & Cancellation
  console.log('\n--- Testing Event Registration & Capacity ---');
  const eventBefore = events.find(e => e.id === 'evt-002')!;
  console.log(`Before registration: Event "${eventBefore.name}", registered=${eventBefore.registered}/${eventBefore.capacity}`);

  const regResult = registerEvent({
    eventIdOrName: 'evt-002',
    student_id: '99-99999',
    name: 'Verification Bot',
  });
  console.log(`✓ Registration result: success=${regResult.success}, new registered count=${regResult.event?.registered}`);
  if (!regResult.success || regResult.event?.registered !== eventBefore.registered + 1) {
    throw new Error('Registration count increment failed');
  }

  // Cancel registration
  const unregResult = cancelEventRegistration({
    eventIdOrName: 'evt-002',
    student_id: '99-99999',
  });
  console.log(`✓ Registration cancel result: success=${unregResult.success}, restored registered count=${unregResult.event?.registered}`);
  if (!unregResult.success || unregResult.event?.registered !== eventBefore.registered) {
    throw new Error('Registration cancellation failed');
  }

  // 5. Test Persistence Across Restarts
  console.log('\n--- Testing Persistence Across Restarts ---');
  const testAnnId = 'ann-test-persist';
  createAnnouncement({
    id: testAnnId,
    title: 'Persistence Test Announcement',
    body: 'This tests whether changes stay saved in SQLite across process runs.',
    date: '2026-09-04',
    priority: 'high',
    posted_by: 'System Test',
    expires: '2026-09-30',
  });

  console.log(`✓ Created test record "${testAnnId}" in SQLite database.`);

  console.log('\n=== PHASE 1 VERIFICATION PASSED SUCCESSFULLY ===\n');
}

main().catch(err => {
  console.error('Phase 1 Verification Failed:', err);
  process.exit(1);
});
