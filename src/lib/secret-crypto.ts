import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const secret = process.env.EMAIL_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET ?? 'local-development-secret'
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string) {
  if (!value) return ''

  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv, tag, encrypted].map((part) => part.toString('base64')).join(':')
}

export function decryptSecret(value: string) {
  if (!value) return ''

  const [ivText, tagText, encryptedText] = value.split(':')
  if (!ivText || !tagText || !encryptedText) return ''

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivText, 'base64'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
