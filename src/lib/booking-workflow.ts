export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

export type BookingAction = 'approve' | 'decline' | 'cancel' | 'complete' | 'no_show' | 'reinstate'

const ACTION_STATUS: Record<BookingAction, BookingStatus> = {
  approve: 'CONFIRMED',
  decline: 'CANCELLED',
  cancel: 'CANCELLED',
  complete: 'COMPLETED',
  no_show: 'NO_SHOW',
  reinstate: 'PENDING',
}

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
  CANCELLED: ['PENDING'],
  COMPLETED: [],
  NO_SHOW: [],
}

export function getInitialPublicBookingStatus(): BookingStatus {
  return 'PENDING'
}

export function getStatusForAction(action: BookingAction): BookingStatus {
  return ACTION_STATUS[action]
}

export function isKnownBookingAction(action: string): action is BookingAction {
  return action in ACTION_STATUS
}

export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertBookingStatusTransition(from: BookingStatus, to: BookingStatus) {
  if (!canTransitionBookingStatus(from, to)) {
    throw new Error(`Cannot move booking from ${from} to ${to}`)
  }
}

