"use client"

export default function DashboardAdminUsersPage() {
  return (
    <div className="h-full w-full bg-[#FAF9F6]">
      <iframe
        src="/admin/users?embedded=1"
        title="Admin User Management"
        className="h-[calc(100vh-56px)] w-full border-0"
      />
    </div>
  )
}
