"use client"

export default function DashboardAdminArticlesPage() {
  return (
    <div className="h-full w-full bg-[#FAF9F6]">
      <iframe
        src="/admin/articles?embedded=1"
        title="Admin Articles"
        className="h-[calc(100vh-56px)] w-full border-0"
      />
    </div>
  )
}
