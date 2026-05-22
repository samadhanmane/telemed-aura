/**
 * Short-lived JWT for join-room — patient/doctor only, tied to appointmentId.
 */

export function signRoomToken(_payload: {
  roomId: string;
  userId: string;
  role: string;
}): string {
  return "";
}

export function verifyRoomToken(_token: string): boolean {
  return false;
}
