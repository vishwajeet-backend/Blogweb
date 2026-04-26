"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Heart,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Share2,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ArticleAnalytics {
  articleId: string
  articleTitle: string
  articleSlug: string
  totalViews: number
  totalLikes: number
  totalComments: number
  platforms: Array<{
    platform: string
    views: number
    likes: number
    comments: number
    url: string | null
  }>
}

export default function IndividualPlatformAnalyticsPage() {
  const { platform } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [articles, setArticles] = useState<ArticleAnalytics[]>([])

  const platformName = getPlatformName(platform as string)

  useEffect(() => {
    if (user) {
      fetchPlatformAnalytics()
    }
  }, [user, platform])

  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/analytics?platform=${platform}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
        setArticles(data.data.byArticle || [])
      } else {
        toast.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const syncAnalytics = async () => {
    try {
      setSyncing(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchPlatformAnalytics()
      } else {
        toast.error(data.error || 'Failed to sync analytics')
      }
    } catch (error) {
      console.error('Error syncing analytics:', error)
      toast.error('Failed to sync analytics')
    } finally {
      setSyncing(false)
    }
  }

  function getPlatformName(platform: string) {
    const names: Record<string, string> = {
      'wordpress': 'WordPress',
      'devto': 'Dev.to',
      'hashnode': 'Hashnode',
      'ghost': 'Ghost',
      'wix': 'Wix',
    }
    return names[platform.toLowerCase()] || platform
  }

  function getPlatformColor(platform: string) {
    const colors: Record<string, string> = {
      'wordpress': 'bg-blue-50 text-blue-700 border-blue-200',
      'devto': 'bg-neutral-50 text-neutral-700 border-neutral-200',
      'hashnode': 'bg-blue-50 text-blue-700 border-blue-200',
      'ghost': 'bg-neutral-50 text-neutral-700 border-neutral-200',
      'wix': 'bg-orange-50 text-orange-700 border-orange-200',
    }
    return colors[platform.toLowerCase()] || 'bg-neutral-50 text-neutral-700 border-neutral-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500">No data available</p>
          <Button onClick={fetchPlatformAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const platformStats = analytics.byPlatform?.find((p: any) =>
    p.platform.toLowerCase() === (platform as string).toLowerCase()
  )

  const chartData = articles.map((article) => {
    const platformData = article.platforms.find(p =>
      p.platform.toLowerCase() === (platform as string).toLowerCase()
    )
    return {
      name: article.articleTitle.length > 30
        ? article.articleTitle.substring(0, 30) + '...'
        : article.articleTitle,
      views: platformData?.views || 0,
      likes: platformData?.likes || 0,
      comments: platformData?.comments || 0,
    }
  })

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/analytics?tab=platforms')}
          className="mb-4 text-[13px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Platform Analytics
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">
                {platformName} Analytics
              </h1>
              <Badge variant="outline" className={`${getPlatformColor(platform as string)} text-[12px]`}>
                {platformName}
              </Badge>
            </div>
            <p className="text-[13px] text-neutral-500">
              Detailed performance metrics for {platformName}
            </p>
            {analytics.lastSync && (
              <p className="text-[11px] text-neutral-400 mt-1">
                Last synced: {new Date(analytics.lastSync).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Button
              onClick={() => router.push('/dashboard/analytics?tab=compare')}
              variant="outline"
              className="h-9 w-full text-[13px] sm:w-auto"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compare Platforms
            </Button>
            <Button
              onClick={syncAnalytics}
              disabled={syncing}
              className="h-9 w-full bg-emerald-600 text-[13px] hover:bg-emerald-700 sm:w-auto"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Overview Stats */}
      {platformStats && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">
                  Total
                </Badge>
              </div>
              <div className="text-[28px] font-bold text-neutral-900 mb-1">
                {platformStats.totalViews.toLocaleString()}
              </div>
              <div className="text-[12px] text-neutral-500">Total Views</div>
              <div className="text-[11px] text-neutral-400 mt-2">
                {platformStats.articles > 0
                  ? `Avg ${Math.round(platformStats.totalViews / platformStats.articles)} per article`
                  : 'No articles'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-600" />
                </div>
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[11px]">
                  Engagement
                </Badge>
              </div>
              <div className="text-[28px] font-bold text-neutral-900 mb-1">
                {platformStats.totalLikes.toLocaleString()}
              </div>
              <div className="text-[12px] text-neutral-500">Total Likes</div>
              <div className="text-[11px] text-neutral-400 mt-2">
                {platformStats.totalViews > 0
                  ? `${((platformStats.totalLikes / platformStats.totalViews) * 100).toFixed(2)}% engagement rate`
                  : 'No data'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px]">
                  Interaction
                </Badge>
              </div>
              <div className="text-[28px] font-bold text-neutral-900 mb-1">
                {platformStats.totalComments.toLocaleString()}
              </div>
              <div className="text-[12px] text-neutral-500">Total Comments</div>
              <div className="text-[11px] text-neutral-400 mt-2">
                {platformStats.articles > 0
                  ? `Avg ${(platformStats.totalComments / platformStats.articles).toFixed(1)} per article`
                  : 'No articles'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                  Published
                </Badge>
              </div>
              <div className="text-[28px] font-bold text-neutral-900 mb-1">
                {platformStats.articles}
              </div>
              <div className="text-[12px] text-neutral-500">Articles Published</div>
              <div className="text-[11px] text-neutral-400 mt-2">
                On {platformName}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Charts */}
      {chartData.length > 0 && (
        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                Views per Article
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="views" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                Engagement Metrics
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="likes" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="comments" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Articles List */}
      <div>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
          Articles on {platformName}
        </h2>
        <div className="space-y-4">
          {articles
            .sort((a, b) => {
              const aData = a.platforms.find(p => p.platform.toLowerCase() === (platform as string).toLowerCase())
              const bData = b.platforms.find(p => p.platform.toLowerCase() === (platform as string).toLowerCase())
              return (bData?.views || 0) - (aData?.views || 0)
            })
            .map((article) => {
              const platformData = article.platforms.find(p =>
                p.platform.toLowerCase() === (platform as string).toLowerCase()
              )

              if (!platformData) return null

              return (
                <Card key={article.articleId} className="border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-[14px] font-semibold text-neutral-900 mb-2">
                          {article.articleTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {platformData.views.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {platformData.likes} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {platformData.comments} comments
                          </span>
                        </div>
                      </div>
                      {platformData.url && (
                        <a
                          href={platformData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4"
                        >
                          <Button variant="outline" size="sm" className="text-[12px]">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* Engagement Rate */}
                    <div className="pt-3 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-500">Engagement Rate:</span>
                        <span className="font-medium text-emerald-600">
                          {platformData.views > 0
                            ? `${((platformData.likes / platformData.views) * 100).toFixed(2)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      {articles.length === 0 && (
        <Card className="border border-neutral-200 shadow-sm p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-[16px] font-semibold mb-2 text-neutral-900">No Analytics Yet</h3>
          <p className="text-[13px] text-neutral-500 mb-6">
            Publish some articles to {platformName} and sync analytics to see your performance data
          </p>
          <Button
            onClick={syncAnalytics}
            disabled={syncing}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Analytics
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  )
}
