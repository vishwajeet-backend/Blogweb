"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Download, Mail, MapPin, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { AdminNavTabs } from '@/components/layout/admin-nav-tabs';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminUserMenu } from '@/components/layout/admin-user-menu';

type DetailResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    createdAt: string;
    emailVerified: boolean;
    subscriptionPlan: string;
    subscriptionStatus: string;
    articles: Array<{
      id: string;
      title: string;
      status: string;
      publishedAt: string | null;
      createdAt: string;
    }>;
  };
  stats: {
    publishedCount: number;
    draftCount: number;
    scheduledCount: number;
  };
  paymentHistory: Array<{
    date: string;
    description: string;
    amount: number;
    status: string;
  }>;
  loginHistory: Array<{
    event: string;
    ipAddress: string;
    location: string;
    date: string;
    current: boolean;
    level: string;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUserDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=/admin/users/${params.id}`);
  }, [loading, user, router, params.id]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [loading, user, router]);

  const fetchDetail = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await fetch(`/api/admin/users/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch user details');
      setData(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user details');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchDetail();
  }, [user, params.id]);

  const runUserModerationAction = async (action: 'SUSPEND' | 'UNSUSPEND' | 'ARCHIVE_CONTENT' | 'REMOVE_CONTENT') => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      setActionBusy(action);

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Action failed');
      }

      toast.success(json.message || 'Action completed');
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setActionBusy(null);
    }
  };

  const initials = useMemo(() => {
    const name = data?.user.name || 'JD';
    return name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  }, [data]);

  if (loading || !user) return <div className="p-8 text-sm text-[#57534D]">Loading user profile...</div>;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'Satoshi, var(--font-geist-sans), sans-serif' }}>
      <header className="border-b border-[#E9E9E9] bg-white px-3 py-3 sm:px-4">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-[22px] font-black uppercase tracking-[-0.04em] text-[#FB6503] sm:text-[26px] md:text-[34px]">LOGOIPSUM</p>
            <span className="hidden rounded-full bg-[#F3F0EA] px-2 py-1 text-[10px] font-bold text-[#57534D] sm:inline-flex">ADMIN PANEL</span>
          </div>
          <div className="flex items-center gap-2 text-[#6A6A6A] sm:gap-3">
            <button onClick={() => router.push('/admin/users')} className="hidden text-sm sm:block">Back to User Management</button>
            <NotificationBell />
            <AdminUserMenu name={user.name} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1220px] px-3 py-5 sm:px-4 md:px-6">
        <AdminNavTabs />
        {error && <div className="mb-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</div>}

        {loadingData || !data ? (
          <div className="text-sm text-[#6A6A6A]">Loading profile data...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.user.avatar ? (
                  <img src={data.user.avatar} alt={data.user.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5E7EB] text-[31px] font-medium text-[#4B5563]">{initials}</div>
                )}
                <div>
                  <h1 className="text-[30px] font-bold text-[#1E1E1E] sm:text-[34px] md:text-[39px]">{data.user.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-[14px] text-[#6A6A6A] sm:gap-3 sm:text-[16px]">
                    <span className="inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> ID: {data.user.id.slice(0, 8)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> New York, USA</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <a href={`mailto:${data.user.email}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] border border-[#D6D3D1] bg-white px-3 py-2 text-[14px] text-[#44403B] sm:flex-none sm:text-[16px]"><Mail className="h-4 w-4" />Email User</a>
                <button className="flex-1 rounded-[8px] bg-[#FB6503] px-3 py-2 text-[14px] text-white sm:flex-none sm:text-[16px]">Edit Profile</button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.9fr]">
              <div className="space-y-4">
                <section className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
                  <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">User Information</h3>
                  <div className="mt-3 space-y-3 text-[14px] text-[#44403B] sm:text-[16px]">
                    <div>
                      <p className="text-[10px] uppercase text-[#999999]">Email Address</p>
                      <p className="inline-flex items-center gap-1">{data.user.email}<Copy className="h-3.5 w-3.5 text-[#9CA3AF]" /></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#999999]">Signup Date</p>
                      <p>{formatDate(data.user.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[#999999]">Last Active</p>
                      <p>2 hours ago</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[10px] border border-[#E9E9E9] bg-white p-4">
                  <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">Account Status</h3>
                  <div className="mt-3 text-[14px] text-[#44403B] sm:text-[16px]">
                    <p className="text-[10px] uppercase text-[#999999]">Current Plan</p>
                    <div className="flex items-center justify-between">
                      <p>{data.user.subscriptionPlan}</p>
                      <span className="rounded bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-bold text-[#16A34A]">{data.user.subscriptionStatus}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="rounded border border-[#E5E7EB] py-2 text-sm">Change Plan</button>
                    <button className="rounded border border-[#E5E7EB] py-2 text-sm">Pause Sub</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button className="w-full rounded bg-[#FB6503] py-2 text-sm text-white">Reset Password</button>
                    <button
                      onClick={() => runUserModerationAction(data.user.subscriptionStatus === 'CANCELLED' ? 'UNSUSPEND' : 'SUSPEND')}
                      disabled={actionBusy !== null}
                      className="w-full rounded bg-[#DC2626] py-2 text-sm text-white disabled:opacity-60"
                    >
                      {actionBusy === 'SUSPEND' || actionBusy === 'UNSUSPEND'
                        ? 'Processing...'
                        : data.user.subscriptionStatus === 'CANCELLED'
                          ? 'Unsuspend Publisher'
                          : 'Suspend Publisher'}
                    </button>
                    <button
                      onClick={() => runUserModerationAction('ARCHIVE_CONTENT')}
                      disabled={actionBusy !== null}
                      className="inline-flex w-full items-center justify-center gap-1 rounded border border-[#FDBA74] py-2 text-sm text-[#C2410C] disabled:opacity-60"
                    >
                      Archive All Blogs
                    </button>
                    <button
                      onClick={() => runUserModerationAction('REMOVE_CONTENT')}
                      disabled={actionBusy !== null}
                      className="inline-flex w-full items-center justify-center gap-1 rounded border border-[#FCA5A5] py-2 text-sm text-[#DC2626] disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />Remove All Blogs
                    </button>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <StatCard label="Published Articles" value={data.stats.publishedCount} />
                  <StatCard label="Drafts" value={data.stats.draftCount} />
                  <StatCard label="Scheduled" value={data.stats.scheduledCount} />
                </div>

                <section className="rounded-[10px] border border-[#E9E9E9] bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <h3 className="text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">Payment History</h3>
                    <button className="text-sm text-[#6A6A6A]"><Download className="mr-1 inline h-4 w-4" />Download Statement</button>
                  </div>
                  <div className="hidden grid-cols-[0.9fr_1.6fr_0.8fr_0.8fr] border-t border-[#F3F4F6] px-4 py-2 text-[10px] font-bold uppercase text-[#999999] md:grid">
                    <p>Date</p><p>Description</p><p>Amount</p><p>Status</p>
                  </div>
                  <div className="md:hidden">
                    {data.paymentHistory.map((row, idx) => (
                      <div key={idx} className="border-t border-[#F7F7F7] px-4 py-3 text-[14px]">
                        <p className="font-semibold text-[#44403B]">{row.description}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[#6B7280]">{formatDate(row.date)}</p>
                          <p className="text-[#44403B]">₹{row.amount.toLocaleString('en-IN')}</p>
                        </div>
                        <p className={`mt-1 text-right ${row.status === 'PAID' ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>{row.status}</p>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    {data.paymentHistory.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[0.9fr_1.6fr_0.8fr_0.8fr] border-t border-[#F7F7F7] px-4 py-3 text-[16px]">
                        <p className="text-[#6B7280]">{formatDate(row.date)}</p>
                        <p className="text-[#44403B]">{row.description}</p>
                        <p className="text-[#44403B]">₹{row.amount.toLocaleString('en-IN')}</p>
                        <p className={row.status === 'PAID' ? 'text-[#16A34A]' : 'text-[#E11D48]'}>{row.status}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[10px] border border-[#E9E9E9] bg-white">
                  <h3 className="px-4 py-3 text-[24px] font-medium text-[#1E1E1E] sm:text-[31px]">Recent Login History</h3>
                  {data.loginHistory.map((log, idx) => (
                    <div key={idx} className="grid grid-cols-[1.4fr_0.8fr] border-t border-[#F3F4F6] px-4 py-3 text-[14px] sm:text-[16px]">
                      <div>
                        <p className={log.level === 'OK' ? 'text-[#1E1E1E]' : 'text-[#DC2626]'}>{log.event}</p>
                        <p className="text-[#6A6A6A]">{log.ipAddress} • {log.location}</p>
                      </div>
                      <div className="text-right">
                        <p className={log.current ? 'text-[#16A34A]' : 'text-[#6A6A6A]'}>{log.current ? 'Current Session' : formatDate(log.date)}</p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-[#E9E9E9] bg-white p-4 text-center">
      <p className="text-[28px] font-medium text-[#1E1E1E] sm:text-[31px]">{value}</p>
      <p className="text-[14px] text-[#6A6A6A] sm:text-[16px]">{label}</p>
      <p className="mt-1 text-[12px] text-[#9CA3AF]">View All +</p>
    </div>
  );
}
