"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Loader2, Share2, Settings, Check } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"
import { GhostConnectModal } from "@/components/GhostConnectModal"
import { DevToConnectModal } from "@/components/DevToConnectModal"
import { HashnodeConnectModal } from "@/components/HashnodeConnectModal"
import { toast } from "sonner"

type PlatformConnection = {
  id: string
  platform: string
  status: string
  metadata: {
    blogUrl?: string
    displayName?: string
    username?: string
    apiUrl?: string
    siteName?: string
    siteUrl?: string
  }
  lastSyncAt: string
}

type PlatformPublishMetric = {
  published: number
  total: number
  successRate: number
}

type PlatformDef = {
  name: string
  type: "CMS" | "BLOGGING" | "SOCIAL MEDIA"
  key: string
  description: string
  connect: () => void
  comingSoon?: boolean
}

function relativeSyncLabel(isoDate?: string) {
  if (!isoDate) return "10 mins ago"
  const ts = new Date(isoDate).getTime()
  const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000))
  if (diffMins < 60) return `${diffMins} mins ago`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

function IntegrationsContent() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [platformMetrics, setPlatformMetrics] = useState<Record<string, PlatformPublishMetric>>({})
  const [loading, setLoading] = useState(true)
  const [connectingWordPress, setConnectingWordPress] = useState(false)
  const [connectingWix, setConnectingWix] = useState(false)
  const [showGhostModal, setShowGhostModal] = useState(false)
  const [showDevToModal, setShowDevToModal] = useState(false)
  const [showHashnodeModal, setShowHashnodeModal] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<"ALL" | "CMS" | "BLOGGING" | "SOCIAL MEDIA">("ALL")

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "wordpress_connected") {
      toast.success("WordPress.com connected successfully")
      router.replace("/dashboard/integrations")
      fetchConnections()
    } else if (success === "wix_connected") {
      toast.success("Wix connected successfully")
      router.replace("/dashboard/integrations")
      fetchConnections()
    }

    if (error) {
      toast.error("Connection failed")
      router.replace("/dashboard/integrations")
    }
  }, [searchParams, router])

  useEffect(() => {
    if (user) fetchConnections()
  }, [user])

  async function fetchConnections() {
    try {
      const token = localStorage.getItem("accessToken")
      const [connectionsResponse, statsResponse] = await Promise.all([
        fetch("/api/platforms/connections", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/user/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (connectionsResponse.ok) {
        const data = await connectionsResponse.json()
        setConnections(data.data.connections || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        const stats = statsData?.data?.platforms?.stats || []
        const metrics: Record<string, PlatformPublishMetric> = {}

        for (const row of stats) {
          const total = Number(row.total || 0)
          const published = Number(row.published || 0)
          metrics[row.platform] = {
            published,
            total,
            successRate: total > 0 ? Math.round((published / total) * 100) : 0,
          }
        }

        setPlatformMetrics(metrics)
      }
    } catch (error) {
      console.error("Error fetching connections:", error)
      toast.error("Failed to fetch connections")
    } finally {
      setLoading(false)
    }
  }

  function connectWordPress() {
    if (!user) return
    setConnectingWordPress(true)

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_WORDPRESS_CLIENT_ID || "",
      redirect_uri: `${window.location.origin}/api/oauth/wordpress/callback`,
      response_type: "code",
      state: user.id,
      scope: "posts",
    })

    window.location.href = `https://public-api.wordpress.com/oauth2/authorize?${params.toString()}`
  }

  async function connectWix() {
    if (!user) return

    try {
      setConnectingWix(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/oauth/wix", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        toast.error("Failed to initiate Wix connection")
        setConnectingWix(false)
      }
    } catch (_error) {
      toast.error("Failed to connect Wix")
      setConnectingWix(false)
    }
  }

  async function disconnectPlatform(connectionId: string, platform: string) {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/platforms/connections/${connectionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(`${platform} disconnected`)
        fetchConnections()
      }
    } catch (_error) {
      toast.error("Failed to disconnect platform")
    }
  }

  const platformDefinitions: PlatformDef[] = [
    {
      name: "Wordpress",
      type: "CMS",
      key: "WORDPRESS",
      description: "Connect your WordPress site and publish automatically.",
      connect: connectWordPress,
    },
    {
      name: "Ghost",
      type: "BLOGGING",
      key: "GHOST",
      description: "Modern publishing platform for professionals.",
      connect: () => setShowGhostModal(true),
    },
    {
      name: "Dev.to",
      type: "BLOGGING",
      key: "DEVTO",
      description: "Share technical articles with the developer community.",
      connect: () => setShowDevToModal(true),
    },
    {
      name: "Hashnode",
      type: "BLOGGING",
      key: "HASHNODE",
      description: "Publish to your Hashnode blog and personal domain.",
      connect: () => setShowHashnodeModal(true),
    },
    {
      name: "Wix",
      type: "CMS",
      key: "WIX",
      description: "Sync and publish content on your Wix site.",
      connect: connectWix,
    },
    {
      name: "LinkedIn",
      type: "SOCIAL MEDIA",
      key: "LINKEDIN",
      description: "Publish to your LinkedIn profile and company pages.",
      connect: () => {},
      comingSoon: true,
    },
  ]

  const connectedPlatforms = useMemo(
    () => platformDefinitions.filter((p) => connections.find((c) => c.platform === p.key)),
    [platformDefinitions, connections]
  )

  const availablePlatforms = useMemo(
    () => platformDefinitions.filter((p) => !connections.find((c) => c.platform === p.key)),
    [platformDefinitions, connections]
  )

  const filteredAvailable = useMemo(
    () => availablePlatforms.filter((p) => platformFilter === "ALL" || p.type === platformFilter),
    [availablePlatforms, platformFilter]
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#FB6503]" />
      </div>
    )
  }

  return (
    <>
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
              <h1 className="text-[32px] font-bold leading-none text-[#212121] md:text-[39px]">Platform Integrations</h1>
              <p className="mt-3 max-w-[520px] text-base font-medium text-[#6A6A6A]">
                Connect your favorite tools to automate your publishing workflows.
              </p>
            </div>

            <button
              onClick={() => document.getElementById("available-platforms")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 rounded-full bg-[#FB6503] px-8 py-3 text-base font-bold text-white"
            >
              <Plus className="h-5 w-5" />
              ADD NEW PLATFORMS
            </button>
          </div>

          <div className="mt-8">
            <h2 className="text-[31px] font-medium text-[#212121]">Connected Platforms</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {connectedPlatforms.slice(0, 3).map((platform) => {
                const conn = connections.find((item) => item.platform === platform.key)
                const metric = platformMetrics[platform.key] || { published: 0, successRate: 0, total: 0 }

                if (!conn) return null

                return (
                  <div key={platform.key} className="rounded-2xl border border-[#E9E9E9] bg-white px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-[#FFF0E6] p-2">
                          <Share2 className="h-4 w-4 text-[#FB6503]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[30px] font-medium text-[#212121]">{platform.name}</p>
                            <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#15803D]">Active</span>
                          </div>
                          <p className="text-xs text-[#6A6A6A]">{conn.metadata?.siteUrl || conn.metadata?.blogUrl || "eventique.com/blog"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 text-base">
                      <div className="flex justify-between">
                        <span className="text-[#4D4D4D]">Last synced</span>
                        <span className="text-[#212121]">{relativeSyncLabel(conn.lastSyncAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4D4D4D]">Article Published</span>
                        <span className="text-[#212121]">{metric.published.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-[#FFFBF7]">
                      <div className="h-1.5 rounded-full bg-[#FC8435]" style={{ width: `${Math.max(metric.successRate, 5)}%` }} />
                    </div>
                    <p className="mt-2 text-right text-base text-[#212121]">{metric.successRate}% success rate</p>

                    <div className="mt-6 flex items-center gap-2 border-t border-[#E9E9E9] pt-3">
                      <button
                        onClick={() => window.open(conn.metadata?.siteUrl || conn.metadata?.blogUrl || "#", "_blank")}
                        className="w-full rounded-full border border-[#FC8435] bg-[#FFF0E6] py-2.5 text-base font-bold text-[#212121]"
                      >
                        MANAGE
                      </button>
                      <button
                        onClick={() => disconnectPlatform(conn.id, platform.name)}
                        className="rounded-full border border-[#E9E9E9] p-2.5 text-[#4D4D4D]"
                        title="Disconnect"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {connectedPlatforms.length === 0 && (
                <div className="rounded-2xl border border-[#E9E9E9] bg-white px-4 py-8 text-base text-[#6A6A6A] xl:col-span-3">
                  No connected platforms yet.
                </div>
              )}
            </div>
          </div>

          <div id="available-platforms" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[31px] font-medium text-[#212121]">Available Platforms</h2>

              <div className="flex gap-2 rounded-full border border-[#E9E9E9] bg-[#FFFBF7] p-1.5">
                {(["ALL", "CMS", "BLOGGING", "SOCIAL MEDIA"] as const).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setPlatformFilter(chip)}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                      platformFilter === chip ? "bg-[#FB6503] text-white" : "bg-transparent text-[#212121]"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {filteredAvailable.map((platform) => (
                <div key={platform.key} className="flex min-h-[280px] flex-col justify-between gap-10 rounded-3xl border border-[#E9E9E9] bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-full bg-[#FFF7ED] p-1.5">
                        <div className="rounded-full bg-[#FFF0E6] p-2">
                          <Share2 className="h-4 w-4 text-[#FB6503]" />
                        </div>
                      </div>
                      <p className="text-[20px] font-bold text-[#1E1E1E]">{platform.name}</p>
                    </div>
                    <span className="rounded-full border border-[#E9E9E9] bg-[#FFFEFD] px-2 py-0.5 text-[10px] font-bold text-[#212121]">
                      {platform.type}
                    </span>
                  </div>

                  <p className="min-h-[64px] text-base font-medium text-[#4D4D4D]">{platform.description}</p>

                  <button
                    onClick={platform.connect}
                    disabled={
                      platform.comingSoon ||
                      (platform.key === "WORDPRESS" && connectingWordPress) ||
                      (platform.key === "WIX" && connectingWix)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-[100px] border border-[#FB6503] bg-[#FFF0E6] py-4 text-base font-bold text-[#1E1E1E] shadow-[0px_4px_6px_0px_#FFF0E6] disabled:cursor-not-allowed disabled:border-[#E9E9E9] disabled:bg-[#F8F8F8] disabled:text-[#999999]"
                  >
                    {platform.comingSoon ? (
                      "COMING SOON"
                    ) : (platform.key === "WORDPRESS" && connectingWordPress) ||
                      (platform.key === "WIX" && connectingWix) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> CONNECTING
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> CONNECT
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <GhostConnectModal open={showGhostModal} onClose={() => setShowGhostModal(false)} onSuccess={() => fetchConnections()} />
      <DevToConnectModal open={showDevToModal} onClose={() => setShowDevToModal(false)} onSuccess={() => fetchConnections()} />
      <HashnodeConnectModal open={showHashnodeModal} onClose={() => setShowHashnodeModal(false)} onSuccess={() => fetchConnections()} />
    </>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#FB6503]" />
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  )
}
