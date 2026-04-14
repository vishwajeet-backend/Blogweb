"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Download, FileText, Loader2, RefreshCw, Search, Settings, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { AdminNavTabs } from '@/components/layout/admin-nav-tabs';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminUserMenu } from '@/components/layout/admin-user-menu';

type OverviewResponse = {
  metrics: {
    totalUsers: number;
    totalArticles: number;
    estimatedRevenue: number;
    activeSubs: number;
    systemHealth: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    plan: string;
    status: string;
    articlesCount: number;
  }>;
  queueItems: Array<{
    id: string;
    title: string;
    status: string;
    reason: string;
    detail: string;
    age: string;
    clicks: number;
    comments: number;
    engagement: number;
    views: number;
  }>;
  transactions: Array<{
    id: string;
    userName: string;
    amount: number;
    status: string;
    action: string;
  }>;
  systemStatus: Array<{
    name: string;
    status: string;
    latency: string;
    level: 'ok' | 'warn' | string;
  }>;
};

function statusPill(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-[#D1FAE5] text-[#16A34A]',
    PENDING: 'bg-[#FEF3C7] text-[#D97706]',
    SUSPENDED: 'bg-[#FEE2E2] text-[#DC2626]',
    PAID: 'text-[#16A34A]',
    FAILED: 'text-[#E11D48]',
  };
  return map[status] || 'bg-[#F3F4F6] text-[#6B7280]';
}

