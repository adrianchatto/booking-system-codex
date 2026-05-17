import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDefaultTenantSettings,
  getStarterServices,
  validateTenantProvisioningInput,
} from '../src/lib/tenant-provisioning.ts'

test('tenant provisioning normalizes valid business onboarding input', () => {
  const result = validateTenantProvisioningInput({
    businessName: '  Northside Windows  ',
    type: 'WINDOW_CLEANER',
    adminEmail: ' OWNER@Example.COM ',
    adminName: '',
    adminPassword: 'long-enough-password',
  })

  assert.equal(result.ok, true)
  assert.equal(result.value.businessName, 'Northside Windows')
  assert.equal(result.value.slug, 'northside-windows')
  assert.equal(result.value.adminEmail, 'owner@example.com')
  assert.equal(result.value.adminName, 'owner')
})

test('tenant provisioning rejects incomplete business setup', () => {
  const result = validateTenantProvisioningInput({
    businessName: '',
    slug: 'bad slug',
    type: 'COFFEE_SHOP',
    adminEmail: 'not-an-email',
    adminPassword: 'short',
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /Business name is required/)
  assert.match(result.errors.join('\n'), /Business type is not supported/)
  assert.match(result.errors.join('\n'), /valid admin email/)
  assert.match(result.errors.join('\n'), /at least 10 characters/)
})

test('starter services make a new tenant immediately bookable', () => {
  const services = getStarterServices('PLUMBER')

  assert.ok(services.length >= 2)
  assert.ok(services.every((service) => service.name && service.duration > 0))
})

test('default tenant settings are neutral and editable', () => {
  const settings = getDefaultTenantSettings('HAIRDRESSER', 'Style House', 'owner@style.test')

  assert.equal(settings.email, 'owner@style.test')
  assert.equal(settings.galleryImages.length, 0)
  assert.match(settings.description, /edit this website/)
  assert.equal(settings.metaTitle, 'Style House - Book Online')
})
