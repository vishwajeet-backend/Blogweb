"use client"

export default function DashboardAdminSettingsPage() {
  return (
    <div className="h-full w-full bg-[#FAF9F6]">
      <iframe
        src="/admin/settings?embedded=1"
        title="Admin Profile Settings"
        className="h-[calc(100vh-56px)] w-full border-0"
      />
    </div>
  )
}
