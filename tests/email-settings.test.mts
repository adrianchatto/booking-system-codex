import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getEmailConfigStatus,
  normalizeSmtpSettings,
  redactSmtpSettings,
} from '../src/lib/email-settings.ts'

test('smtp settings normalize admin input for storage', () => {
  const settings = normalizeSmtpSettings({
    smtpHost: ' smtp.example.com ',
    smtpPort: '587',
    smtpSecure: false,
    smtpUsername: ' owner@example.com ',
    smtpPassword: 'secret-password',
    smtpFromEmail: ' bookings@example.com ',
    smtpFromName: ' Bookings Team ',
  })

  assert.equal(settings.smtpHost, 'smtp.example.com')
  assert.equal(settings.smtpPort, 587)
  assert.equal(settings.smtpSecure, false)
  assert.equal(settings.smtpUsername, 'owner@example.com')
  assert.equal(settings.smtpPassword, 'secret-password')
  assert.equal(settings.smtpFromEmail, 'bookings@example.com')
  assert.equal(settings.smtpFromName, 'Bookings Team')
})

test('smtp status reports missing configuration without exposing passwords', () => {
  const status = getEmailConfigStatus({
    smtpHost: '',
    smtpPort: 0,
    smtpUsername: 'owner@example.com',
    smtpPasswordEncrypted: 'encrypted-secret',
    smtpFromEmail: '',
  })

  assert.equal(status.configured, false)
  assert.deepEqual(status.missing, ['SMTP host', 'SMTP port', 'From email'])
})

test('smtp settings redact stored secrets for the admin UI', () => {
  const redacted = redactSmtpSettings({
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUsername: 'owner@example.com',
    smtpPasswordEncrypted: 'encrypted-secret',
    smtpFromEmail: 'bookings@example.com',
    smtpFromName: 'Bookings Team',
  })

  assert.equal(redacted.smtpPassword, '')
  assert.equal(redacted.smtpPasswordSet, true)
})
