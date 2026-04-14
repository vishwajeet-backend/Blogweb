"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  AlignLeft,
  Send,
  BarChart3,
  Command,
  Users2,
  Settings,
  HelpCircle,
  Star,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/context/AuthContext"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function DashboardSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const navGroups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: "CONTENT",
      items: [
        { name: "Articles", href: "/dashboard/articles", icon: AlignLeft },
        { name: "Blogs", href: "/dashboard/blogs", icon: LayoutDashboard },
        { name: "Publishing", href: "/dashboard/integrations", icon: Send },
      ],
    },
    {
      label: "DATA",
      items: [
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "Integrations", href: "/dashboard/integrations", icon: Command },
      ],
    },
    {
      label: "SYSTEM",
      items: [
        { name: "Team", href: "/dashboard/team", icon: Users2 },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ]

  const adminNavItems: NavItem[] = user?.role === "ADMIN"
    ? [{ name: "Admin Panel", href: "/admin/users", icon: ShieldCheck }]
    : []

  return (
    <aside
      className={cn(
        "flex h-screen w-[280px] flex-col justify-between border-r border-[#E9E9E9] bg-[rgba(215,211,207,0.20)] px-5 pb-5 backdrop-blur-[12px] dark:border-[#2A2A2A] dark:bg-[rgba(28,28,28,0.74)]",
        className,
      )}
      style={{ fontFamily: "Satoshi, var(--font-geist-sans), sans-serif" }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-10">
        <div className="flex h-14 items-center border-b border-[#E9E9E9] px-2.5">
          <Link href="/dashboard" className="text-[34px] font-black uppercase tracking-[-0.04em] text-[#FB6503]">
            LOGOIPSUM
          </Link>
        </div>

        <nav className="space-y-2 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-3 py-4 text-base font-medium ${
              pathname === "/dashboard" ? "bg-[#FFFAF3] text-black dark:bg-[#2A2A2A] dark:text-white" : "text-[#212121] dark:text-[#E5E5E5]"
            }`}
          >
            <LayoutDashboard className="h-6 w-6" />
            Dashboard
          </Link>

          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1.5 pt-1">
              <p className="px-3 text-[13px] font-bold uppercase text-[#4D4D4D] dark:text-[#B3B3B3]">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-4 text-base font-medium transition-colors ${
                      active
                        ? "bg-[#FFFAF3] text-black dark:bg-[#2A2A2A] dark:text-white"
                        : "text-[#212121] hover:bg-[#FFFBF7] dark:text-[#E5E5E5] dark:hover:bg-[#242424]"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          ))}

          {adminNavItems.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="px-3 text-[13px] font-bold uppercase text-[#4D4D4D] dark:text-[#B3B3B3]">ADMIN</p>
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-4 text-base font-medium transition-colors ${
                      active
                        ? "bg-[#FFFAF3] text-black dark:bg-[#2A2A2A] dark:text-white"
                        : "text-[#212121] hover:bg-[#FFFBF7] dark:text-[#E5E5E5] dark:hover:bg-[#242424]"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
        </nav>
      </div>

      <div className="space-y-2.5">
        <Link
          href="/dashboard/help"
          onClick={onNavigate}
          className="flex h-14 items-center justify-center gap-2.5 border-t border-[#E9E9E9] px-2.5 text-base font-medium text-[#212121] dark:border-[#2A2A2A] dark:text-[#E5E5E5]"
        >
          <HelpCircle className="h-6 w-6" />
          Help &amp; Docs
        </Link>

        <button
          onClick={() => router.push("/pricing")}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[26px] border-b border-[#BABABA] bg-[#FB6503] text-base font-medium text-[#FFFEFD]"
        >
          <Star className="h-5 w-5" />
          UPGRADE PLAN
        </button>
      </div>
    </aside>
  )
}
