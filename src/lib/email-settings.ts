export type RawSmtpSettings = {
  smtpHost?: string | null
  smtpPort?: string | number | null
  smtpSecure?: boolean | null
  smtpUsername?: string | null
  smtpPassword?: string | null
  smtpPasswordEncrypted?: string | null
  smtpFromEmail?: string | null
  smtpFromName?: string | null
}

export type NormalizedSmtpSettings = {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUsername: string
  smtpPassword: string
  smtpFromEmail: string
  smtpFromName: string
}

export function normalizeSmtpSettings(input: RawSmtpSettings): NormalizedSmtpSettings {
  return {
    smtpHost: input.smtpHost?.trim() ?? '',
    smtpPort: Number(input.smtpPort || 0),
    smtpSecure: Boolean(input.smtpSecure),
    smtpUsername: input.smtpUsername?.trim() ?? '',
    smtpPassword: input.smtpPassword?.trim() ?? '',
    smtpFromEmail: input.smtpFromEmail?.trim().toLowerCase() ?? '',
    smtpFromName: input.smtpFromName?.trim() ?? '',
  }
}

export function getEmailConfigStatus(settings: RawSmtpSettings) {
  const missing: string[] = []
  if (!settings.smtpHost) missing.push('SMTP host')
  if (!Number(settings.smtpPort)) missing.push('SMTP port')
  if (!settings.smtpUsername) missing.push('SMTP username')
  if (!settings.smtpPasswordEncrypted) missing.push('SMTP password')
  if (!settings.smtpFromEmail) missing.push('From email')

  return {
    configured: missing.length === 0,
    missing,
  }
}

export function redactSmtpSettings(settings: RawSmtpSettings) {
  const normalized = normalizeSmtpSettings(settings)

  return {
    smtpHost: normalized.smtpHost,
    smtpPort: normalized.smtpPort || 587,
    smtpSecure: normalized.smtpSecure,
    smtpUsername: normalized.smtpUsername,
    smtpPassword: '',
    smtpPasswordSet: Boolean(settings.smtpPasswordEncrypted),
    smtpFromEmail: normalized.smtpFromEmail,
    smtpFromName: normalized.smtpFromName,
    emailStatus: getEmailConfigStatus(settings),
  }
}
