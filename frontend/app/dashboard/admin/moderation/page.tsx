"use client"

export default function DashboardAdminModerationPage() {
  return (
    <div className="h-full w-full bg-[#FAF9F6]">
      <iframe
        src="/admin/moderation?embedded=1"
        title="Admin Moderation"
        className="h-[calc(100vh-56px)] w-full border-0"
      />
    </div>
  )
}
