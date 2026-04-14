"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"
import { Loader2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: string
  wordCount: number
  readingTime: number
  views: number
  publishedAt: string | null
  scheduleAt: string | null
  createdAt: string
  updatedAt: string
  publishRecords?: Array<{
    platform: string
    url: string | null
  }>
}

const FILTERS = ["all", "published", "draft", "scheduled"] as const
const PLATFORM_FILTERS = ["all", "WORDPRESS", "MEDIUM", "LINKEDIN", "TWITTER", "DEVTO", "HASHNODE", "GHOST", "WIX"] as const

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function platformDisplay(platform: string) {
  const names: Record<string, string> = {
    WORDPRESS: "Wordpress",
    GHOST: "Ghost",
    DEVTO: "Dev.to",
    HASHNODE: "Hashnode",
    WIX: "Wix",
    MEDIUM: "Medium",
    LINKEDIN: "LinkedIn",
    TWITTER: "Twitter / X",
  }
  return names[platform] || platform
}

export default function ArticlesPage() {
  const { user, loading: authLoading } = useAuth()
  const { isDark } = useTheme()
  const router = useRouter()

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user, filterStatus])

  async function fetchArticles() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const params = new URLSearchParams({ limit: "100", scope: "mine" })
      if (filterStatus !== "all") {
        params.append("status", filterStatus.toUpperCase())
      }

      const response = await fetch(`/api/articles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.success) {
        setArticles(data.data.articles || [])
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
      toast.error("Failed to fetch articles")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(articleId: string, articleTitle: string) {
    if (!confirm(`Are you sure you want to delete \"${articleTitle}\"?`)) return

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.success) {
        toast.success("Article deleted successfully")
        setArticles((prev) => prev.filter((article) => article.id !== articleId))
      } else {
        toast.error(data.error || "Failed to delete article")
      }
    } catch (_error) {
      toast.error("Failed to delete article")
    }
  }

  const filteredArticles = useMemo(() => {
    return articles
      .filter((article) => article.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((article) => {
        if (platformFilter === "all") return true
        return (article.publishRecords || []).some((rec) => rec.platform?.toUpperCase() === platformFilter)
      })
  }, [articles, searchQuery, platformFilter])

  const stats = useMemo(() => {
    const total = filteredArticles.length
    const published = filteredArticles.filter((item) => item.status === "PUBLISHED").length
    const drafts = filteredArticles.filter((item) => item.status === "DRAFT").length
    const totalViews = filteredArticles.reduce((sum, item) => sum + (item.views || 0), 0)

    return { total, published, drafts, totalViews }
  }, [filteredArticles])

  const queueCount = useMemo(() => filteredArticles.filter((item) => item.status === "SCHEDULED").length, [filteredArticles])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#FB6503]" />
      </div>
    )
  }

  return (
    <div
      className="min-h-full bg-[#FFFEFD] dark:bg-[#161616]"
      style={{
        fontFamily: "Satoshi, var(--font-geist-sans), sans-serif",
        backgroundImage:
          isDark
            ? "linear-gradient(rgba(10,10,10,0.78), rgba(10,10,10,0.78)), url('/design/BG%2023-01%202.png')"
            : "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url('/design/BG%2023-01%202.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="mx-auto w-full max-w-[1120px] px-3 pb-10 pt-6 sm:px-4 md:px-10 md:pt-12">
        <div className="mb-4 flex items-center justify-between border-b border-[#E9E9E9] pb-3 md:hidden">
          <p className="text-[22px] font-black uppercase tracking-[-0.04em] text-[#FB6503]">LOGOIPSUM</p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-[40px] font-bold leading-none text-[#212121] md:text-[39px]">My Articles</h1>
            <p className="mt-2 text-[16px] font-medium text-[#99A1AF]">Manage and publish your automated content.</p>
          </div>

          <div className="hidden gap-4 md:flex">
            <div className="w-[148px] rounded-[20px] border border-[#E9E9E9] bg-white p-4 text-center">
              <p className="text-sm font-medium text-[#212121]">TOTAL</p>
              <p className="mt-1 text-2xl font-bold text-[#1E1E1E]">{stats.total}</p>
            </div>
            <div className="w-[148px] rounded-[20px] border border-[#E9E9E9] bg-white p-4 text-center">
              <p className="text-sm font-medium text-[#212121]">PUBLISHED</p>
              <p className="mt-1 text-2xl font-bold text-[#1E1E1E]">{stats.published}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard/articles/new")}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#FB6503] px-4 py-3 text-sm font-bold text-[#FFFEFD] md:hidden"
        >
          <Plus className="h-4 w-4" /> NEW ARTICLE
        </button>

        <div className="mt-4 rounded-[10px] border border-[#E9E9E9] bg-[#F4F4F5] p-3 md:mt-8 md:flex md:flex-wrap md:items-center md:justify-between md:gap-4 md:rounded-2xl md:bg-white/80 md:px-4 md:py-3 md:backdrop-blur">
          <div className="flex w-full items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-white px-2.5 py-2 md:max-w-[420px] md:rounded-[28px] md:border-[#E45C03] md:shadow-[0_2px_2px_0_#FECFB1]">
            <Search className="h-[18px] w-[18px] text-[#999999]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, keyword..."
              className="w-full bg-transparent text-[13px] font-medium text-[#212121] placeholder:text-[#999999] outline-none md:text-base"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:mt-0 md:flex md:gap-2 md:overflow-x-auto">
            {FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-[8px] px-3 py-2 text-left text-[13px] font-medium capitalize md:rounded-[20px] md:px-4 md:text-sm md:font-bold ${
                  filterStatus === status
                    ? "bg-[#212121] text-white"
                    : "border border-[#E9E9E9] bg-[#FFFAF3] text-[#4D4D4D]"
                }`}
              >
                {status}
              </button>
            ))}

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-[8px] border border-[#E9E9E9] bg-white px-3 py-2 text-[13px] text-[#4D4D4D] md:text-sm"
            >
              {PLATFORM_FILTERS.map((p) => (
                <option key={p} value={p}>
                  Platform: {p === 'all' ? 'All' : platformDisplay(p)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => router.push("/dashboard/articles/new")}
            className="hidden items-center gap-2 rounded-[26px] bg-[#FB6503] px-4 py-2.5 text-sm font-bold text-[#FFFEFD] md:flex"
          >
            <Plus className="h-4 w-4" />
            NEW ARTICLE
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.9fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#E9E9E9] bg-white">
            <div className="flex items-center justify-between border-b border-[#E9E9E9] bg-[#FFFAF3] px-3 py-3">
              <p className="text-base font-bold text-[#1E1E1E]">My Articles</p>
              <p className="text-[13px] font-bold text-[#4D4D4D]">{filteredArticles.length} ITEMS</p>
            </div>

            <div className="space-y-3 p-3 md:hidden">
              {filteredArticles.map((article) => {
                const platforms = (article.publishRecords || []).map((rec) => rec.platform).slice(0, 3)
                return (
                  <div key={article.id} className="rounded-[10px] border border-[#E4E4E7] bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[28px] leading-[1.05] text-[#4D4D4D]">📄</p>
                        <p className="mt-1 text-[23px] font-bold leading-tight text-[#212121] line-clamp-2">{article.title}</p>
                        <p className="mt-1 text-[13px] text-[#99A1AF]">Modified: {formatDate(article.updatedAt)}</p>
                      </div>
                      <button onClick={() => router.push(`/dashboard/articles/${article.id}`)} className="text-[#9CA3AF]">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`w-fit rounded-2xl px-2.5 py-1 text-xs ${
                          article.status === 'PUBLISHED'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : article.status === 'SCHEDULED'
                            ? 'bg-[#DBEAFE] text-[#1D4ED8]'
                            : article.status === 'DRAFT'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#FEE2E2] text-[#B91C1C]'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? 'Published' : article.status === 'SCHEDULED' ? 'Scheduled' : article.status === 'DRAFT' ? 'Draft' : 'Needs Review'}
                      </span>

                      <div className="flex items-center gap-1">
                        {platforms.length > 0 ? (
                          platforms.map((platform, idx) => (
                            <span key={idx} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E6F4FF] text-[10px] font-bold text-[#0369A1]">
                              {platform.slice(0, 1)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] italic text-[#A1A1AA]">No platforms</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#F3F4F6] pt-3 text-center">
                      <div>
                        <p className="text-[12px] text-[#99A1AF]">Created</p>
                        <p className="mt-1 text-[14px] text-[#4D4D4D]">{formatDate(article.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#99A1AF]">Views</p>
                        <p className="mt-1 text-[14px] text-[#4D4D4D]">{article.views ? article.views.toLocaleString() : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#99A1AF]">Engagement</p>
                        <p className="mt-1 text-[14px] text-[#16A34A]">-</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1.6fr_0.9fr_1.2fr_0.9fr_0.6fr] bg-[#FFFAF3] px-3 py-2 text-base font-bold text-[#1E1E1E]">
                  <p>TITLE</p>
                  <p>STATUS</p>
                  <p>PLATFORM</p>
                  <p>DATE</p>
                  <p>ACTION</p>
                </div>

                {filteredArticles.map((article) => (
                  <div key={article.id} className="grid grid-cols-[1.6fr_0.9fr_1.2fr_0.9fr_0.6fr] items-center px-3 py-5">
                    <Link href={`/dashboard/articles/${article.id}`} className="max-w-[220px] text-[13px] leading-[1.2] text-[#2D3648] hover:text-[#FB6503]">
                      {article.title}
                    </Link>

                    <span
                      className={`w-fit rounded-2xl px-2.5 py-1 text-xs ${
                        article.status === "PUBLISHED"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : article.status === "SCHEDULED"
                          ? "bg-[#FEF3C7] text-[#92400E]"
                          : "bg-[#F4F4F5] text-[#52525B]"
                      }`}
                    >
                      {article.status === "PUBLISHED" ? "Published" : article.status}
                    </span>

                    <p className="text-[13px] text-[#52525B]">
                      {(article.publishRecords || []).length > 0
                        ? (article.publishRecords || [])
                            .slice(0, 2)
                            .map((rec) => platformDisplay(rec.platform))
                            .join(", ")
                        : "-"}
                    </p>

                    <p className="text-[13px] text-[#52525B]">{formatDate(article.publishedAt || article.createdAt)}</p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                        className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#FFFAF3] hover:text-[#FB6503]"
                        title="Open"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
                        className="rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#FFF0E6] hover:text-[#E45C03]"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="px-3 py-10 text-[13px] text-[#6A6A6A]">No stories found. Try another filter or create a new article.</div>
                )}
              </div>
            </div>

            <div className="border-t border-[#E9E9E9] px-3 py-3 text-center text-[13px] text-[#52525B] md:hidden">
              Showing 1 to {Math.min(filteredArticles.length, 24)} of {filteredArticles.length} results
              <div className="mt-2 flex items-center justify-center gap-2">
                <button className="h-7 w-7 rounded border border-[#E5E7EB] text-[#9CA3AF]">&lt;</button>
                <button className="h-7 w-7 rounded bg-[#212121] text-white">1</button>
                <button className="h-7 w-7 rounded border border-[#E5E7EB] text-[#6A6A6A]">2</button>
                <button className="h-7 w-7 rounded border border-[#E5E7EB] text-[#6A6A6A]">3</button>
                <button className="h-7 w-7 rounded border border-[#E5E7EB] text-[#6A6A6A]">&gt;</button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[10px] border border-[#E4E4E7] bg-white px-6 py-6">
              <h3 className="text-[20px] font-bold text-[#2D3648]">Publishing Queue</h3>
              <div className="mt-4 space-y-3 text-[13px]">
                <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-2">
                  <p className="font-bold text-[#2D3648]">Scheduled</p>
                  <p className="font-medium text-[#71717A]">{queueCount}</p>
                </div>
                <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-2">
                  <p className="font-bold text-[#2D3648]">Drafts</p>
                  <p className="font-medium text-[#71717A]">{stats.drafts}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#2D3648]">Views</p>
                  <p className="font-medium text-[#71717A]">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[10px] bg-[#FFFBF7] px-6 py-6">
              <div className="absolute -bottom-10 right-[-22px] h-32 w-32 rounded-full bg-[#FFF0E6]" />
              <h3 className="text-[20px] font-bold text-[#2D3648]">Need Better Reach?</h3>
              <p className="mt-2 max-w-[230px] text-base font-medium text-[#52525B]">
                Connect more platforms and publish multiple articles in one flow.
              </p>
              <button
                onClick={() => router.push("/dashboard/integrations")}
                className="mt-6 rounded-[34px] bg-[#FB6503] px-6 py-2.5 text-base font-medium text-white shadow"
              >
                Manage Platforms
              </button>
            </div>

            <div className="rounded-[10px] border border-[#E4E4E7] bg-white px-6 py-6">
              <p className="text-base font-medium text-[#2D3648]">Quick Actions</p>
              <div className="mt-4 space-y-2.5">
                <button
                  onClick={() => router.push("/dashboard/articles/new")}
                  className="w-full rounded-xl border border-[#E9E9E9] bg-[#FFFAF3] px-3 py-2 text-left text-sm font-bold text-[#2D3648]"
                >
                  Create a new article
                </button>
                <button
                  onClick={() => router.push("/dashboard/analytics")}
                  className="w-full rounded-xl border border-[#E9E9E9] bg-[#FFFAF3] px-3 py-2 text-left text-sm font-bold text-[#2D3648]"
                >
                  Open analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
