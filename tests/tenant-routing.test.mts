import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import {
  getTenantSlugFromHost,
  getTenantSlugFromPathname,
  normalizeHost,
  rewriteTenantSubdomainPath,
} from '../src/lib/tenant-routing.ts'

describe('tenant routing', () => {
  it('normalizes hosts by removing ports and lowercasing', () => {
    assert.equal(normalizeHost('Bright-Windows.ChatWeb.com:3000'), 'bright-windows.chatweb.com')
  })

  it('resolves tenant slugs from wildcard chatweb.com subdomains', () => {
    assert.equal(getTenantSlugFromHost('bright-windows.chatweb.com', 'chatweb.com'), 'bright-windows')
    assert.equal(getTenantSlugFromHost('shear-perfection.chatweb.com:3000', 'chatweb.com'), 'shear-perfection')
  })

  it('does not treat root, www, or reserved subdomains as tenants', () => {
    assert.equal(getTenantSlugFromHost('chatweb.com', 'chatweb.com'), null)
    assert.equal(getTenantSlugFromHost('www.chatweb.com', 'chatweb.com'), null)
    assert.equal(getTenantSlugFromHost('admin.chatweb.com', 'chatweb.com'), null)
    assert.equal(getTenantSlugFromHost('api.chatweb.com', 'chatweb.com'), null)
  })

  it('keeps path-based tenant slugs working', () => {
    assert.equal(getTenantSlugFromPathname('/bright-windows'), 'bright-windows')
    assert.equal(getTenantSlugFromPathname('/bright-windows/admin/dashboard'), 'bright-windows')
    assert.equal(getTenantSlugFromPathname('/admin/login'), null)
    assert.equal(getTenantSlugFromPathname('/api/bookings'), null)
  })

  it('rewrites tenant subdomain admin paths to the existing slug routes', () => {
    assert.equal(rewriteTenantSubdomainPath('/', 'bright-windows'), '/bright-windows')
    assert.equal(rewriteTenantSubdomainPath('/admin/login', 'bright-windows'), '/bright-windows/admin/login')
    assert.equal(rewriteTenantSubdomainPath('/admin/dashboard', 'bright-windows'), '/bright-windows/admin/dashboard')
    assert.equal(rewriteTenantSubdomainPath('/services', 'bright-windows'), '/services')
  })
})
