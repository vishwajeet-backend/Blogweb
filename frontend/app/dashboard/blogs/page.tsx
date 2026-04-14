"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"
import { Loader2, Search, Heart, MessageCircle, Share2, Eye } from "lucide-react"
import { toast } from "sonner"

type BlogArticle = {
  id: string
  title: string
  excerpt: string | null
  slug: string
  coverImage: string | null
  featuredImage?: string | null
  publishedAt: string
  readTime: number
  user: {
    id: string
    name: string
    avatar: string | null
  }
  engagement?: {
    likes: number
    comments: number
    shares: number
    views: number
  }
}

type Pagination = {
  page: number
  totalPages: number
  total: number
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function DashboardBlogsPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 })

  useEffect(() => {
    fetchBlogs(page, search)
  }, [page])

  async function fetchBlogs(nextPage: number, nextSearch = "") {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "12",
      })

      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim())
      }

      const response = await fetch(`/api/blogs/public?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load blogs")
      }

      setArticles(data.data.articles || [])
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (error: any) {
      toast.error(error.message || "Failed to load blogs")
    } finally {
      setLoading(false)
    }
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchBlogs(1, search)
  }

  const hasResults = useMemo(() => articles.length > 0, [articles])

  if (loading && page === 1) {
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
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold leading-none text-[#212121] dark:text-[#F2F2F2] md:text-[39px]">
              Discover Blogs,
              <span className="ml-2 italic text-[#6A6A6A] dark:text-[#B5B5B5]">All Creators</span>
            </h1>
            <p className="mt-3 text-base font-medium text-[#6A6A6A] dark:text-[#B5B5B5]">
              See your own and other creators' published blogs with live engagement.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmitSearch} className="mb-6 flex max-w-[520px] items-center gap-2 rounded-[28px] border border-[#E45C03] bg-white px-3 py-2 shadow-[0_2px_2px_0_#FECFB1]">
          <Search className="h-4 w-4 text-[#999999]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs by title or excerpt"
            className="w-full bg-transparent text-base font-medium text-[#212121] placeholder:text-[#999999] outline-none"
          />
          <button className="rounded-full bg-[#FB6503] px-4 py-1.5 text-sm font-bold text-white">Search</button>
        </form>

        {!hasResults ? (
          <div className="rounded-2xl border border-[#E9E9E9] bg-white p-8 text-center text-[#6A6A6A]">
            No public blogs found for this query.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => {
              const isMine = user?.id === article.user.id
              return (
                <article key={article.id} className="overflow-hidden rounded-2xl border border-[#E9E9E9] bg-white">
                  <div className="h-40 w-full bg-[#FFF0E6]">
                    {article.coverImage || article.featuredImage ? (
                      <img src={article.coverImage || article.featuredImage || ''} alt={article.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-xs text-[#6A6A6A]">
                      <span>{formatDate(article.publishedAt)}</span>
                      <span>{article.readTime} min read</span>
                    </div>

                    <h2 className="line-clamp-2 text-xl font-bold text-[#1E1E1E]">{article.title}</h2>
                    <p className="line-clamp-2 text-sm text-[#52525B]">{article.excerpt || "No excerpt provided."}</p>

                    <div className="flex items-center justify-between text-xs text-[#71717A]">
                      <span>By {article.user.name}</span>
                      <span className={`rounded-full px-2 py-0.5 font-bold ${isMine ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F4F4F5] text-[#52525B]"}`}>
                        {isMine ? "My Blog" : "Creator"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs text-[#4D4D4D]">
                      <div className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {article.engagement?.views || 0}</div>
                      <div className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {article.engagement?.likes || 0}</div>
                      <div className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {article.engagement?.comments || 0}</div>
                      <div className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> {article.engagement?.shares || 0}</div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => router.push(`/blog/${article.id}`)}
                        className="w-full rounded-xl border border-[#E9E9E9] bg-[#FFFAF3] px-3 py-2 text-sm font-bold text-[#2D3648]"
                      >
                        Read Blog
                      </button>
                      {isMine ? (
                        <button
                          onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                          className="w-full rounded-xl bg-[#FB6503] px-3 py-2 text-sm font-bold text-white"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {pagination.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded border border-[#E5E7EB] px-3 py-1 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <span className="rounded bg-[#F3F4F6] px-3 py-1 text-sm text-[#212121]">{page}</span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="rounded border border-[#E5E7EB] px-3 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
