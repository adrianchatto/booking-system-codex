import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { getTenantSlugFromHost, rewriteTenantSubdomainPath } from '@/lib/tenant-routing'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const tenantSlugFromHost = getTenantSlugFromHost(req.headers.get('host'))
    const pathname = tenantSlugFromHost
      ? rewriteTenantSubdomainPath(req.nextUrl.pathname, tenantSlugFromHost)
      : req.nextUrl.pathname

    // Super admin routes — only SUPER_ADMIN role
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    }

    // Tenant admin routes — only TENANT_ADMIN role for their own slug
    const tenantAdminMatch = pathname.match(/^\/([^/]+)\/admin/)
    if (tenantAdminMatch) {
      const slug = tenantAdminMatch[1]
      if (!pathname.includes('/login')) {
        if (token?.role !== 'TENANT_ADMIN') {
          return NextResponse.redirect(new URL(tenantSlugFromHost ? '/admin/login' : `/${slug}/admin/login`, req.url))
        }
        if ((token as any)?.tenantSlug !== slug) {
          return NextResponse.redirect(new URL(tenantSlugFromHost ? '/admin/login' : `/${slug}/admin/login`, req.url))
        }
      }
    }

    if (tenantSlugFromHost && pathname !== req.nextUrl.pathname) {
      const url = req.nextUrl.clone()
      url.pathname = pathname
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const tenantSlugFromHost = getTenantSlugFromHost(req.headers.get('host'))
        const pathname = tenantSlugFromHost
          ? rewriteTenantSubdomainPath(req.nextUrl.pathname, tenantSlugFromHost)
          : req.nextUrl.pathname
        // Login pages are always accessible
        if (pathname === '/admin/login') return true
        if (pathname.match(/\/[^/]+\/admin\/login$/)) return true
        // Everything else needs a token
        if (pathname.startsWith('/admin') || pathname.match(/\/[^/]+\/admin/)) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/:slug/admin/:path*',
  ],
}
