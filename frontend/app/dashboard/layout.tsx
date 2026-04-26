"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { AuthGuard } from "@/components/AuthGuard"
import { X } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-white dark:bg-[#131313]">
        {/* Sidebar - hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu overlay"
            />
            <div className="relative z-10 h-full w-[84vw] max-w-[320px] rounded-r-3xl shadow-2xl transition-transform duration-200">
              <button
                type="button"
                className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-[#212121] shadow"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
              <DashboardSidebar className="h-full w-full rounded-r-3xl" onNavigate={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden w-full">
          <DashboardHeader onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto w-full bg-white dark:bg-[#131313]">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
