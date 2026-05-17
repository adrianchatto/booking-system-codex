export type SupportedTenantType = 'WINDOW_CLEANER' | 'HAIRDRESSER' | 'PERSONAL_TRAINER' | 'PLUMBER'

export type TenantProvisioningInput = {
  businessName?: string
  slug?: string
  type?: string
  adminEmail?: string
  adminName?: string
  adminPassword?: string
  cardholderName?: string
  cardNumber?: string
  cardExpiry?: string
  cardCvc?: string
  billingPostcode?: string
}

export type StarterService = {
  name: string
  description: string
  duration: number
  price: number
}

export type MockPaymentMethod = {
  cardholderName: string
  cardBrand: string
  cardLast4: string
  cardExpMonth: number
  cardExpYear: number
  billingPostcode: string
}

export const BILLING_PLAN = {
  monthlyPricePence: 3500,
  currency: 'GBP',
  trialMonths: 1,
}

const SUPPORTED_TYPES = new Set<SupportedTenantType>([
  'WINDOW_CLEANER',
  'HAIRDRESSER',
  'PERSONAL_TRAINER',
  'PLUMBER',
])

const DEFAULT_OPENING_HOURS = {
  mon: { open: '09:00', close: '17:00', enabled: true },
  tue: { open: '09:00', close: '17:00', enabled: true },
  wed: { open: '09:00', close: '17:00', enabled: true },
  thu: { open: '09:00', close: '17:00', enabled: true },
  fri: { open: '09:00', close: '17:00', enabled: true },
  sat: { open: '09:00', close: '13:00', enabled: false },
  sun: { open: '09:00', close: '13:00', enabled: false },
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeCardNumber(cardNumber?: string) {
  return cardNumber?.replace(/\D/g, '') ?? ''
}

function passesLuhn(cardNumber: string) {
  let sum = 0
  let shouldDouble = false

  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = Number(cardNumber[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

function getCardBrand(cardNumber: string) {
  if (/^4/.test(cardNumber)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return 'Mastercard'
  if (/^3[47]/.test(cardNumber)) return 'American Express'
  return 'Card'
}

function parseCardExpiry(cardExpiry?: string, now = new Date()) {
  const match = cardExpiry?.trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/)
  if (!match) return null

  const month = Number(match[1])
  const rawYear = Number(match[2])
  const year = rawYear < 100 ? 2000 + rawYear : rawYear
  if (month < 1 || month > 12) return null

  const expiryBoundary = new Date(year, month, 1)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (expiryBoundary <= currentMonth) return null

  return { month, year }
}

function validateMockPaymentMethod(input: TenantProvisioningInput, errors: string[]): MockPaymentMethod {
  const cardholderName = input.cardholderName?.trim() ?? ''
  const billingPostcode = input.billingPostcode?.trim().toUpperCase() ?? ''
  const cardNumber = normalizeCardNumber(input.cardNumber)
  const expiry = parseCardExpiry(input.cardExpiry)
  const cvc = input.cardCvc?.trim() ?? ''

  if (!cardholderName) errors.push('Cardholder name is required')
  if (cardNumber.length < 12 || cardNumber.length > 19 || !passesLuhn(cardNumber)) errors.push('Enter a valid card number')
  if (!expiry) errors.push('Enter a valid future expiry date')
  if (!/^\d{3,4}$/.test(cvc)) errors.push('Enter a valid CVC')

  return {
    cardholderName,
    cardBrand: cardNumber ? getCardBrand(cardNumber) : 'Card',
    cardLast4: cardNumber.slice(-4),
    cardExpMonth: expiry?.month ?? 0,
    cardExpYear: expiry?.year ?? 0,
    billingPostcode,
  }
}

export const STARTER_SERVICES: Record<SupportedTenantType, StarterService[]> = {
  WINDOW_CLEANER: [
    { name: 'Standard Window Clean', description: 'Exterior window clean for a typical home.', duration: 90, price: 45 },
    { name: 'Conservatory Clean', description: 'Glass and frame clean for conservatories.', duration: 120, price: 75 },
  ],
  HAIRDRESSER: [
    { name: 'Cut & Finish', description: 'Consultation, cut, and professional finish.', duration: 60, price: 45 },
    { name: 'Colour Consultation', description: 'Colour planning appointment before treatment.', duration: 30, price: 20 },
  ],
  PERSONAL_TRAINER: [
    { name: '1-to-1 Training Session', description: 'Personal training session tailored to the client goal.', duration: 60, price: 60 },
    { name: 'Fitness Assessment', description: 'Baseline assessment and goal-setting session.', duration: 60, price: 35 },
  ],
  PLUMBER: [
    { name: 'Call-out Visit', description: 'Initial diagnosis and small repair visit.', duration: 60, price: 80 },
    { name: 'Quote Appointment', description: 'Site visit for larger work or installations.', duration: 45, price: 0 },
  ],
}

export function validateTenantProvisioningInput(input: TenantProvisioningInput) {
  const errors: string[] = []
  const businessName = input.businessName?.trim() ?? ''
  const adminEmail = input.adminEmail?.trim().toLowerCase() ?? ''
  const adminName = input.adminName?.trim() || adminEmail.split('@')[0] || 'Business admin'
  const adminPassword = input.adminPassword ?? ''
  const slug = toSlug(input.slug || businessName)
  const type = input.type as SupportedTenantType
  const paymentMethod = validateMockPaymentMethod(input, errors)

  if (!businessName) errors.push('Business name is required')
  if (!slug) errors.push('URL slug is required')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push('URL slug can only contain letters, numbers, and hyphens')
  if (!SUPPORTED_TYPES.has(type)) errors.push('Business type is not supported')
  if (!adminEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adminEmail)) errors.push('A valid admin email is required')
  if (adminPassword.length < 10) errors.push('Admin password must be at least 10 characters')

  return {
    ok: errors.length === 0,
    errors,
    value: {
      businessName,
      slug,
      type,
      adminEmail,
      adminName,
      adminPassword,
      paymentMethod,
    },
  }
}

export function getDefaultTenantSettings(type: SupportedTenantType, businessName: string, adminEmail: string) {
  const palette: Record<SupportedTenantType, { primaryColor: string; secondaryColor: string; accentColor: string; tagline: string }> = {
    WINDOW_CLEANER: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#075985',
      accentColor: '#22D3EE',
      tagline: 'Reliable local window cleaning',
    },
    HAIRDRESSER: {
      primaryColor: '#DB2777',
      secondaryColor: '#831843',
      accentColor: '#F9A8D4',
      tagline: 'Appointments made simple',
    },
    PERSONAL_TRAINER: {
      primaryColor: '#DC2626',
      secondaryColor: '#7F1D1D',
      accentColor: '#F97316',
      tagline: 'Training sessions booked without friction',
    },
    PLUMBER: {
      primaryColor: '#2563EB',
      secondaryColor: '#1E3A8A',
      accentColor: '#F97316',
      tagline: 'Fast booking for local plumbing work',
    },
  }

  return {
    ...palette[type],
    email: adminEmail,
    description: `${businessName} can edit this website, services, opening hours, and contact details from their admin area.`,
    openingHours: DEFAULT_OPENING_HOURS,
    galleryImages: [],
    metaTitle: `${businessName} - Book Online`,
    metaDescription: `Book an appointment with ${businessName}.`,
  }
}

export function getStarterServices(type: SupportedTenantType) {
  return STARTER_SERVICES[type]
}
