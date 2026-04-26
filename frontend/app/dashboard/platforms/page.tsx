"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckCircle2, Loader2, Settings } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { toast } from "sonner"

type PlatformConnection = {
  id: string
  platform: string
  status: string
  metadata?: {
    siteUrl?: string
    blogUrl?: string
    username?: string
  }
  lastSyncAt?: string
}

type PlatformMetric = {
  published: number
  total: number
  successRate: number
}

type PlatformCard = {
  key: string
  name: string
  description: string
  connected: boolean
  connectionId?: string
  siteUrl?: string | null
  lastSync?: string | null
  publishedCount: number
  successRate: number
}

const PLATFORM_DEFS = [
  { key: "WORDPRESS", name: "WordPress", description: "Popular blogging platform" },
  { key: "MEDIUM", name: "Medium", description: "Professional publishing platform" },
  { key: "DEVTO", name: "Dev.to", description: "Developer community" },
  { key: "HASHNODE", name: "Hashnode", description: "Blogging for developers" },
  { key: "LINKEDIN", name: "LinkedIn", description: "Professional network" },
  { key: "GHOST", name: "Ghost", description: "Independent publishing" },
  { key: "WIX", name: "Wix", description: "Website publishing platform" },
]

function relativeSyncLabel(isoDate?: string) {
  if (!isoDate) return "Never"
  const ts = new Date(isoDate).getTime()
  const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000))
  if (diffMins < 60) return `${diffMins} mins ago`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

export default function PlatformsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [metrics, setMetrics] = useState<Record<string, PlatformMetric>>({})
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")

      const [connectionsRes, statsRes] = await Promise.all([
        fetch("/api/platforms/connections", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/user/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (connectionsRes.ok) {
        const data = await connectionsRes.json()
        setConnections(data?.data?.connections || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const rows = statsData?.data?.platforms?.stats || []
        const nextMetrics: Record<string, PlatformMetric> = {}

        for (const row of rows) {
          const total = Number(row.total || 0)
          const published = Number(row.published || 0)
          nextMetrics[row.platform] = {
            published,
            total,
            successRate: total > 0 ? Math.round((published / total) * 100) : 0,
          }
        }

        setMetrics(nextMetrics)
      }
    } catch (error) {
      console.error("Failed to load platforms", error)
      toast.error("Failed to load platform data")
    } finally {
      setLoading(false)
    }
  }

  async function disconnectPlatform(connectionId: string, platformName: string) {
    if (!confirm(`Disconnect ${platformName}?`)) return

    try {
      setDisconnectingId(connectionId)
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/platforms/connections/${connectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        toast.error(data.error || `Failed to disconnect ${platformName}`)
        return
      }

      toast.success(`${platformName} disconnected`)
      await fetchData()
    } catch (error) {
      console.error("Disconnect failed", error)
      toast.error(`Failed to disconnect ${platformName}`)
    } finally {
      setDisconnectingId(null)
    }
  }

  const cards = useMemo<PlatformCard[]>(() => {
    return PLATFORM_DEFS.map((platform) => {
      const connection = connections.find((c) => c.platform === platform.key)
      const metric = metrics[platform.key]

      return {
        key: platform.key,
        name: platform.name,
        description: platform.description,
        connected: Boolean(connection),
        connectionId: connection?.id,
        siteUrl: connection?.metadata?.siteUrl || connection?.metadata?.blogUrl || connection?.metadata?.username || null,
        lastSync: connection?.lastSyncAt || null,
        publishedCount: metric?.published || 0,
        successRate: metric?.successRate || 0,
      }
    })
  }, [connections, metrics])

  const connectedCards = cards.filter((card) => card.connected)
  const availableCards = cards.filter((card) => !card.connected)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Publishing Platforms</h1>
        <p className="mt-1 text-neutral-600">Connect and manage your publishing destinations</p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Connected Platforms</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connectedCards.map((platform) => (
            <Card key={platform.key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      {platform.name}
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Connected
                      </Badge>
                    </CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-neutral-600">Site URL / Handle</p>
                    <p className="break-all text-sm font-medium">{platform.siteUrl || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Published Articles</p>
                    <p className="text-sm font-medium">{platform.publishedCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Last Sync</p>
                    <p className="text-sm font-medium">{relativeSyncLabel(platform.lastSync || undefined)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Success Rate</p>
                    <p className="text-sm font-medium">{platform.successRate}%</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/dashboard/integrations")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disconnectingId === platform.connectionId}
                      className="text-red-600 hover:text-red-700"
                      onClick={() => platform.connectionId && disconnectPlatform(platform.connectionId, platform.name)}
                    >
                      {disconnectingId === platform.connectionId ? "..." : "Disconnect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {connectedCards.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-8 text-center text-sm text-neutral-600">
                No platforms connected yet. Connect your first platform below.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Platforms</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableCards.map((platform) => (
            <Card key={platform.key} className="border-dashed">
              <CardHeader>
                <CardTitle>{platform.name}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => router.push("/dashboard/integrations")}>
                  <Plus className="h-4 w-4" />
                  Connect {platform.name}
                </Button>
                <p className="mt-3 text-center text-xs text-neutral-500">
                  Publish your content to {platform.name} with one click
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
