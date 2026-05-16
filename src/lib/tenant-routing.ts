const DEFAULT_ROOT_DOMAIN = 'chatweb.com'
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'admin', 'api'])
const RESERVED_PATH_SEGMENTS = new Set(['admin', 'api', '_next', 'favicon.ico'])

export function getRootDomain() {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? DEFAULT_ROOT_DOMAIN
}

export function normalizeHost(host: string | null | undefined) {
  return (host ?? '').split(':')[0].toLowerCase()
}

export function getTenantSlugFromHost(host: string | null | undefined, rootDomain = getRootDomain()) {
  const normalizedHost = normalizeHost(host)
  const normalizedRoot = normalizeHost(rootDomain)

  if (!normalizedHost || !normalizedRoot) return null
  if (normalizedHost === normalizedRoot || normalizedHost === `www.${normalizedRoot}`) return null
  if (!normalizedHost.endsWith(`.${normalizedRoot}`)) return null

  const subdomain = normalizedHost.slice(0, -`.${normalizedRoot}`.length)
  if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) return null

  return subdomain
}

export function getTenantSlugFromPathname(pathname: string) {
  const [firstSegment] = pathname.split('/').filter(Boolean)
  if (!firstSegment || RESERVED_PATH_SEGMENTS.has(firstSegment)) return null
  return firstSegment
}

export function isTenantSubdomainRequest(host: string | null | undefined, rootDomain = getRootDomain()) {
  return getTenantSlugFromHost(host, rootDomain) !== null
}

export function rewriteTenantSubdomainPath(pathname: string, tenantSlug: string) {
  if (pathname === '/') return `/${tenantSlug}`
  if (pathname === '/admin') return `/${tenantSlug}/admin`
  if (pathname.startsWith('/admin/')) return `/${tenantSlug}${pathname}`
  return pathname
}

