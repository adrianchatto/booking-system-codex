import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import {
  assertBookingStatusTransition,
  canTransitionBookingStatus,
  getInitialPublicBookingStatus,
  getStatusForAction,
  isKnownBookingAction,
} from '../src/lib/booking-workflow.ts'

describe('booking approval workflow', () => {
  it('creates public booking requests as pending by default', () => {
    assert.equal(getInitialPublicBookingStatus(), 'PENDING')
  })

  it('maps admin approval actions to booking statuses', () => {
    assert.equal(getStatusForAction('approve'), 'CONFIRMED')
    assert.equal(getStatusForAction('mark_pending'), 'PENDING')
    assert.equal(getStatusForAction('cancel'), 'CANCELLED')
    assert.equal(getStatusForAction('complete'), 'COMPLETED')
    assert.equal(getStatusForAction('no_show'), 'NO_SHOW')
  })

  it('allows approving or declining pending requests', () => {
    assert.equal(canTransitionBookingStatus('PENDING', 'CONFIRMED'), true)
    assert.equal(canTransitionBookingStatus('PENDING', 'CANCELLED'), true)
  })

  it('allows confirmed or cancelled bookings to be put back to pending', () => {
    assert.equal(canTransitionBookingStatus('CONFIRMED', 'PENDING'), true)
    assert.equal(canTransitionBookingStatus('CANCELLED', 'PENDING'), true)
  })

  it('does not allow finished bookings to be changed', () => {
    assert.equal(canTransitionBookingStatus('COMPLETED', 'CANCELLED'), false)
    assert.equal(canTransitionBookingStatus('NO_SHOW', 'CONFIRMED'), false)
  })

  it('rejects unknown workflow actions', () => {
    assert.equal(isKnownBookingAction('approve'), true)
    assert.equal(isKnownBookingAction('refund'), false)
  })

  it('throws a helpful error for invalid transitions', () => {
    assert.throws(
      () => assertBookingStatusTransition('PENDING', 'COMPLETED'),
      /Cannot move booking from PENDING to COMPLETED/
    )
  })
})
