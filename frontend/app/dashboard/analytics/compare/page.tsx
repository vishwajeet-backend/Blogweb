"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  Heart,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Loader2,
  ArrowLeft,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface PlatformStat {
  platform: string
  totalViews: number
  totalLikes: number
  totalComments: number
  articles: number
}

export default function PlatformComparisonPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [platforms, setPlatforms] = useState<PlatformStat[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      fetchAllPlatforms()
    }
  }, [user])

  const fetchAllPlatforms = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPlatforms(data.data.byPlatform || [])
        // Select all platforms by default
        setSelectedPlatforms(data.data.byPlatform?.map((p: PlatformStat) => p.platform) || [])
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
        fetchAllPlatforms()
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

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  function getPlatformName(platform: string) {
    const names: Record<string, string> = {
      'WORDPRESS': 'WordPress',
      'DEVTO': 'Dev.to',
      'HASHNODE': 'Hashnode',
      'GHOST': 'Ghost',
      'WIX': 'Wix',
    }
    return names[platform] || platform
  }

  function getPlatformColor(platform: string) {
    const colors: Record<string, { bg: string, text: string, chart: string }> = {
      'WORDPRESS': { bg: 'bg-blue-50', text: 'text-blue-700', chart: '#3b82f6' },
      'DEVTO': { bg: 'bg-neutral-50', text: 'text-neutral-700', chart: '#525252' },
      'HASHNODE': { bg: 'bg-blue-50', text: 'text-blue-700', chart: '#2563eb' },
      'GHOST': { bg: 'bg-neutral-50', text: 'text-neutral-700', chart: '#737373' },
      'WIX': { bg: 'bg-orange-50', text: 'text-orange-700', chart: '#f97316' },
    }
    return colors[platform] || { bg: 'bg-neutral-50', text: 'text-neutral-700', chart: '#9ca3af' }
  }

  const filteredPlatforms = platforms.filter(p => selectedPlatforms.includes(p.platform))

  // Prepare data for charts
  const comparisonData = [
    {
      metric: 'Views',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [getPlatformName(p.platform), p.totalViews])
      )
    },
    {
      metric: 'Likes',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [getPlatformName(p.platform), p.totalLikes])
      )
    },
    {
      metric: 'Comments',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [getPlatformName(p.platform), p.totalComments])
      )
    },
    {
      metric: 'Articles',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [getPlatformName(p.platform), p.articles])
      )
    },
  ]

  // Normalize data for radar chart (0-100 scale)
  const maxValues = {
    views: Math.max(...filteredPlatforms.map(p => p.totalViews), 1),
    likes: Math.max(...filteredPlatforms.map(p => p.totalLikes), 1),
    comments: Math.max(...filteredPlatforms.map(p => p.totalComments), 1),
    articles: Math.max(...filteredPlatforms.map(p => p.articles), 1),
  }

  const radarData = [
    {
      metric: 'Views',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [
          getPlatformName(p.platform),
          Math.round((p.totalViews / maxValues.views) * 100)
        ])
      )
    },
    {
      metric: 'Likes',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [
          getPlatformName(p.platform),
          Math.round((p.totalLikes / maxValues.likes) * 100)
        ])
      )
    },
    {
      metric: 'Comments',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [
          getPlatformName(p.platform),
          Math.round((p.totalComments / maxValues.comments) * 100)
        ])
      )
    },
    {
      metric: 'Articles',
      ...Object.fromEntries(
        filteredPlatforms.map(p => [
          getPlatformName(p.platform),
          Math.round((p.articles / maxValues.articles) * 100)
        ])
      )
    },
  ]

  // Engagement rate comparison
  const engagementData = filteredPlatforms.map(p => ({
    name: getPlatformName(p.platform),
    rate: p.totalViews > 0 ? ((p.totalLikes / p.totalViews) * 100).toFixed(2) : 0,
    avgViewsPerArticle: p.articles > 0 ? Math.round(p.totalViews / p.articles) : 0,
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    )
  }

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
          Back to Analytics
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">
                Platform Comparison
              </h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[12px]">
                <BarChart3 className="h-3 w-3 mr-1" />
                Compare
              </Badge>
            </div>
            <p className="text-[13px] text-neutral-500">
              Compare performance metrics across all your publishing platforms
            </p>
          </div>
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
                Sync All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Platform Selection */}
      <Card className="border border-neutral-200 shadow-sm mb-8">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
            Select Platforms to Compare
          </h3>
          <div className="flex flex-wrap gap-4">
            {platforms.map((platform) => (
              <div key={platform.platform} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.platform}
                  checked={selectedPlatforms.includes(platform.platform)}
                  onCheckedChange={() => togglePlatform(platform.platform)}
                />
                <label
                  htmlFor={platform.platform}
                  className={`text-[13px] font-medium cursor-pointer ${getPlatformColor(platform.platform).text}`}
                >
                  {getPlatformName(platform.platform)}
                </label>
              </div>
            ))}
          </div>
          {selectedPlatforms.length === 0 && (
            <p className="text-[12px] text-amber-600 mt-3">
              Please select at least one platform to view comparisons
            </p>
          )}
        </CardContent>
      </Card>

      {selectedPlatforms.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {filteredPlatforms.map((platform) => (
              <Card key={platform.platform} className="border border-neutral-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <Badge
                      variant="outline"
                      className={`${getPlatformColor(platform.platform).bg} ${getPlatformColor(platform.platform).text} border-${getPlatformColor(platform.platform).text.replace('text-', '')} text-[11px]`}
                    >
                      {getPlatformName(platform.platform)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">Views:</span>
                      <span className="font-bold text-neutral-900">{platform.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">Likes:</span>
                      <span className="font-bold text-neutral-900">{platform.totalLikes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">Comments:</span>
                      <span className="font-bold text-neutral-900">{platform.totalComments.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-neutral-500">Articles:</span>
                      <span className="font-bold text-neutral-900">{platform.articles}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Charts */}
          <div className="grid gap-5 md:grid-cols-2 mb-8">
            {/* Bar Chart Comparison */}
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                  Metrics Comparison
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="metric" tick={{ fontSize: 12 }} stroke="#9ca3af" />
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
                    {filteredPlatforms.map((platform) => (
                      <Bar
                        key={platform.platform}
                        dataKey={getPlatformName(platform.platform)}
                        fill={getPlatformColor(platform.platform).chart}
                        radius={[8, 8, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border border-neutral-200 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                  Performance Overview (Normalized)
                </h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {filteredPlatforms.map((platform) => (
                      <Radar
                        key={platform.platform}
                        name={getPlatformName(platform.platform)}
                        dataKey={getPlatformName(platform.platform)}
                        stroke={getPlatformColor(platform.platform).chart}
                        fill={getPlatformColor(platform.platform).chart}
                        fillOpacity={0.3}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Rate Comparison */}
          <Card className="border border-neutral-200 shadow-sm mb-8">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                Engagement Rate & Average Views
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} name="Engagement Rate (%)" />
                  <Bar yAxisId="right" dataKey="avgViewsPerArticle" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Avg Views/Article" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card className="border border-neutral-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">
                Detailed Metrics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">Platform</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Views</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Likes</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Comments</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Articles</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Avg Views</th>
                      <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlatforms.map((platform) => (
                      <tr key={platform.platform} className="border-b border-neutral-100">
                        <td className="py-3">
                          <Badge
                            variant="outline"
                            className={`${getPlatformColor(platform.platform).bg} ${getPlatformColor(platform.platform).text} text-[11px]`}
                          >
                            {getPlatformName(platform.platform)}
                          </Badge>
                        </td>
                        <td className="text-right text-[13px] font-medium text-neutral-900">{platform.totalViews.toLocaleString()}</td>
                        <td className="text-right text-[13px] font-medium text-neutral-900">{platform.totalLikes.toLocaleString()}</td>
                        <td className="text-right text-[13px] font-medium text-neutral-900">{platform.totalComments.toLocaleString()}</td>
                        <td className="text-right text-[13px] font-medium text-neutral-900">{platform.articles}</td>
                        <td className="text-right text-[13px] font-medium text-neutral-900">
                          {platform.articles > 0 ? Math.round(platform.totalViews / platform.articles).toLocaleString() : 0}
                        </td>
                        <td className="text-right text-[13px] font-medium text-emerald-600">
                          {platform.totalViews > 0 ? `${((platform.totalLikes / platform.totalViews) * 100).toFixed(2)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {platforms.length === 0 && (
        <Card className="border border-neutral-200 shadow-sm p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-[16px] font-semibold mb-2 text-neutral-900">No Platforms to Compare</h3>
          <p className="text-[13px] text-neutral-500 mb-6">
            Publish articles to different platforms and sync analytics to start comparing
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
