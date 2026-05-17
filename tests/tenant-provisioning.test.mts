import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BILLING_PLAN,
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
    cardholderName: 'Northside Windows Ltd',
    cardNumber: '4242 4242 4242 4242',
    cardExpiry: '12/34',
    cardCvc: '123',
    billingPostcode: 'SW1A 1AA',
  })

  assert.equal(result.ok, true)
  assert.equal(result.value.businessName, 'Northside Windows')
  assert.equal(result.value.slug, 'northside-windows')
  assert.equal(result.value.adminEmail, 'owner@example.com')
  assert.equal(result.value.adminName, 'owner')
  assert.equal(result.value.paymentMethod.cardBrand, 'Visa')
  assert.equal(result.value.paymentMethod.cardLast4, '4242')
  assert.equal(result.value.paymentMethod.cardExpMonth, 12)
  assert.equal(result.value.paymentMethod.cardExpYear, 2034)
  assert.equal(result.value.paymentMethod.billingPostcode, 'SW1A 1AA')
})

test('tenant provisioning rejects incomplete business setup', () => {
  const result = validateTenantProvisioningInput({
    businessName: '',
    slug: 'bad slug',
    type: 'COFFEE_SHOP',
    adminEmail: 'not-an-email',
    adminPassword: 'short',
    cardholderName: '',
    cardNumber: '1234',
    cardExpiry: '13/20',
    cardCvc: '12',
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join('\n'), /Business name is required/)
  assert.match(result.errors.join('\n'), /Business type is not supported/)
  assert.match(result.errors.join('\n'), /valid admin email/)
  assert.match(result.errors.join('\n'), /at least 10 characters/)
  assert.match(result.errors.join('\n'), /Cardholder name is required/)
  assert.match(result.errors.join('\n'), /valid card number/)
  assert.match(result.errors.join('\n'), /valid future expiry/)
  assert.match(result.errors.join('\n'), /valid CVC/)
})

test('billing plan gives every new business one month free before the monthly charge', () => {
  assert.equal(BILLING_PLAN.monthlyPricePence, 3500)
  assert.equal(BILLING_PLAN.currency, 'GBP')
  assert.equal(BILLING_PLAN.trialMonths, 1)
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
