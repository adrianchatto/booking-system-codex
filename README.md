# Codex Booking System

A multi-tenant booking platform for local service businesses. The owner admin creates business accounts, gives each business its own booking site and tenant admin area, and manages account status from one private console.

## What It Does

- **Owner admin** at `/admin/login` for creating and managing business accounts.
- **Business booking sites** at `/{slug}` and wildcard tenant subdomains when DNS is configured.
- **Tenant admin** at `/{slug}/admin/login` for bookings, customers, services, calendar blocking, and CMS settings.
- **Booking approval workflow** so incoming requests can stay pending until the business accepts them.
- **Customer management and SMTP email** so tenant admins can edit customer details, keep notes, and send emails through their own mailbox.
- **Mock billing capture** on business creation: £35/month after a one-month free trial, storing only card brand, last four, expiry, and postcode.
- **Starter services** are generated for each new business type so a new account is immediately usable.

## Production Bootstrap

The seed command creates or updates only the platform owner account. It does not create demo businesses.

Default owner login:

```text
superadmin@platform.com / SuperAdmin2024!
```

Override these with environment variables:

```bash
SUPER_ADMIN_EMAIL=owner@example.com
SUPER_ADMIN_PASSWORD=use-a-long-secret-password
SUPER_ADMIN_NAME="Platform Owner"
```

## Local Development

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test
```

Current tests cover tenant routing, booking approval transitions, and tenant provisioning rules.

## Coolify Deployment

Coolify deployment notes live in [`docs/coolify.md`](docs/coolify.md).

For the current Cloudflare setup, Coolify should use the HTTP app domain so Cloudflare terminates public HTTPS:

```text
http://bookingcodex.chattoweb.com
```

The compose startup command applies the Prisma schema, seeds the platform owner account, and starts Next.js:

```bash
npx prisma db push && npm run db:seed && node server.js
```

## Project Structure

```text
src/
  app/
    page.tsx                  # Private operator gateway
    admin/                    # Owner admin
    [slug]/                   # Business booking sites and tenant admin
    api/                      # Auth, tenants, bookings, customers, services
  components/
    admin/                    # Tenant admin UI components
    themes/                   # Customer-facing booking site themes
  lib/
    booking-workflow.ts       # Booking status transitions
    tenant-provisioning.ts    # Business onboarding defaults
    tenant-routing.ts         # Path and subdomain routing
```

## Adding a Business

1. Log in at `/admin/login`.
2. Open the owner dashboard.
3. Click **New Business**.
4. Enter the business name, URL slug, business type, and client admin credentials.
5. The business site is live immediately at `/{slug}`.

## Tech Stack

| Layer | Technology |
| --- | --- |
| App | Next.js 14 |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Deployment | Coolify / Docker |
