"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { AuthGuard } from "@/components/AuthGuard"

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
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu overlay"
            />
            <DashboardSidebar className="relative z-10" onNavigate={() => setMobileSidebarOpen(false)} />
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
