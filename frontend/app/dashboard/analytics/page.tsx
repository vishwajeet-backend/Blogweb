"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/context/AuthContext"
import { Loader2, CalendarDays, Eye, MousePointerClick, Heart, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "@/lib/context/ThemeContext"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

type PlatformStat = {
  platform: string
  totalViews: number
  totalLikes: number
  totalComments: number
  articles: number
}

type ArticleAnalytics = {
  articleId: string
  articleTitle: string
  totalViews: number
  totalLikes: number
  totalComments: number
}

const LINE_COLORS = ["#FB6503", "#FC8435", "#FDB88B"]
const PIE_COLORS = ["#E45C03", "#FC8435", "#FDB88B", "#FECFB1"]

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    PUBLISHTYPE: "Direct",
    WORDPRESS: "Wordpress",
    DEVTO: "Social",
    HASHNODE: "Organic",
    GHOST: "Referral",
    WIX: "Wix",
    LINKEDIN: "LinkedIn",
    MEDIUM: "Medium",
  }
  return map[platform] || platform
}

function AnalyticsContent() {
  const { user } = useAuth()
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [timeRange, setTimeRange] = useState("30d")
  const [compare, setCompare] = useState(false)

  const [overviewStats, setOverviewStats] = useState<any>(null)
  const [totals, setTotals] = useState({ views: 0, clicks: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 })
  const [byPlatform, setByPlatform] = useState<PlatformStat[]>([])
  const [byArticle, setByArticle] = useState<ArticleAnalytics[]>([])

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
  }, [user])

  async function fetchAllData() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")

      const [statsRes, analyticsRes] = await Promise.all([
        fetch("/api/analytics/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/analytics", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (statsRes.ok) {
        const json = await statsRes.json()
        setOverviewStats(json.data)
      }

      if (analyticsRes.ok) {
        const json = await analyticsRes.json()
        setTotals(json.data?.totals || { views: 0, clicks: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 })
        setByPlatform(json.data?.byPlatform || [])
        setByArticle(json.data?.byArticle || [])
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  async function syncAnalytics() {
    try {
      setSyncing(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/analytics/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message || "Analytics synced")
        await fetchAllData()
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch (_error) {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const seriesData = useMemo(() => {
    const source = byArticle.slice(0, 10)
    return source.map((article, index) => ({
      label: `#${index + 1}`,
      views: article.totalViews,
    }))
  }, [byArticle])

  const trafficData = useMemo(() => {
    return byPlatform
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 4)
      .map((item) => ({ name: platformLabel(item.platform), value: item.totalViews }))
  }, [byPlatform])

  const engagementData = [
    { name: "LIKES", value: totals.likes || 0 },
    { name: "SHARES", value: totals.shares || 0 },
    { name: "COMMENTS", value: totals.comments || 0 },
    { name: "SAVES", value: totals.bookmarks || 0 },
  ]

  const platformShareData = useMemo(() => {
    const total = trafficData.reduce((sum, row) => sum + row.value, 0)
    if (total === 0) return []
    return trafficData.map((row) => ({
      name: row.name,
      value: Math.round((row.value / total) * 100),
    }))
  }, [trafficData])

  const trendMeta = useMemo(() => {
    const recentArticles = Number(overviewStats?.recentActivity?.articlesCreated || 0)
    const recentPublishes = Number(overviewStats?.recentActivity?.platformPublishes || 0)
    const recentPublishedContent = Number(overviewStats?.recentActivity?.articlesPublished || 0)

    return {
      viewsDelta: recentArticles > 0 ? `+${recentArticles}` : "0",
      clicksDelta: totals.clicks > 0 ? `+${compactNumber(totals.clicks)}` : recentPublishes > 0 ? `+${recentPublishes}` : "0",
      engagementDelta: recentPublishedContent > 0 ? `+${recentPublishedContent}` : "0",
      commentsDelta: totals.comments > 0 ? "+active" : "0",
    }
  }, [overviewStats, totals.clicks, totals.comments])

  const cards = [
    {
      title: "Total Views",
      value: compactNumber(overviewStats?.articles?.totalViews || totals.views || 0),
      delta: trendMeta.viewsDelta,
      icon: Eye,
      positive: true,
    },
    {
      title: "Total Clicks",
      value: compactNumber(totals.clicks || 0),
      delta: trendMeta.clicksDelta,
      icon: MousePointerClick,
      positive: true,
    },
    {
      title: "Engagement",
      value: compactNumber((totals.likes || 0) + (totals.comments || 0)),
      delta: trendMeta.engagementDelta,
      icon: Heart,
      positive: true,
    },
    {
      title: "Comments",
      value: compactNumber(totals.comments || 0),
      delta: trendMeta.commentsDelta,
      icon: MessageCircle,
      positive: true,
    },
  ]

  if (loading) {
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold leading-none text-[#212121] md:text-[39px]">Analytics</h1>
            <p className="mt-3 text-base font-medium text-[#6A6A6A]">
              Track performance across all your publishing channels.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[#E9E9E9] bg-white p-2 shadow-sm">
            <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#212121]">
              <CalendarDays className="h-4 w-4" />
              Last {timeRange === "7d" ? "7" : timeRange === "30d" ? "30" : "90"} Days
            </button>

            <button
              onClick={() => setCompare((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#4D4D4D]"
            >
              Compare
              <span className={`h-5 w-10 rounded-full p-[2px] ${compare ? "bg-[#FB6503]" : "bg-[#E9E9E9]"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${compare ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>

            <button
              onClick={syncAnalytics}
              disabled={syncing}
              className="rounded-full bg-[#FB6503] px-6 py-2 text-sm font-bold text-white disabled:opacity-70"
            >
              {syncing ? "Syncing..." : "Apply"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-2xl border border-[#E9E9E9] bg-white px-4 py-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="rounded-xl bg-[#FFFBF7] p-2">
                    <Icon className="h-4 w-4 text-[#999999]" />
                  </div>
                  <p className={`text-xs font-bold ${card.positive ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{card.delta}</p>
                </div>
                <p className="text-xs font-medium text-[#999999]">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-[#1E1E1E]">{card.value}</p>
                <p className="mt-1 text-[11px] font-medium text-[#BABABA]">Real-time platform data</p>
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-[#E9E9E9] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[31px] font-medium text-[#212121]">Views Over Time</h3>
              <span className="text-[#999999]">...</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriesData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E9E9E9" vertical={true} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#BABABA" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#FB6503" strokeWidth={3} dot={false} fill="#FFF0E6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E9E9E9] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[31px] font-medium text-[#212121]">Traffic Sources</h3>
              <span className="text-[#999999]">...</span>
            </div>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                  >
                    {trafficData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {trafficData.map((item, idx) => {
                const total = trafficData.reduce((sum, row) => sum + row.value, 0) || 1
                const pct = Math.round((item.value / total) * 100)
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-[#4D4D4D]">{item.name}</span>
                    </div>
                    <span className="font-bold text-[#212121]">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#E9E9E9] bg-white p-4">
            <h3 className="text-[31px] font-medium text-[#212121]">Engagement by Type</h3>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6A6A6A" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {engagementData.map((_, idx) => (
                      <Cell key={idx} fill={LINE_COLORS[idx % LINE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E9E9E9] bg-white p-4">
            <h3 className="text-[31px] font-medium text-[#212121]">Platform Share</h3>
            <div className="grid grid-cols-[130px_1fr] items-center gap-4">
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformShareData} dataKey="value" innerRadius={40} outerRadius={58}>
                      {platformShareData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {platformShareData.map((row, idx) => (
                  <div key={row.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[#4D4D4D]">{row.name}</span>
                      <span className="font-bold text-[#212121]">{row.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${row.value}%`, backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#FB6503]" />
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  )
}
