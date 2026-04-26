"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Moon, Plus, Search, Sun } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { AdminNavTabs } from '@/components/layout/admin-nav-tabs';
import { NotificationBell } from '@/components/NotificationBell';
import { AdminUserMenu } from '@/components/layout/admin-user-menu';

type AdminArticle = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  excerpt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  publishRecords: Array<{ platform: string }>;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

function statusStyles(status: string) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-[#D1FAE5] text-[#16A34A]',
    DRAFT: 'bg-[#FEF3C7] text-[#B45309]',
    SCHEDULED: 'bg-[#DBEAFE] text-[#2563EB]',
    ARCHIVED: 'bg-[#FEE2E2] text-[#DC2626]',
  };
  return map[status] || 'bg-[#F3F4F6] text-[#6B7280]';
}

const statusOptions = ['ALL', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'ARCHIVED'];
const platformOptions = ['ALL', 'DEVTO', 'HASHNODE', 'GHOST', 'WORDPRESS', 'WIX', 'PUBLISHTYPE'];

export default function AdminArticlesPage() {
  const { user, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const selectedArticleId = searchParams.get('id');
  const embedded = searchParams.get('embedded') === '1';
  const toEmbedded = (path: string) => (embedded ? `${path}${path.includes('?') ? '&' : '?'}embedded=1` : path);
  const isModerationMode = mode === 'moderation';

  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [platform, setPlatform] = useState('ALL');
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<ModerationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/admin/articles');
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') router.replace('/dashboard');
  }, [loading, user, router]);

  const fetchArticles = async (page = 1) => {
    try {
      setLoadingData(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        status,
        platform,
      });
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/admin/articles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch admin articles');

      setArticles(json.data.articles || []);
      setPagination(json.data.pagination || pagination);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin articles');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchArticles(1);
  }, [user, status, platform]);

  useEffect(() => {
    if (!isModerationMode || !selectedArticleId) {
      setDetail(null);
      return;
    }

    if (!user || user.role !== 'ADMIN') return;
    fetchModerationDetail(selectedArticleId);
  }, [isModerationMode, selectedArticleId, user]);

  const moderateRow = async (articleId: string, action: 'ARCHIVE' | 'RESTORE' | 'WARN' | 'APPROVE' | 'REMOVE' | 'SUSPEND') => {
    try {
      setActionBusy(`${articleId}:${action}`);
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
            (action === 'WARN'
              ? 'Warning issued from admin articles table'
              : 'Status updated from admin articles table'),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || `Failed to ${action.toLowerCase()} article`);
      }

      await fetchArticles(pagination.page);
      if (detail?.article.id === articleId) {
        await fetchModerationDetail(articleId);
      }
    } catch (err: any) {
      setError(err?.message || 'Moderation action failed');
    } finally {
      setActionBusy(null);
    }
  };

  const openArticle = (articleId: string) => {
    if (isModerationMode) {
      router.push(toEmbedded(`/admin/moderation?id=${articleId}`));
      return;
    }

    const readUrl = `/blog/${articleId}`;
    const opened = window.open(readUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      router.push(readUrl);
    }
  };

  const fetchModerationDetail = async (articleId: string) => {
    try {
      setLoadingDetail(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`/api/admin/moderation/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch moderation details');
      setDetail(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch moderation details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const visibleRange = useMemo(() => {
    if (!pagination.total) return '0';
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(start + articles.length - 1, pagination.total);
    return `${start} to ${end}`;
  }, [pagination, articles.length]);

  if (loading || !user) return <div className="p-8 text-sm text-[#57534D]">Loading admin articles...</div>;
  if (user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#FFFEFD]" style={{ fontFamily: 'Satoshi, var(--font-geist-sans), sans-serif' }}>
      {!embedded && <header className="border-b border-[#E9E9E9] bg-white px-3 py-3 sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4">
          <Link href="/" className="text-[22px] font-black uppercase tracking-[-0.04em] text-[#FB6503] sm:text-[26px] md:text-[34px]">
            PublishType
          </Link>
          <div className="hidden w-full max-w-[460px] items-center gap-2 rounded-[28px] border border-[#E45C03] px-3 py-2 md:flex">
            <Search className="h-4 w-4 text-[#999999]" />
            <input placeholder="Search Documentation" className="w-full bg-transparent text-[16px] text-[#212121] outline-none" />
          </div>
          <div className="flex items-center gap-3 text-[#212121] md:gap-4">
            <button onClick={toggleTheme}>{isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <NotificationBell />
            <AdminUserMenu name={user.name} />
          </div>
        </div>
      </header>}

      <main className="mx-auto max-w-[1220px] px-3 py-5 sm:px-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[#212121] sm:text-[32px] md:text-[39px]">{isModerationMode ? 'Content Moderation' : 'All Articles'}</h1>
            <p className="mt-1 text-[14px] font-bold text-[#6A6A6A] sm:text-[16px] md:text-[20px]">
              {isModerationMode ? 'Review, warn, archive, restore or remove content.' : 'Manage and moderate content from all publishers.'}
            </p>
            {!embedded && <AdminNavTabs />}
          </div>
          <button
            onClick={() => router.push('/dashboard/articles/new')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#FB6503] px-4 py-2 text-[14px] font-medium text-white sm:w-auto sm:text-[16px]"
          >
            <Plus className="h-4 w-4" /> NEW ARTICLE
          </button>
        </div>

        <section className="mt-5 rounded-[10px] border border-[#E9E9E9] bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#F3F4F6] px-3 py-3 sm:px-4">
            <div className="flex w-full min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-[#E9E9E9] px-3 py-2 sm:min-w-[260px]">
              <Search className="h-4 w-4 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles(1)}
                placeholder="Search by title, keyword..."
                className="w-full bg-transparent text-[14px] text-[#212121] outline-none sm:text-[16px]"
              />
            </div>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-[8px] border border-[#E9E9E9] px-3 py-2 text-[14px] text-[#44403B] sm:w-auto sm:text-[16px]">
              {statusOptions.map((s) => <option key={s} value={s}>Status: {s}</option>)}
            </select>

            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-[8px] border border-[#E9E9E9] px-3 py-2 text-[14px] text-[#44403B] sm:w-auto sm:text-[16px]">
              {platformOptions.map((p) => <option key={p} value={p}>Platform: {p}</option>)}
            </select>

            <button onClick={() => fetchArticles(1)} className="w-full rounded-[8px] bg-[#FB6503] px-3 py-2 text-[14px] text-white sm:w-auto sm:text-[16px]">Apply</button>
          </div>

          {error && <div className="px-4 py-2 text-sm text-[#B91C1C]">{error}</div>}

          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_0.6fr_0.8fr_1fr] px-4 py-3 text-[10px] font-bold uppercase text-[#999999]">
                <p>Article Title</p><p>Status</p><p>Platforms</p><p>Created</p><p>Views</p><p>Publisher</p><p>Actions</p>
              </div>

              {loadingData ? (
                <div className="px-4 py-10 text-center text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading articles...</div>
              ) : (
                articles.map((article) => (
                  <div key={article.id} className="grid grid-cols-[1.7fr_0.8fr_0.8fr_0.8fr_0.6fr_0.8fr_1fr] items-center border-t border-[#F3F4F6] px-4 py-3">
                <div>
                  <p className="text-[18px] font-medium text-[#212121] md:text-[24px] line-clamp-1">{article.title}</p>
                  <p className="text-[10px] text-[#999999]">Last modified: {formatDate(article.updatedAt)}</p>
                </div>
                <span className={`w-fit rounded-full px-2 py-0.5 text-[12px] ${statusStyles(article.status)}`}>{article.status}</span>
                <p className="text-[14px] text-[#44403B] line-clamp-1">{article.publishRecords.map((p) => p.platform).join(', ') || 'None'}</p>
                <p className="text-[14px] text-[#6A6A6A]">{formatDate(article.createdAt)}</p>
                <p className="text-[20px] font-medium text-[#44403B] md:text-[24px]">{article.views.toLocaleString('en-IN')}</p>
                <button onClick={() => router.push(toEmbedded(`/admin/users/${article.user.id}`))} className="text-left text-[14px] text-[#1E40AF] underline underline-offset-2">
                  {article.user.name}
                </button>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={() => moderateRow(article.id, 'WARN')}
                    disabled={actionBusy !== null}
                    className="rounded border border-[#FDBA74] px-2 py-1 text-[10px] font-bold text-[#C2410C] disabled:opacity-50"
                  >
                    {actionBusy === `${article.id}:WARN` ? '...' : 'Warn'}
                  </button>
                  {article.status === 'ARCHIVED' ? (
                    <button
                      onClick={() => moderateRow(article.id, 'RESTORE')}
                      disabled={actionBusy !== null}
                      className="rounded border border-[#86EFAC] px-2 py-1 text-[10px] font-bold text-[#15803D] disabled:opacity-50"
                    >
                      {actionBusy === `${article.id}:RESTORE` ? '...' : 'Restore'}
                    </button>
                  ) : (
                    <button
                      onClick={() => moderateRow(article.id, 'ARCHIVE')}
                      disabled={actionBusy !== null}
                      className="rounded border border-[#FCA5A5] px-2 py-1 text-[10px] font-bold text-[#B91C1C] disabled:opacity-50"
                    >
                      {actionBusy === `${article.id}:ARCHIVE` ? '...' : 'Archive'}
                    </button>
                  )}
                  <button
                    onClick={() => moderateRow(article.id, 'REMOVE')}
                    disabled={actionBusy !== null}
                    className="rounded border border-[#FCA5A5] px-2 py-1 text-[10px] font-bold text-[#B91C1C] disabled:opacity-50"
                  >
                    {actionBusy === `${article.id}:REMOVE` ? '...' : 'Remove'}
                  </button>
                  <button
                    onClick={() => moderateRow(article.id, 'SUSPEND')}
                    disabled={actionBusy !== null}
                    className="rounded border border-[#FECACA] px-2 py-1 text-[10px] font-bold text-[#991B1B] disabled:opacity-50"
                  >
                    {actionBusy === `${article.id}:SUSPEND` ? '...' : 'Suspend Publisher'}
                  </button>
                  <button onClick={() => openArticle(article.id)} className="rounded border border-[#E5E7EB] px-2 py-1 text-[10px] text-[#6B7280]">
                    {isModerationMode ? 'Review' : 'Open'}
                  </button>
                </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="md:hidden">
            {loadingData ? (
              <div className="px-3 py-8 text-sm text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading articles...</div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="border-t border-[#F3F4F6] px-3 py-3">
                  <p className="line-clamp-1 text-[18px] font-semibold text-[#212121]">{article.title}</p>
                  <p className="mt-1 text-[11px] text-[#999999]">Last modified: {formatDate(article.updatedAt)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] ${statusStyles(article.status)}`}>{article.status}</span>
                    <span className="text-[12px] text-[#6A6A6A]">{article.views.toLocaleString('en-IN')} views</span>
                    <button onClick={() => router.push(toEmbedded(`/admin/users/${article.user.id}`))} className="text-[12px] text-[#1E40AF] underline underline-offset-2">
                      {article.user.name}
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-[#57534D]">{article.publishRecords.map((p) => p.platform).join(', ') || 'No platform'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => moderateRow(article.id, 'WARN')}
                      disabled={actionBusy !== null}
                      className="rounded border border-[#FDBA74] px-2 py-1 text-[10px] font-bold text-[#C2410C] disabled:opacity-50"
                    >
                      {actionBusy === `${article.id}:WARN` ? '...' : 'Warn'}
                    </button>
                    {article.status === 'ARCHIVED' ? (
                      <button
                        onClick={() => moderateRow(article.id, 'RESTORE')}
                        disabled={actionBusy !== null}
                        className="rounded border border-[#86EFAC] px-2 py-1 text-[10px] font-bold text-[#15803D] disabled:opacity-50"
                      >
                        {actionBusy === `${article.id}:RESTORE` ? '...' : 'Restore'}
                      </button>
                    ) : (
                      <button
                        onClick={() => moderateRow(article.id, 'ARCHIVE')}
                        disabled={actionBusy !== null}
                        className="rounded border border-[#FCA5A5] px-2 py-1 text-[10px] font-bold text-[#B91C1C] disabled:opacity-50"
                      >
                        {actionBusy === `${article.id}:ARCHIVE` ? '...' : 'Archive'}
                      </button>
                    )}
                    <button
                      onClick={() => moderateRow(article.id, 'REMOVE')}
                      disabled={actionBusy !== null}
                      className="rounded border border-[#FCA5A5] px-2 py-1 text-[10px] font-bold text-[#B91C1C] disabled:opacity-50"
                    >
                      {actionBusy === `${article.id}:REMOVE` ? '...' : 'Remove'}
                    </button>
                    <button
                      onClick={() => openArticle(article.id)}
                      className="rounded border border-[#E5E7EB] px-2 py-1 text-[10px] text-[#6B7280]"
                    >
                      {isModerationMode ? 'Review' : 'Open'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col items-start justify-between gap-2 border-t border-[#F3F4F6] px-3 py-3 text-[14px] text-[#6A6A6A] sm:flex-row sm:items-center sm:px-4 sm:text-[16px]">
            <p>Showing {visibleRange} of {pagination.total} results</p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchArticles(pagination.page - 1)}
                className="rounded border border-[#E5E7EB] px-3 py-1 disabled:opacity-40"
              >
                &lt;
              </button>
              <span className="rounded bg-[#F3F4F6] px-3 py-1 text-[#212121]">{pagination.page}</span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchArticles(pagination.page + 1)}
                className="rounded border border-[#E5E7EB] px-3 py-1 disabled:opacity-40"
              >
                &gt;
              </button>
            </div>
          </div>
        </section>

        {isModerationMode && (
          <section className="mt-5 rounded-[14px] border border-[#F5F5F4] bg-[#FFFEFD] p-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#A6A09B]">
                  Content Moderation List {detail ? `› Case ${detail.caseNumber}` : ''}
                </p>
                <h2 className="text-[22px] font-bold text-[#292524] sm:text-[25px]">Content Moderation Details</h2>
                <p className="text-[13px] text-[#79716B]">Reviewing flagged content.</p>
              </div>
              <button
                onClick={() => router.push(toEmbedded('/admin/articles?mode=moderation'))}
                className="rounded-full border border-[#FB6503] px-4 py-2 text-[13px] font-bold text-[#57534D]"
              >
                Back to List
              </button>
            </div>

            {loadingDetail ? (
              <div className="mt-3 text-sm text-[#6A6A6A]"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading moderation detail...</div>
            ) : !detail ? (
              <div className="mt-3 text-sm text-[#6A6A6A]">Select an article and click Review to open moderation details.</div>
            ) : (
              <div className="mt-4 grid gap-5 xl:grid-cols-[1.9fr_0.95fr]">
                <div className="overflow-hidden rounded-[14px] border border-[#F5F5F4] bg-white">
                  <div className="flex items-center justify-between border-b border-[#FAFAF9] px-4 py-3">
                    <p className="text-[13px] font-bold text-[#44403B]">Content Preview</p>
                    <span className="rounded-full border border-[#FFE2E2] bg-[#FEF2F2] px-2 py-1 text-[10px] font-bold text-[#E7000B]">Flagged</span>
                  </div>

                  {resolveImageUrl(detail.article.coverImage || detail.article.featuredImage) ? (
                    <img
                      src={resolveImageUrl(detail.article.coverImage || detail.article.featuredImage) || ''}
                      alt={detail.article.title}
                      className="h-60 w-full object-cover"
                    />
                  ) : (
                    <div className="h-60 w-full bg-[#F5F5F4]" />
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
                        <p className="text-[10px] font-bold uppercase text-[#A6A09B]">{detail.article.user.email} • {formatDate(detail.article.publishedAt || detail.article.createdAt)}</p>
                      </div>
                    </div>

                    <h3 className="text-[20px] font-bold text-[#1C1917]">{detail.article.title}</h3>
                    <p className="text-[13px] text-[#79716B] line-clamp-2">{detail.article.excerpt || 'No excerpt available'}</p>
                    <p className="text-[13px] text-[#79716B] line-clamp-4">{detail.article.content.replace(/<[^>]+>/g, '').slice(0, 420)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[10px] bg-[#FFF0E6] p-4">
                    <h3 className="text-[24px] font-medium text-[#292524] sm:text-[31px]">Flag Details</h3>
                    <div className="mt-3 rounded border border-[#E7E5E4] bg-white">
                      <div className="flex items-center justify-between border-b border-[#F5F5F4] px-3 py-3">
                        <span className="text-[10px] font-bold text-[#A6A09B]">REASON</span>
                        <span className="text-[13px] text-[#292524]">{detail.flag.reason}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#F5F5F4] px-3 py-3">
                        <span className="text-[10px] font-bold text-[#A6A09B]">REPORTED BY</span>
                        <span className="text-[13px] text-[#57534D]">{detail.flag.reportedBy}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#F5F5F4] px-3 py-3">
                        <span className="text-[10px] font-bold text-[#A6A09B]">DATE</span>
                        <span className="text-[13px] text-[#292524]">{formatDate(detail.flag.date)}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-3">
                        <span className="text-[10px] font-bold text-[#A6A09B]">STATUS</span>
                        <span className="text-[10px] font-bold text-[#FF6900]">{detail.flag.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[14px] border border-[#F5F5F4] bg-white p-4 shadow-sm">
                    <h3 className="text-[24px] font-medium text-[#292524] sm:text-[31px]">Moderation Actions</h3>
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => moderateRow(detail.article.id, 'REMOVE')}
                        disabled={actionBusy !== null}
                        className="w-full rounded bg-gradient-to-b from-[#FB6503] to-[#FC9856] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-70"
                      >
                        {actionBusy === `${detail.article.id}:REMOVE` ? 'Processing...' : 'Remove Content'}
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => moderateRow(detail.article.id, 'APPROVE')}
                          disabled={actionBusy !== null}
                          className="rounded border border-[#B9F8CF] px-2 py-2 text-[10px] font-bold text-[#008236] disabled:opacity-70"
                        >
                          {actionBusy === `${detail.article.id}:APPROVE` ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => moderateRow(detail.article.id, 'WARN')}
                          disabled={actionBusy !== null}
                          className="rounded border border-[#FFD6A7] px-2 py-2 text-[10px] font-bold text-[#F54900] disabled:opacity-70"
                        >
                          {actionBusy === `${detail.article.id}:WARN` ? '...' : 'Warn User'}
                        </button>
                      </div>
                      <button
                        onClick={() => moderateRow(detail.article.id, 'SUSPEND')}
                        disabled={actionBusy !== null}
                        className="w-full rounded border border-[#FCA5A5] px-2 py-2 text-[10px] font-bold text-[#B91C1C] disabled:opacity-70"
                      >
                        {actionBusy === `${detail.article.id}:SUSPEND` ? '...' : 'Suspend Publisher'}
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
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
