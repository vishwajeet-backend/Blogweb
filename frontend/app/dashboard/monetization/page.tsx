"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Zap, TrendingUp, Eye, Send, Layers, Calendar } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { toast } from "sonner"

type SubscriptionUsage = {
  plan: string
  articlesThisMonth: number
  maxArticlesPerMonth: number
  drafts: number
  maxDrafts: number
  platformConnections: number
  maxPlatformConnections: number
  isOverLimit: boolean
}

type UserStats = {
  articles?: {
    total: number
    published: number
    draft: number
    totalViews: number
  }
  platforms?: {
    connected: number
    publishingRate: number
  }
  recentActivity?: {
    platformPublishes: number
  }
}

type CurrentUser = {
  subscriptionPlan?: string
  subscriptionStatus?: string
}

function progressPercent(value: number, max: number) {
  if (max <= 0) return 0
  return Math.min(100, Math.round((value / max) * 100))
}

function planBadgeVariant(plan?: string): "default" | "secondary" | "destructive" | "outline" | "success" {
  if (plan === "PROFESSIONAL") return "success"
  if (plan === "CREATOR") return "default"
  if (plan === "STARTER") return "secondary"
  return "outline"
}

export default function MonetizationPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")

      const [usageRes, statsRes, meRes] = await Promise.all([
        fetch("/api/user/subscription-usage", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/user/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData?.data || null)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData?.data || null)
      }

      if (meRes.ok) {
        const meData = await meRes.json()
        setCurrentUser(meData?.data?.user || null)
      }
    } catch (error) {
      console.error("Failed to load monetization data", error)
      toast.error("Failed to load monetization data")
    } finally {
      setLoading(false)
    }
  }

  const limits = useMemo(() => {
    const articlesUsed = usage?.articlesThisMonth || 0
    const draftsUsed = usage?.drafts || 0
    const connectionsUsed = usage?.platformConnections || 0

    const maxArticles = usage?.maxArticlesPerMonth || 0
    const maxDrafts = usage?.maxDrafts || 0
    const maxConnections = usage?.maxPlatformConnections || 0

    return {
      articlesUsed,
      draftsUsed,
      connectionsUsed,
      maxArticles,
      maxDrafts,
      maxConnections,
      articlesPct: maxArticles === -1 ? 0 : progressPercent(articlesUsed, maxArticles),
      draftsPct: maxDrafts === -1 ? 0 : progressPercent(draftsUsed, maxDrafts),
      connectionsPct: maxConnections === -1 ? 0 : progressPercent(connectionsUsed, maxConnections),
    }
  }, [usage])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Monetization & Plan Usage</h1>
          <p className="mt-1 text-neutral-600">Live subscription, publishing, and growth metrics from your account</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={planBadgeVariant(currentUser?.subscriptionPlan)}>
            {currentUser?.subscriptionPlan || usage?.plan || "FREE"}
          </Badge>
          <Badge variant="outline">{currentUser?.subscriptionStatus || "ACTIVE"}</Badge>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.articles?.totalViews || 0).toLocaleString()}</div>
            <p className="mt-1 text-xs text-neutral-600">Across all articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published Articles</CardTitle>
            <Send className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.articles?.published || 0).toLocaleString()}</div>
            <p className="mt-1 text-xs text-neutral-600">Total published content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            <Layers className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.platforms?.connected || usage?.platformConnections || 0).toLocaleString()}</div>
            <p className="mt-1 text-xs text-neutral-600">Active publishing channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">30d Publishes</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.recentActivity?.platformPublishes || 0).toLocaleString()}</div>
            <p className="mt-1 text-xs text-neutral-600">Platform publish events</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Monthly Article Usage
            </CardTitle>
            <CardDescription>Articles created in the current billing month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{limits.articlesUsed} used</span>
              <span>{limits.maxArticles === -1 ? "Unlimited" : `${limits.maxArticles} max`}</span>
            </div>
            {limits.maxArticles !== -1 && (
              <div className="h-2 rounded bg-neutral-100">
                <div className="h-2 rounded bg-emerald-500" style={{ width: `${limits.articlesPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Draft Capacity
            </CardTitle>
            <CardDescription>Current draft usage against plan limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{limits.draftsUsed} drafts</span>
              <span>{limits.maxDrafts === -1 ? "Unlimited" : `${limits.maxDrafts} max`}</span>
            </div>
            {limits.maxDrafts !== -1 && (
              <div className="h-2 rounded bg-neutral-100">
                <div className="h-2 rounded bg-blue-500" style={{ width: `${limits.draftsPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Integration Capacity
            </CardTitle>
            <CardDescription>Connected platforms compared to your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{limits.connectionsUsed} connected</span>
              <span>{limits.maxConnections === -1 ? "Unlimited" : `${limits.maxConnections} max`}</span>
            </div>
            {limits.maxConnections !== -1 && (
              <div className="h-2 rounded bg-neutral-100">
                <div className="h-2 rounded bg-orange-500" style={{ width: `${limits.connectionsPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Actions</CardTitle>
          <CardDescription>Manage billing, integrations, and content growth settings</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/pricing")}>Upgrade Plan</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/integrations")}>Manage Integrations</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/articles")}>Manage Articles</Button>
        </CardContent>
      </Card>
    </div>
  )
}