function formatMoneyInr(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function AdminUsersIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<OverviewResponse | null>(null);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/admin/users');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [loading, user, router]);

  const loadOverview = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load admin overview');
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin overview');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    loadOverview();
  }, [user]);

  const filteredUsers = useMemo(() => {
    const users = data?.users || [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [data, search]);

  if (loading || !user) return <div className="p-8 text-sm text-[#57534D]">Loading users...</div>;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'Satoshi, var(--font-geist-sans), sans-serif' }}>
      <header className="border-b border-[#E9E9E9] bg-white/90 px-3 py-3 sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-3">
            <p className="text-[22px] font-black uppercase tracking-[-0.04em] text-[#FB6503] sm:text-[26px] md:text-[34px]">LOGOIPSUM</p>
            <span className="hidden rounded-full bg-[#F3F0EA] px-2 py-1 text-[10px] font-bold text-[#57534D] sm:inline-flex">ADMIN PANEL</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[#6A6A6A] sm:gap-3">
            <NotificationBell />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5E7EB] text-xs font-bold">{user.name.slice(0, 2).toUpperCase()}</div>
            <AdminUserMenu name={user.name} />
            <button onClick={() => router.push('/admin/settings')} aria-label="Open settings" className="hidden sm:block">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1220px] px-3 py-5 sm:px-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold text-[#1E1E1E] sm:text-[32px] md:text-[39px]">Admin Overview</h1>
            <p className="mt-1 text-[14px] font-medium text-[#6A6A6A] sm:text-[16px]">System metrics and platform management.</p>
            <AdminNavTabs />
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button className="flex items-center gap-2 rounded-[8px] border border-[#D6D3D1] bg-white px-3 py-2 text-[13px] font-medium text-[#44403B] sm:text-[14px] md:text-[16px]">
              <Download className="h-4 w-4" /> Export Report
            </button>
            <button onClick={loadOverview} className="flex items-center gap-2 rounded-[8px] bg-[#FB6503] px-3 py-2 text-[13px] font-medium text-white sm:text-[14px] md:text-[16px]">
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Total Users" value={data?.metrics.totalUsers ?? 0} sub={`${(data?.users || []).filter((u) => u.status === 'ACTIVE').length} active`} icon={<Users className="h-4 w-4 text-[#2563EB]" />} iconBg="bg-[#DBEAFE]" trendTone="up" />
          <MetricCard title="Total Articles" value={data?.metrics.totalArticles ?? 0} sub={`${data?.queueItems.length || 0} in queue`} icon={<FileText className="h-4 w-4 text-[#7C3AED]" />} iconBg="bg-[#F3E8FF]" trendTone="up" />
          <MetricCard title="Total Revenue" value={formatMoneyInr(data?.metrics.estimatedRevenue ?? 0)} sub={`${(data?.transactions || []).filter((t) => t.status === 'PAID').length} paid`} icon={<CreditCard className="h-4 w-4 text-[#16A34A]" />} iconBg="bg-[#D1FAE5]" trendTone="up" />
          <MetricCard title="Active Subs" value={data?.metrics.activeSubs ?? 0} sub="Live billing" icon={<CreditCard className="h-4 w-4 text-[#EA580C]" />} iconBg="bg-[#FFEDD5]" trendTone="down" />
          <MetricCard title="System Health" value={`${data?.metrics.systemHealth ?? 99.9}%`} sub={`${(data?.systemStatus || []).filter((s) => s.level === 'warn').length} warnings`} icon={<ShieldCheck className="h-4 w-4 text-[#0891B2]" />} iconBg="bg-[#CFFAFE]" trendTone="down" />
        </div>

        {error && <div className="mt-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</div>}

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_0.9fr]">
          <section className="rounded-[10px] border border-[#E9E9E9] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <h2 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[28px] md:text-[31px]">User Management</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-[8px] border border-[#E9E9E9] px-3 py-2">
                  <Search className="h-4 w-4 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-28 bg-transparent text-sm outline-none sm:w-36 md:w-40"
                  />
                </div>
                <button className="rounded-[8px] border border-[#E9E9E9] px-3 py-2 text-sm text-[#6A6A6A]">All Status</button>
              </div>
            </div>

            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr] border-t border-[#F3F4F6] px-4 py-2 text-[10px] font-bold uppercase text-[#999999] md:grid">
              <p>User</p><p>Plan</p><p>Status</p><p>Actions</p>
            </div>

            {loadingData ? (
              <div className="px-4 py-8 text-sm text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-4 py-8 text-sm text-[#6A6A6A]">No users found.</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.id} className="border-t border-[#F7F7F7] px-4 py-3">
                  <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr] items-center md:grid">
                    <button onClick={() => router.push(`/admin/users/${u.id}`)} className="flex items-center gap-2 text-left">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold">{u.name.slice(0, 2).toUpperCase()}</div>
                      )}
                      <div>
                        <p className="text-[16px] font-medium text-[#1E1E1E]">{u.name}</p>
                        <p className="text-[10px] text-[#999999]">{u.email}</p>
                      </div>
                    </button>
                    <p className="text-[16px] text-[#44403B]">{u.plan}</p>
                    <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill(u.status)}`}>{u.status}</span>
                    <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-sm text-[#1E40AF] underline underline-offset-2">View</button>
                  </div>

                  <div className="space-y-1 md:hidden">
                    <p className="text-[16px] font-medium text-[#1E1E1E]">{u.name}</p>
                    <p className="text-[12px] text-[#6A6A6A]">{u.email}</p>
                    <p className="text-[12px] text-[#6A6A6A]">Plan: {u.plan} · Posts: {u.articlesCount}</p>
                    <div className="flex items-center justify-between">
                      <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill(u.status)}`}>{u.status}</span>
                      <button onClick={() => router.push(`/admin/users/${u.id}`)} className="text-sm text-[#1E40AF] underline underline-offset-2">View</button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="border-t border-[#F3F4F6] px-4 py-3 text-[10px] text-[#6A6A6A]">
              Showing 1-{filteredUsers.length} of {data?.metrics.totalUsers ?? 0}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">Content Queue</h3>
                <span className="rounded bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">{(data?.queueItems.length || 0)} Urgent</span>
              </div>
              <div className="mt-3 space-y-3">
                {data?.queueItems.map((q) => (
                  <div key={q.id} className="rounded border border-[#F3F4F6] bg-[#FAFAFA] p-3">
                    <p className={`text-[10px] font-bold ${q.status === 'SCHEDULED' ? 'text-[#EA580C]' : 'text-[#E11D48]'}`}>{q.reason}</p>
                    <p className="mt-1 text-[16px] font-bold text-[#1E1E1E] line-clamp-1">"{q.title}"</p>
                    <p className="mt-1 text-[10px] text-[#6A6A6A] line-clamp-2">{q.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#57534D]">
                      <span className="rounded bg-white px-2 py-1">Views: {q.views}</span>
                      <span className="rounded bg-white px-2 py-1">Clicks: {q.clicks}</span>
                      <span className="rounded bg-white px-2 py-1">Comments: {q.comments}</span>
                      <span className="rounded bg-white px-2 py-1">Engagement: {q.engagement}</span>
                      <span className="rounded bg-white px-2 py-1">{q.age}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => router.push(`/admin/moderation?search=${encodeURIComponent(q.title)}`)} className="flex-1 rounded border border-[#E5E7EB] bg-white py-1.5 text-[10px] font-bold text-[#6B7280]">Review</button>
                      <button onClick={() => router.push(`/admin/moderation?search=${encodeURIComponent(q.title)}`)} className={`flex-1 rounded py-1.5 text-[10px] font-bold text-white ${q.status === 'SCHEDULED' ? 'bg-[#FB6503]' : 'bg-[#E11D48]'}`}>Open Moderation</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
              <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">System Status</h3>
              <div className="mt-3 space-y-3">
                {data?.systemStatus.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-[16px]">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.level === 'warn' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
                      <span className="text-[#44403B]">{s.name}</span>
                    </div>
                    <span className={s.level === 'warn' ? 'text-[#EA580C]' : 'text-[#6A6A6A]'}>{s.status}{s.latency !== '-' ? ` · ${s.latency}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-[10px] border border-[#E9E9E9] bg-white">
          <h3 className="px-4 py-3 text-[24px] font-medium text-[#1E1E1E] sm:text-[28px] md:text-[31px]">Recent Transactions</h3>
          <div className="hidden grid-cols-[0.8fr_1.2fr_0.8fr_0.8fr_0.6fr] border-t border-[#F3F4F6] px-4 py-2 text-[10px] font-bold uppercase text-[#999999] md:grid">
            <p>ID</p><p>User</p><p>Amount</p><p>Status</p><p>Action</p>
          </div>
          {data?.transactions.map((t) => (
            <div key={t.id} className="border-t border-[#F7F7F7] px-4 py-3 md:grid md:grid-cols-[0.8fr_1.2fr_0.8fr_0.8fr_0.6fr] md:text-[16px]">
              <p className="text-[#9CA3AF]">{t.id}</p>
              <p className="text-[#44403B]">{t.userName}</p>
              <p className="text-[#44403B]">{formatMoneyInr(t.amount)}</p>
              <p className={t.status === 'PAID' ? 'text-[#16A34A]' : 'text-[#E11D48]'}>{t.status}</p>
              <p className="text-[#6A6A6A]">{t.action}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-8 border-t border-[#FECFB1] bg-[#FECFB1] px-3 py-2 text-[10px] text-[#44403B] sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-1.5">
          <span>PUBLIShique Admin © 2026. Authenticated as Super Admin.</span>
          <span>System Logs · Support · v2.4.0</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon,
  iconBg,
  trendTone = 'up',
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  trendTone?: 'up' | 'down';
}) {
  return (
    <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase text-[#999999]">{title}</p>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>{icon}</span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-[28px] font-medium text-[#1E1E1E] sm:text-[31px]">{value}</p>
        <p className={`pb-1 text-[10px] font-bold ${trendTone === 'up' ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>{sub}</p>
      </div>
    </div>
  );
}
