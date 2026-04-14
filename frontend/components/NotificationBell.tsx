"use client"

import { useMemo, useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type NotificationItem = {
  id: string
  title: string
  message: string
  createdAt: string
  type: "info" | "success" | "warning" | "admin"
  href?: string
}

function timeAgo(iso: string) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<string[]>([])

  const readStorageKey = "notification-read-ids"

  const unreadCount = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds])

  function loadReadIds() {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(readStorageKey)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  function persistReadIds(nextReadIds: string[]) {
    setReadIds(nextReadIds)
    if (typeof window !== "undefined") {
      localStorage.setItem(readStorageKey, JSON.stringify(nextReadIds))
    }
  }

  async function fetchNotifications() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (response.ok && data.success) {
        const nextItems = data?.data?.notifications || []
        setItems(nextItems)
        const existingRead = loadReadIds()
        setReadIds(existingRead)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      await fetchNotifications()
    }
  }

  const markAllAsRead = () => {
    const nextReadIds = Array.from(new Set([...readIds, ...items.map((item) => item.id)]))
    persistReadIds(nextReadIds)
  }

  const markOneAsRead = (id: string) => {
    if (readIds.includes(id)) return
    persistReadIds([...readIds, id])
  }

  return (
    <div className="relative">
      <button type="button" onClick={toggleOpen} className="relative rounded-full p-1" aria-label="Open notifications">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#FB6503] px-1 text-center text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-[#E9E9E9] bg-white shadow-xl dark:border-[#2A2A2A] dark:bg-[#1E1E1E]">
          <div className="flex items-center justify-between border-b border-[#F3F4F6] px-3 py-2 dark:border-[#2A2A2A]">
            <p className="text-sm font-bold text-[#212121] dark:text-[#F2F2F2]">Notifications</p>
            <div className="flex items-center gap-3">
              <button onClick={markAllAsRead} className="text-xs font-bold text-[#FB6503]">Mark all read</button>
              <button onClick={() => setOpen(false)} className="text-xs text-[#6A6A6A]">Close</button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-[#6A6A6A]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-[#6A6A6A]">No notifications yet.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    markOneAsRead(item.id)
                    setOpen(false)
                    if (item.href) router.push(item.href)
                  }}
                  className={`w-full border-b border-[#F9FAFB] px-3 py-3 text-left last:border-b-0 hover:bg-[#FFFAF3] dark:border-[#2A2A2A] dark:hover:bg-[#242424] ${
                    readIds.includes(item.id) ? "opacity-70" : ""
                  }`}
                >
                  <p className="text-xs font-bold text-[#212121] dark:text-[#F2F2F2]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#52525B] dark:text-[#B5B5B5]">{item.message}</p>
                  <p className="mt-1 text-[10px] text-[#999999]">{timeAgo(item.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
