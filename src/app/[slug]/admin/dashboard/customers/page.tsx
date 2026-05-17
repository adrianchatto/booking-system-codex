'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import { formatDate, formatCurrency } from '@/lib/utils'
import { CustomerWithBookings } from '@/types'
import { Loader2, Phone, Mail, ChevronDown, ChevronRight, Search, Save, X, Pencil, Send } from 'lucide-react'

export default function CustomersPage() {
  const { slug } = useParams() as { slug: string }
  const [customers, setCustomers] = useState<CustomerWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [emailCustomer, setEmailCustomer] = useState<CustomerWithBookings | null>(null)
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')

  useEffect(() => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => { setCustomers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
  )

  function startEdit(customer: CustomerWithBookings) {
    setEditingId(customer.id)
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      notes: customer.notes ?? '',
    })
  }

  async function saveCustomer(id: string) {
    setSavingCustomer(true)
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    setSavingCustomer(false)

    if (res.ok) {
      setCustomers((prev) => prev.map((customer) => (
        customer.id === id ? { ...customer, ...editForm } : customer
      )))
      setEditingId(null)
    }
  }

  function openEmail(customer: CustomerWithBookings) {
    setEmailCustomer(customer)
    setEmailStatus('')
    setEmailForm({
      subject: '',
      message: `Hi ${customer.name},\n\n`,
    })
  }

  async function sendEmail() {
    if (!emailCustomer) return
    setSendingEmail(true)
    setEmailStatus('')
    const res = await fetch('/api/email/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: emailCustomer.id,
        subject: emailForm.subject,
        message: emailForm.message,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setSendingEmail(false)

    if (res.ok) {
      setEmailStatus('Email sent.')
      setTimeout(() => {
        setEmailCustomer(null)
        setEmailStatus('')
      }, 1200)
    } else {
      setEmailStatus(data.error ?? 'Email could not be sent.')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar slug={slug} businessName={slug} />
      <main className="flex-1 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-500 text-sm mt-1">{customers.length} total customers</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((customer) => {
                const isOpen = expanded === customer.id
                const totalSpend = customer.bookings
                  .filter((b) => b.status === 'COMPLETED')
                  .reduce((sum, b) => sum + Number(b.service.price), 0)
                const lastBooking = customer.bookings[0]

                return (
                  <div key={customer.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : customer.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {customer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <a href={`mailto:${customer.email}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </a>
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-right flex-shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{customer.bookings.length}</p>
                          <p className="text-xs text-gray-400">bookings</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalSpend)}</p>
                          <p className="text-xs text-gray-400">total spend</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{lastBooking ? formatDate(lastBooking.startTime) : '—'}</p>
                          <p className="text-xs text-gray-400">last visit</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer Details</p>
                            {editingId === customer.id ? (
                              <div className="space-y-3">
                                <input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="tel"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                                  placeholder="Phone"
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium text-gray-900">Name:</span> {customer.name}</p>
                                <p><span className="font-medium text-gray-900">Email:</span> {customer.email}</p>
                                <p><span className="font-medium text-gray-900">Phone:</span> {customer.phone || 'Not set'}</p>
                                <p><span className="font-medium text-gray-900">Customer since:</span> {formatDate(customer.createdAt)}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                            {editingId === customer.id ? (
                              <textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                rows={6}
                                placeholder="Preferences, access notes, allergies, parking instructions..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                            ) : (
                              <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[4rem]">{customer.notes || 'No notes saved yet.'}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Booking History</p>
                        {customer.bookings.length === 0 ? (
                          <p className="text-sm text-gray-400">No bookings yet</p>
                        ) : (
                          <div className="space-y-2">
                            {customer.bookings.map((booking) => (
                              <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{booking.service.name}</p>
                                  <p className="text-xs text-gray-400">{formatDate(booking.startTime)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(booking.service.price)}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                    booking.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-3">
                          {editingId === customer.id ? (
                            <>
                              <button
                                onClick={() => saveCustomer(customer.id)}
                                disabled={savingCustomer}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                              >
                                {savingCustomer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                              </button>
                              <button onClick={() => setEditingId(null)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </>
                          ) : (
                            <button onClick={() => startEdit(customer)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                              <Pencil className="w-3.5 h-3.5" /> Edit Details
                            </button>
                          )}
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                          )}
                          <button onClick={() => openEmail(customer)} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">No customers found</div>
              )}
            </div>
          )}
        </div>
      </main>
      {emailCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Send Email</h2>
                <p className="text-xs text-gray-500">{emailCustomer.name} · {emailCustomer.email}</p>
              </div>
              <button onClick={() => setEmailCustomer(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                value={emailForm.subject}
                onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Subject"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))}
                rows={9}
                placeholder="Message"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {emailStatus && <p className={`text-sm ${emailStatus === 'Email sent.' ? 'text-green-600' : 'text-red-600'}`}>{emailStatus}</p>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setEmailCustomer(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={sendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
