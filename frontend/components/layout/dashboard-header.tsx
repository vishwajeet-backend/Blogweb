"use client"

import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Sun } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className="flex h-14 items-center justify-between border-b border-[#E9E9E9] bg-[rgba(255,255,255,0.86)] px-3 backdrop-blur dark:border-[#2A2A2A] dark:bg-[rgba(20,20,20,0.86)] sm:px-5"
      style={{ fontFamily: "Satoshi, var(--font-geist-sans), sans-serif" }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-1 text-[#212121] md:hidden dark:text-[#E5E5E5]"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex w-[170px] items-center gap-2.5 rounded-[28px] border border-[#E45C03] px-2.5 py-2 shadow-[0_2px_2px_0_#FECFB1] sm:w-[280px] lg:w-[374px] dark:border-[#FC8435] dark:bg-[#1E1E1E] dark:shadow-none">
        <Search className="h-[18px] w-[18px] text-[#999999]" />
        <input
          type="text"
          placeholder="Search Documentation"
          className="w-full bg-transparent text-sm font-medium text-[#212121] placeholder:text-[#999999] outline-none dark:text-[#F7F7F7] sm:text-base"
        />
      </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 lg:gap-10">
        <div className="flex items-center gap-3 text-[#212121] sm:gap-5 dark:text-[#E5E5E5]">
          <button type="button" onClick={toggleTheme} className="rounded-full p-1" aria-label="Toggle dark mode">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Bell className="h-6 w-6" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden w-[100px] text-right leading-tight sm:block">
            <p className="text-base font-medium text-black dark:text-white">{user?.name || "Isabella V."}</p>
            <p className="text-[13px] font-medium text-[#6A6A6A] dark:text-[#B3B3B3]">Editor in Chief</p>
          </div>

          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="h-[34px] w-[34px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#FB6503] text-xs font-bold text-white">
              {user ? initials(user.name) : "IV"}
            </div>
          )}

          <ChevronDown className="hidden h-[18px] w-[18px] text-[#6A6A6A] sm:block dark:text-[#B3B3B3]" />

          <button
            onClick={logout}
            className="rounded-lg p-2 text-[#6A6A6A] hover:bg-[#FFFAF3] dark:text-[#B3B3B3] dark:hover:bg-[#242424]"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
