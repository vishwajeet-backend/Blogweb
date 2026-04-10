"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Send } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"
import { DashboardSkeleton } from "@/components/SkeletonLoader"

type Article = {
  id: string
  title: string
  status: string
  createdAt: string
  publishedAt: string | null
  publishRecords?: Array<{ platform: string; url?: string | null }>
}

type PlatformConnection = {
  platform: string
  status: string
}

type Stats = {
  totalViews: number
  totalPublished: number
}

const DISPLAY_PLATFORMS = ["WORDPRESS", "MEDIUM", "LINKEDIN", "TWITTER"] as const

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function normalizeStats(raw: any): Stats {
  const stats = raw?.data?.stats || raw?.data || {}
  return {
    totalViews: stats.totalViews || 0,
    totalPublished: stats.publishedCount || stats.totalPublished || stats.publishedArticles || 0,
  }
}

function platformLabel(name: string) {
  if (name === "TWITTER") return "Twitter / X"
  if (name === "LINKEDIN") return "LinkedIn"
  if (name === "WORDPRESS") return "Wordpress"
  if (name === "MEDIUM") return "Medium"
  return name
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { isDark } = useTheme()
  const router = useRouter()

  const [articles, setArticles] = useState<Article[]>([])
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [stats, setStats] = useState<Stats>({ totalViews: 0, totalPublished: 0 })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          setLoadingData(false)
          return
        }

        const [statsRes, articlesRes, connRes] = await Promise.all([
          fetch("/api/user/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/articles?limit=6", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/platforms/connections", { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          setStats(normalizeStats(statsJson))
        }

        if (articlesRes.ok) {
          const articlesJson = await articlesRes.json()
          setArticles(articlesJson?.data?.articles || [])
        }

        if (connRes.ok) {
          const connJson = await connRes.json()
          setConnections(connJson?.data?.connections || [])
        }
      } catch (error) {
        console.error("Failed loading dashboard data", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const platformState = useMemo(() => {
    const map = new Map(connections.map((conn) => [conn.platform.toUpperCase(), conn.status.toUpperCase()]))
    return DISPLAY_PLATFORMS.map((platform) => {
      const status = map.get(platform)
      if (status === "CONNECTED") {
        return { platform, text: "Connected", dot: "#22C55E", textColor: "#A1A1AA", strong: false }
      }
      if (platform === "LINKEDIN") {
        return { platform, text: "Re-auth needed", dot: "#EAB308", textColor: "#A1A1AA", strong: false }
      }
      return { platform, text: "Connect", dot: "#D4D4D8", textColor: "#2D3648", strong: true }
    })
  }, [connections])

  if (loading || loadingData) {
    return <DashboardSkeleton />
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
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-8 md:px-10 md:pt-[52px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-[32px] font-bold leading-none text-[#212121] dark:text-[#F2F2F2] md:text-[39px]">
              Welcome Back,
              <span className="ml-2 italic text-[#6A6A6A] dark:text-[#B5B5B5]">{user?.name?.split(" ")[0] || "Isabella"}</span>
            </h1>
            <p className="mt-3 text-base font-medium text-[#6A6A6A] dark:text-[#B5B5B5]">
              Here is what is happening with your content today.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="w-[168px] rounded-[20px] border border-[#E9E9E9] bg-white p-4 text-center dark:border-[#343434] dark:bg-[#1E1E1E]">
              <p className="text-base font-medium text-[#212121] dark:text-[#F2F2F2]">TOTAL VIEWS</p>
              <p className="mt-2 text-[28px] font-bold text-[#1E1E1E] dark:text-[#F2F2F2]">
                {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews}
              </p>
            </div>
            <div className="w-[168px] rounded-[20px] border border-[#E9E9E9] bg-white p-4 text-center dark:border-[#343434] dark:bg-[#1E1E1E]">
              <p className="text-base font-medium text-[#212121] dark:text-[#F2F2F2]">PUBLISHED</p>
              <p className="mt-2 text-[28px] font-bold text-[#1E1E1E] dark:text-[#F2F2F2]">{stats.totalPublished}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1.9fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#E9E9E9] bg-white dark:border-[#343434] dark:bg-[#1E1E1E]">
            <div className="flex items-center justify-between border-b border-[#E9E9E9] bg-[#FFFAF3] px-3 py-3 dark:border-[#343434] dark:bg-[#24201D]">
              <p className="text-base font-bold text-[#1E1E1E] dark:text-[#F2F2F2]">Recent Articles</p>
              <button
                onClick={() => router.push("/dashboard/articles")}
                className="text-[13px] font-bold text-[#4D4D4D] dark:text-[#CACACA]"
              >
                VIEW ALL
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[1.4fr_0.9fr_1.2fr_0.9fr_0.5fr] bg-[#FFFAF3] px-3 py-2 text-base font-bold text-[#1E1E1E]">
                  <p>TITLE</p>
                  <p>STATUS</p>
                  <p>PLATFORM</p>
                  <p>DATE</p>
                  <p>ACTION</p>
                </div>

                <div>
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="grid cursor-pointer grid-cols-[1.4fr_0.9fr_1.2fr_0.9fr_0.5fr] items-center px-3 py-5"
                  onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                >
                  <p className="max-w-[110px] text-[13px] leading-[1.2] text-[#2D3648]">{article.title}</p>

                    <span className="w-fit rounded-2xl bg-[#DCFCE7] px-2.5 py-1 text-xs text-[#166534] dark:bg-[#1F3C2B] dark:text-[#9BE6B6]">
                    {article.status === "PUBLISHED" ? "Published" : article.status}
                  </span>

                  <p className="text-[13px] text-[#52525B]">
                    {(article.publishRecords || []).length > 0
                      ? (article.publishRecords || []).slice(0, 2).map((rec) => rec.platform).join(", ")
                        : "Wordpress, Medium"}
                  </p>

                  <p className="text-[13px] text-[#52525B]">{formatDate(article.publishedAt || article.createdAt)}</p>

                  <MoreHorizontal className="h-5 w-5 text-[#9CA3AF]" />
                </div>
              ))}

              {articles.length === 0 && (
                <div className="px-3 py-10 text-[13px] text-[#6A6A6A]">No articles yet. Create your first article.</div>
              )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[10px] border border-[#E4E4E7] bg-white px-6 pb-1 pt-6 dark:border-[#343434] dark:bg-[#1E1E1E]">
              <h3 className="text-[20px] font-bold text-[#2D3648] dark:text-[#F2F2F2]">Platform Status</h3>
              <div className="mt-4">
                {platformState.map((item) => (
                  <div key={item.platform} className="flex h-11 items-center justify-between border-b border-[#F4F4F5] last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
                      <p className="text-[13px] font-bold text-[#2D3648] dark:text-[#F2F2F2]">{platformLabel(item.platform)}</p>
                    </div>
                    <p className={`text-[13px] ${item.strong ? "font-bold" : "font-normal"}`} style={{ color: item.textColor }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[10px] bg-[#FFFBF7] px-6 py-6 dark:bg-[#1F1A17]">
              <div className="absolute -bottom-10 right-[-22px] h-32 w-32 rounded-full bg-[#FFF0E6]" />
              <h3 className="text-[20px] font-bold text-[#2D3648] dark:text-[#F2F2F2]">Unlock Pro Features</h3>
              <p className="mt-2 max-w-[230px] text-base font-medium text-[#52525B] dark:text-[#C6C6C6]">
                Get advanced analytics, unlimited scheduling, and team collaboration tools.
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="mt-6 rounded-[34px] bg-[#FB6503] px-6 py-2.5 text-base font-medium text-white shadow"
              >
                View Plans
              </button>
            </div>

            <div className="rounded-[10px] border border-[#E4E4E7] bg-white px-6 py-6 dark:border-[#343434] dark:bg-[#1E1E1E]">
              <div className="flex items-center justify-between">
                <p className="text-base font-medium text-[#2D3648]">Updates</p>
                <Send className="h-4 w-4 text-[#71717A]" />
              </div>
              <p className="mt-4 text-[13px] font-bold text-[#2D3648]">New: AI Caption Generator</p>
              <p className="mt-1 text-[13px] font-medium text-[#71717A]">
                Automatically generate engaging captions for your social media posts with one click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
