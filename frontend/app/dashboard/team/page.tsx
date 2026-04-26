"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  Mail,
  CheckCircle,
  Clock,
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Invitation {
  id: string
  role: string
  status: string
  invitedAt: string
  joinedAt?: string
  article: {
    id: string
    title: string
    excerpt?: string
    status: string
    createdAt: string
    user: User
  }
}

export default function TeamPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all')

  useEffect(() => { fetchInvitations() }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/collaboration/my-invitations', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId: string) => {
    try {
      const response = await fetch('/api/collaboration/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ collaboratorId: invitationId }),
      })
      if (response.ok) fetchInvitations()
    } catch (error) { console.error(error) }
  }

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === 'all') return true
    if (filter === 'pending') return inv.status === 'PENDING'
    if (filter === 'accepted') return inv.status === 'ACCEPTED'
    return true
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF7A33]" />
      </div>
    )
  }

  return (
    <div className="pb-12 sm:pb-16">
      <section
        className="bg-cover bg-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.40), rgba(255, 255, 255, 0.40)), url("/design/BG%2023-01%202.png")',
        }}
      >
        <div className="mx-auto max-w-[1100px]">
          <h1 className="text-[30px] font-extrabold leading-tight text-[#1a1a1a] sm:text-[36px] lg:text-[42px]">
            Team{" "}
            <span className="font-serif text-[#666] italic font-light">
              Collaboration
            </span>
          </h1>
          <p className="mt-2 text-sm font-medium text-[#666] sm:text-[15px]">
            Manage access and collaborate on shared articles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 pt-5 sm:px-6 sm:pt-8 lg:px-10">
        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {[
            { label: 'Total Invitations', val: invitations.length, icon: <Mail className="h-5 w-5 text-[#FF7A33]" /> },
            { label: 'Pending Access', val: invitations.filter(i => i.status === 'PENDING').length, icon: <Clock className="h-5 w-5 text-[#faad14]" /> },
            { label: 'Joined Articles', val: invitations.filter(i => i.status === 'ACCEPTED').length, icon: <CheckCircle className="h-5 w-5 text-[#22c55e]" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-[#eee] bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.03)] sm:p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[#eee] bg-[#fcfcfc]">
                {s.icon}
              </div>
              <p className="text-[24px] font-extrabold text-[#1a1a1a] sm:text-[28px]">{s.val}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#999]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-3">
          {['all', 'pending', 'accepted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as 'all' | 'pending' | 'accepted')}
              className={`rounded-full px-4 py-2 text-xs font-extrabold capitalize sm:px-5 sm:text-[13px] ${
                filter === f
                  ? 'bg-[#1a1a1a] text-white'
                  : 'border border-[#eee] bg-white text-[#666]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-5">
          {filteredInvitations.map((inv) => (
            <div
              key={inv.id}
              className="rounded-2xl border border-[#eee] bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.03)] sm:rounded-3xl sm:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#eee] bg-[#fcfcfc] text-xl font-extrabold text-[#FF7A33] sm:h-14 sm:w-14">
                  {inv.article.user.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="line-clamp-2 text-base font-extrabold text-[#1a1a1a] sm:text-lg">
                        {inv.article.title}
                      </h3>
                      <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-[10px] font-extrabold text-[#1a1a1a]">
                        {inv.role}
                      </span>
                      {inv.status === 'PENDING' && (
                        <span className="rounded-full bg-[#fff5eb] px-2.5 py-1 text-[10px] font-extrabold text-[#FF7A33]">
                          PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#666]">
                      Shared by{" "}
                      <span className="font-bold text-[#1a1a1a]">
                        {inv.article.user.name}
                      </span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#999]">
                      Invited on {new Date(inv.invitedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  {inv.status === 'PENDING' ? (
                    <button
                      onClick={() => handleAccept(inv.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-xs font-extrabold text-white md:w-auto md:text-[13px]"
                    >
                      <CheckCircle className="h-4 w-4" /> ACCEPT ACCESS
                    </button>
                  ) : (
                    <Link
                      href={`/dashboard/articles/${inv.article.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-[#eee] px-5 py-2.5 text-xs font-extrabold text-[#1a1a1a] md:w-auto md:text-[13px]"
                    >
                      OPEN ARTICLE <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredInvitations.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#ececec] bg-white px-4 py-12 text-center sm:py-16">
              <Users className="mb-5 h-12 w-12 text-[#dedede]" />
              <p className="text-base font-bold text-[#999]">
                No collaboration invitations found.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-[#1a1a1a] p-5 text-white sm:mt-10 sm:p-7 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[620px]">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-[#FF7A33]" />
                <h2 className="text-[24px] font-extrabold leading-tight sm:text-[28px]">
                  Scale with Premium Management
                </h2>
              </div>
              <p className="text-sm leading-7 text-white/75 sm:text-base">
                Invite multiple editors, manage content approval workflows, and
                see real-time updates from your team members as you scale your
                publication reach.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                <div className="flex items-center gap-2 text-xs font-bold sm:text-[13px]"><CheckCircle className="h-3.5 w-3.5 text-[#FF7A33]" /> Role Based Access Control</div>
                <div className="flex items-center gap-2 text-xs font-bold sm:text-[13px]"><CheckCircle className="h-3.5 w-3.5 text-[#FF7A33]" /> Real-time Collaborative Editing</div>
                <div className="flex items-center gap-2 text-xs font-bold sm:text-[13px]"><CheckCircle className="h-3.5 w-3.5 text-[#FF7A33]" /> Content Audit Logs</div>
                <div className="flex items-center gap-2 text-xs font-bold sm:text-[13px]"><CheckCircle className="h-3.5 w-3.5 text-[#FF7A33]" /> Central Billing Management</div>
              </div>
            </div>

            <div className="w-full lg:w-auto">
              <button className="w-full rounded-full bg-[#FF7A33] px-6 py-3 text-xs font-extrabold text-white sm:w-auto sm:px-8 sm:text-[13px]">
                CONTACT FOR ENTERPRISE
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
