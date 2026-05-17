import Link from 'next/link'
import { ArrowRight, Building2, CalendarCheck, ShieldCheck, Users } from 'lucide-react'

export default function PlatformHome() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 text-slate-950">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Codex Booking System</p>
              <p className="text-xs text-slate-400">Operator console</p>
            </div>
          </div>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-100"
          >
            Admin login <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              Private platform admin
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Create and manage booking systems for real local businesses.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              This is the owner-facing control plane. Use it to add businesses, issue tenant admin access,
              activate or pause accounts, and hand each business its own booking website and back office.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Open platform admin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                icon: <Building2 className="h-5 w-5" />,
                title: 'Business onboarding',
                body: 'Create a tenant, choose a business type, and generate starter services in one action.',
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: 'Controlled access',
                body: 'The platform owner keeps this area private; clients only receive their tenant admin login.',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: 'Client handover',
                body: 'Each business manages bookings, customers, opening hours, services, and website content.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-cyan-200">
                  {item.icon}
                </div>
                <h2 className="text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
