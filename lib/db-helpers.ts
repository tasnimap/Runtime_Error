// Re-export all functions that agent-tools.ts needs from the main db module.
// This exists as a clean bridge so the tool executor doesn't import from db.ts directly.

export {
  getSchedules,
  getRooms,
  bookRoom,
  cancelBooking,
  getEvents,
  registerEvent,
  cancelEventRegistration,
  getAnnouncements,
  getAssignments,
} from './db';

import { createAnnouncement as _createAnnouncement, updateAssignment } from './db';

/**
 * addAnnouncement – wrapper used by the agent.
 * Generates an ID and date, then delegates to createAnnouncement.
 */
export function addAnnouncement(params: {
  title: string;
  body: string;
  priority: string;
  posted_by: string;
  expires: string;
}) {
  const id = `ann-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const date = new Date().toISOString().split('T')[0];
  return _createAnnouncement({ id, date, ...params } as any);
}

/**
 * updateAssignmentStatus – wrapper used by the agent.
 * Updates only the status field of an assignment.
 */
export function updateAssignmentStatus(id: string, status: string) {
  return updateAssignment(id, { status } as any);
}
