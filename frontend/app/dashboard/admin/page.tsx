"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"

type OverviewResponse = {
  metrics: {
    totalUsers: number
    totalArticles: number
    estimatedRevenue: number
    activeSubs: number
    systemHealth: number
  }
  users: Array<{
    id: string
    name: string
    email: string
    avatar: string | null
    plan: string
    status: string
    articlesCount: number
  }>
  queueItems: Array<{
    id: string
    title: string
    status: string
    reason: string
    detail: string
    age: string
    clicks: number
    comments: number
    engagement: number
    views: number
  }>
  transactions: Array<{
    id: string
    userName: string
    amount: number
    status: string
    action: string
  }>
  systemStatus: Array<{
    name: string
    status: string
    latency: string
    level: "ok" | "warn" | string
  }>
}

function statusPill(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-[#D1FAE5] text-[#16A34A]",
    PENDING: "bg-[#FEF3C7] text-[#D97706]",
    SUSPENDED: "bg-[#FEE2E2] text-[#DC2626]",
    PAID: "text-[#16A34A]",
    FAILED: "text-[#E11D48]",
  }
  return map[status] || "bg-[#F3F4F6] text-[#6B7280]"
}

function formatMoneyInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

export default function DashboardAdminOverviewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<OverviewResponse | null>(null)
  const [search, setSearch] = useState("")
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  const loadOverview = async () => {
    try {
      setLoadingData(true)
      setError(null)
      const token = localStorage.getItem("accessToken")
      if (!token) return

      const response = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || "Failed to load admin overview")
      setData(json.data)
    } catch (err: any) {
      setError(err?.message || "Failed to load admin overview")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return
    loadOverview()
  }, [user])

  const filteredUsers = useMemo(() => {
    const users = data?.users || []
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [data, search])

  if (loading || !user || loadingData) return <div className="p-6 text-sm text-[#57534D]">Loading admin overview...</div>
  if (user.role !== "ADMIN") return <div className="p-6 text-sm text-[#57534D]">Admin access required.</div>

  return (
    <div className="min-h-full bg-[#FAF9F6]" style={{ fontFamily: "Satoshi, var(--font-geist-sans), sans-serif" }}>
      <main className="mx-auto max-w-[1220px] px-3 py-5 sm:px-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold text-[#1E1E1E] sm:text-[32px] md:text-[39px]">Admin Overview</h1>
            <p className="mt-1 text-[14px] font-medium text-[#6A6A6A] sm:text-[16px]">System metrics and platform management.</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button className="flex items-center gap-2 rounded-[8px] border border-[#D6D3D1] bg-white px-3 py-2 text-[13px] font-medium text-[#44403B] sm:text-[14px]">
              <Download className="h-4 w-4" /> Export Report
            </button>
            <button onClick={loadOverview} className="flex items-center gap-2 rounded-[8px] bg-[#FB6503] px-3 py-2 text-[13px] font-medium text-white sm:text-[14px]">
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Total Users" value={data?.metrics.totalUsers ?? 0} sub={`${(data?.users || []).filter((u) => u.status === "ACTIVE").length} active`} icon={<Users className="h-4 w-4 text-[#2563EB]" />} iconBg="bg-[#DBEAFE]" trendTone="up" />
          <MetricCard title="Total Articles" value={data?.metrics.totalArticles ?? 0} sub={`${data?.queueItems.length || 0} in queue`} icon={<FileText className="h-4 w-4 text-[#7C3AED]" />} iconBg="bg-[#F3E8FF]" trendTone="up" />
          <MetricCard title="Total Revenue" value={formatMoneyInr(data?.metrics.estimatedRevenue ?? 0)} sub={`${(data?.transactions || []).filter((t) => t.status === "PAID").length} paid`} icon={<CreditCard className="h-4 w-4 text-[#16A34A]" />} iconBg="bg-[#D1FAE5]" trendTone="up" />
          <MetricCard title="Active Subs" value={data?.metrics.activeSubs ?? 0} sub="Live billing" icon={<CreditCard className="h-4 w-4 text-[#EA580C]" />} iconBg="bg-[#FFEDD5]" trendTone="down" />
          <MetricCard title="System Health" value={`${data?.metrics.systemHealth ?? 99.9}%`} sub={`${(data?.systemStatus || []).filter((s) => s.level === "warn").length} warnings`} icon={<ShieldCheck className="h-4 w-4 text-[#0891B2]" />} iconBg="bg-[#CFFAFE]" trendTone="down" />
        </div>

        {error && <div className="mt-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</div>}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_0.9fr]">
          <section className="rounded-[10px] border border-[#E9E9E9] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <h2 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[28px] md:text-[31px]">User Management</h2>
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded-[8px] border border-[#E9E9E9] px-3 py-2">
                  <Search className="h-4 w-4 text-[#9CA3AF]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full min-w-0 bg-transparent text-sm outline-none sm:w-36 md:w-40" />
                </div>
                <button className="rounded-[8px] border border-[#E9E9E9] px-3 py-2 text-sm text-[#6A6A6A]">All Status</button>
              </div>
            </div>

            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr] border-t border-[#F3F4F6] px-4 py-2 text-[10px] font-bold uppercase text-[#999999] md:grid">
              <p>User</p><p>Plan</p><p>Status</p><p>Actions</p>
            </div>

            {filteredUsers.map((u) => (
              <div key={u.id} className="border-t border-[#F7F7F7] px-4 py-3">
                <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr] items-center md:grid">
                  <button onClick={() => router.push(`/admin/users/${u.id}`)} className="flex items-center gap-2 text-left">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold">{u.name.slice(0, 2).toUpperCase()}</div>}
                    <div>
                      <p className="text-[16px] font-medium text-[#1E1E1E]">{u.name}</p>
                      <p className="text-[10px] text-[#999999]">{u.email}</p>
                    </div>
                  </button>
                  <p className="text-[16px] text-[#44403B]">{u.plan}</p>
                  <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill(u.status)}`}>{u.status}</span>
                  <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-sm text-[#1E40AF] underline underline-offset-2">View</button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">Content Queue</h3>
                <span className="rounded bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">{(data?.queueItems.length || 0)} Urgent</span>
              </div>
            </div>
            <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
              <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">System Status</h3>
              <div className="mt-3 space-y-3">
                {data?.systemStatus.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-[16px]">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.level === "warn" ? "bg-[#F59E0B]" : "bg-[#10B981]"}`} />
                      <span className="text-[#44403B]">{s.name}</span>
                    </div>
                    <span className={s.level === "warn" ? "text-[#EA580C]" : "text-[#6A6A6A]"}>{s.status}{s.latency !== "-" ? ` - ${s.latency}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  iconBg,
  trendTone = "up",
}: {
  title: string
  value: string | number
  sub: string
  icon: React.ReactNode
  iconBg: string
  trendTone?: "up" | "down"
}) {
  return (
    <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase text-[#999999]">{title}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>{icon}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-[28px] font-medium text-[#1E1E1E] sm:text-[31px]">{value}</p>
        <p className={`pb-1 text-[10px] font-bold ${trendTone === "up" ? "text-[#16A34A]" : "text-[#E11D48]"}`}>{sub}</p>
      </div>
    </div>
  )
}
