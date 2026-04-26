"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { AdminNavTabs } from '@/components/layout/admin-nav-tabs';

type ModerationListItem = {
  id: string;
  title: string;
  status: string;
  excerpt: string | null;
  featuredImage: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
};

type ModerationDetail = {
  article: {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    featuredImage?: string | null;
    coverImage?: string | null;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  };
  caseNumber: string;
  flag: {
    reason: string;
    reportedBy: string;
    date: string;
    status: string;
  };
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function resolveImageUrl(value: string | null | undefined) {
  if (!value) return null;
  const raw = value.trim();
  if (!raw || raw === 'null' || raw === 'undefined') return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;
  return null;
}

function stripHtml(raw: string) {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function AdminModerationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedArticleId = searchParams.get('id');
  const embedded = searchParams.get('embedded') === '1';
  const toEmbedded = (path: string) => (embedded ? `${path}${path.includes('?') ? '&' : '?'}embedded=1` : path);

  const [cases, setCases] = useState<ModerationListItem[]>([]);
  const [detail, setDetail] = useState<ModerationDetail | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/admin/moderation');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [loading, user, router]);

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/admin/moderation?page=1&limit=20&status=PENDING', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch moderation cases');

      const nextCases = (json.data?.articles || []) as ModerationListItem[];
      setCases(nextCases);

      if (!selectedArticleId && nextCases.length > 0) {
        router.replace(toEmbedded(`/admin/moderation?id=${nextCases[0].id}`));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch moderation cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchModerationDetail = async (articleId: string) => {
    try {
      setLoadingDetail(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/admin/moderation/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch moderation case');
      setDetail(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch moderation case');
    } finally {
      setLoadingDetail(false);
    }
  };

  const moderateRow = async (articleId: string, action: 'APPROVE' | 'WARN' | 'REMOVE' | 'SUSPEND') => {
    try {
      setActionBusy(action);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const response = await fetch(`/api/admin/moderation/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          note:
            adminNote.trim() ||
            (action === 'WARN' ? 'Warning issued from moderation page' : 'Action executed from moderation page'),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Moderation action failed');

      await fetchCases();
      await fetchModerationDetail(articleId);
    } catch (err: any) {
      setError(err?.message || 'Moderation action failed');
    } finally {
      setActionBusy(null);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchCases();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN' || !selectedArticleId) {
      setDetail(null);
      return;
    }
    fetchModerationDetail(selectedArticleId);
  }, [selectedArticleId, user]);

  if (loading || !user) return <div className="p-8 text-sm text-[#57534D]">Loading moderation...</div>;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#FFFEFD] px-4 py-6 md:px-6 lg:px-8" style={{ fontFamily: 'Satoshi, var(--font-geist-sans), sans-serif' }}>
      <div className="mx-auto max-w-[1220px]">
        {!embedded && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4] pb-3">
          <p className="text-[22px] font-bold text-[#1C1917]">Admin Panel</p>
        </div>}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#A6A09B]">
              Content Moderation List {detail ? `› Case ${detail.caseNumber}` : ''}
            </p>
            <h1 className="text-[22px] font-bold text-[#292524] sm:text-[25px]">Content Moderation Details</h1>
            <p className="text-[13px] text-[#79716B]">Reviewing flagged content.</p>
            {!embedded && <AdminNavTabs />}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {detail ? <span className="rounded px-2 py-1 text-[10px] font-bold text-[#57534D]">Case #{detail.caseNumber}</span> : null}
            <button
              onClick={() => router.push(toEmbedded('/admin/articles'))}
              className="rounded-full border border-[#FB6503] bg-[#FFFEFD] px-5 py-2 text-[10px] font-bold text-[#57534D] shadow-sm"
            >
              Back to List
            </button>
          </div>
        </div>

        {error && <div className="mt-4 rounded border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</div>}

        {loadingCases ? (
          <div className="mt-6 text-sm text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading moderation cases...</div>
        ) : cases.length === 0 ? (
          <div className="mt-6 rounded-[14px] border border-[#F5F5F4] bg-white p-5 text-[13px] text-[#79716B]">No moderation cases available.</div>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.9fr_0.95fr]">
            <div className="overflow-hidden rounded-[14px] border border-[#F5F5F4] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between border-b border-[#FAFAF9] px-4 py-3">
                <p className="text-[13px] font-bold text-[#44403B]">Content Preview</p>
                <span className="rounded-full border border-[#FFE2E2] bg-[#FEF2F2] px-2 py-1 text-[10px] font-bold text-[#E7000B]">Flagged</span>
              </div>

              {loadingDetail ? (
                <div className="px-5 py-10 text-sm text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading case detail...</div>
              ) : !detail ? (
                <div className="px-5 py-8 text-sm text-[#6A6A6A]">Select a case from below to review details.</div>
              ) : (
                <>
                  {resolveImageUrl(detail.article.coverImage || detail.article.featuredImage) ? (
                    <img
                      src={resolveImageUrl(detail.article.coverImage || detail.article.featuredImage) || ''}
                      alt={detail.article.title}
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="h-64 w-full bg-[#F5F5F4]" />
                  )}

                  <div className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      {detail.article.user.avatar ? (
                        <img src={detail.article.user.avatar} alt={detail.article.user.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#4B5563]">
                          {detail.article.user.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[16px] font-bold text-[#292524]">{detail.article.user.name}</p>
                        <p className="text-[10px] font-bold uppercase text-[#A6A09B]">
                          {detail.article.user.email} • {formatDate(detail.article.publishedAt || detail.article.createdAt)}
                        </p>
                      </div>
                    </div>

                    <h2 className="text-[20px] font-bold text-[#1C1917]">{detail.article.title}</h2>
                    <p className="text-[13px] text-[#79716B] line-clamp-2">{detail.article.excerpt || 'No excerpt available'}</p>
                    <p className="text-[13px] text-[#79716B] line-clamp-6">{stripHtml(detail.article.content).slice(0, 560)}</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-[10px] bg-[#FFF0E6] p-4">
                <h3 className="text-[24px] font-medium text-[#292524] sm:text-[31px]">Flag Details</h3>
                {detail ? (
                  <div className="mt-3 rounded border border-[#E7E5E4] bg-white">
                    <DetailRow label="REASON" value={detail.flag.reason} />
                    <DetailRow label="REPORTED BY" value={detail.flag.reportedBy} />
                    <DetailRow label="DATE" value={formatDate(detail.flag.date)} />
                    <div className="flex items-center justify-between px-3 py-3">
                      <span className="text-[10px] font-bold text-[#A6A09B]">STATUS</span>
                      <span className="text-[10px] font-bold text-[#FF6900]">{detail.flag.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded border border-[#E7E5E4] bg-white px-3 py-3 text-[13px] text-[#79716B]">No case selected.</div>
                )}
              </div>

              <div className="rounded-[14px] border border-[#F5F5F4] bg-white p-4 shadow-sm">
                <h3 className="text-[24px] font-medium text-[#292524] sm:text-[31px]">Moderation Actions</h3>
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => detail && moderateRow(detail.article.id, 'REMOVE')}
                    disabled={!detail || actionBusy !== null}
                    className="w-full rounded bg-gradient-to-b from-[#FB6503] to-[#FC9856] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-60"
                  >
                    {actionBusy === 'REMOVE' ? 'Processing...' : 'Remove Content'}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => detail && moderateRow(detail.article.id, 'APPROVE')}
                      disabled={!detail || actionBusy !== null}
                      className="rounded border border-[#B9F8CF] px-2 py-2 text-[10px] font-bold text-[#008236] disabled:opacity-60"
                    >
                      {actionBusy === 'APPROVE' ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => detail && moderateRow(detail.article.id, 'WARN')}
                      disabled={!detail || actionBusy !== null}
                      className="rounded border border-[#FFD6A7] px-2 py-2 text-[10px] font-bold text-[#F54900] disabled:opacity-60"
                    >
                      {actionBusy === 'WARN' ? '...' : 'Warn User'}
                    </button>
                  </div>
                  <button
                    onClick={() => detail && moderateRow(detail.article.id, 'SUSPEND')}
                    disabled={!detail || actionBusy !== null}
                    className="w-full rounded border border-[#FCA5A5] px-2 py-2 text-[10px] font-bold text-[#B91C1C] disabled:opacity-60 sm:hidden"
                  >
                    {actionBusy === 'SUSPEND' ? '...' : 'Suspend Publisher'}
                  </button>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#F5F5F4] bg-white p-4 shadow-sm">
                <p className="text-[13px] text-[#44403B]">Additional Notes</p>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add internal notes about this case..."
                  className="mt-3 h-28 w-full resize-none rounded border border-[#F5F5F4] bg-[#FAFAF9] p-3 text-[13px] text-[#44403B] outline-none"
                />
              </div>

              <div className="rounded-[14px] border border-[#F5F5F4] bg-white p-4">
                <p className="text-[10px] font-bold uppercase text-[#A6A09B]">Moderation Cases</p>
                <div className="mt-3 space-y-2">
                  {cases.map((item) => {
                    const active = item.id === selectedArticleId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => router.push(toEmbedded(`/admin/moderation?id=${item.id}`))}
                        className={`w-full rounded border px-3 py-2 text-left ${
                          active
                            ? 'border-[#FB6503] bg-[#FFF7F2]'
                            : 'border-[#E7E5E4] bg-white hover:bg-[#FAFAF9]'
                        }`}
                      >
                        <p className="line-clamp-1 text-[13px] font-bold text-[#292524]">{item.title}</p>
                        <p className="text-[10px] uppercase text-[#A6A09B]">{item.user.name} • {formatDate(item.updatedAt)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#F5F5F4] px-3 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] font-bold text-[#A6A09B]">{label}</span>
      <span className="break-words text-[13px] text-[#292524] sm:text-right">{value}</span>
    </div>
  );
}