"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CalendarClock, ImagePlus, Loader2, Save, Send, Settings2 } from "lucide-react"
import { toast } from "sonner"

export default function NewArticlePage() {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["PublishType", "WordPress"])
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    seoTitle: "",
    seoDescription: "",
  })

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    )
  }

  const handleFeaturedImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const token = localStorage.getItem("accessToken")
      const uploadForm = new FormData()
      uploadForm.append("file", file)
      uploadForm.append("alt", formData.title || "Featured image")
      uploadForm.append("optimize", "true")

      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadForm,
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image")
      }

      setFormData((prev) => ({ ...prev, featuredImage: data.url || data.data?.url || "" }))
      toast.success("Featured image uploaded")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedTitle = (formData.title || formData.seoTitle || "").trim()

    if (!normalizedTitle) {
      toast.error("Article Title is required (or fill SEO Title)")
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: normalizedTitle,
          excerpt: formData.excerpt,
          content: formData.content,
          featuredImage: formData.featuredImage || null,
          metaTitle: formData.seoTitle || null,
          metaDescription: formData.seoDescription || null,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("Article created successfully")
        router.push(`/dashboard/articles/${data.data.article.id}`)
        return
      }

      throw new Error(data.error || "Failed to create article")
    } catch (error: any) {
      toast.error(error.message || "Failed to create article")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-full bg-[#F7F8FA] px-3 py-4 text-[#1D2433] dark:bg-[#141414] dark:text-[#ECECEC] sm:px-5 sm:py-6"
      style={{ fontFamily: "Satoshi, var(--font-geist-sans), sans-serif" }}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E6E8EE] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#1D2433] transition hover:bg-[#FFFAF3] dark:border-[#343434] dark:bg-[#1E1E1E] dark:text-[#F4F4F4] dark:hover:bg-[#242424]"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E6E8EE] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#1D2433] transition hover:bg-[#FFFAF3] dark:border-[#343434] dark:bg-[#1E1E1E] dark:text-[#F4F4F4] dark:hover:bg-[#242424]"
            >
              <CalendarClock size={16} /> Schedule
            </button>

            <button
              type="submit"
              form="new-article-form"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A33] px-3.5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#E45C03] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={16} /> {loading ? "Creating..." : "Save Draft"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_1fr] xl:gap-[18px]">
          <form
            id="new-article-form"
            onSubmit={handleSubmit}
            className="rounded-[24px] border border-[#E6E8EE] bg-white p-4 shadow-sm dark:border-[#343434] dark:bg-[#1E1E1E] sm:rounded-[30px] sm:p-6 lg:p-[30px]"
          >
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  Article Title
                </p>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter your article title"
                  className="w-full border-none bg-transparent p-0 text-[34px] font-extrabold leading-[1.1] text-[#161922] outline-none placeholder:text-[#A5ADBA] dark:text-[#F6F6F6] dark:placeholder:text-[#7D8591] sm:text-[40px]"
                />
              </div>

              <div className="rounded-[18px] border border-dashed border-[#D7DBE4] p-4 dark:border-[#3C3C3C]">
                <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  Featured Image
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <input
                    value={formData.featuredImage}
                    onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                    placeholder="Paste image URL"
                    className="min-w-[220px] flex-1 rounded-xl border border-[#E6E8EE] bg-[#FBFCFE] px-3 py-2.5 text-sm text-[#1D2433] outline-none placeholder:text-[#9AA3B2] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2] dark:placeholder:text-[#868E99]"
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleFeaturedImageUpload(file)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E6E8EE] bg-white px-3 py-2.5 text-[13px] font-bold text-[#1D2433] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F4F4F4] disabled:opacity-70"
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />} Upload
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  Excerpt
                </p>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  placeholder="Short summary shown in previews"
                  className="w-full resize-y rounded-[14px] border border-[#E6E8EE] bg-[#FBFCFE] px-3.5 py-3 text-sm text-[#1D2433] outline-none placeholder:text-[#9AA3B2] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2] dark:placeholder:text-[#868E99]"
                />
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  Content
                </p>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                  placeholder="Start writing your article..."
                  className="w-full resize-y rounded-2xl border border-[#E6E8EE] bg-white px-4 py-3.5 text-[15px] leading-7 text-[#1D2433] outline-none placeholder:text-[#9AA3B2] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2] dark:placeholder:text-[#868E99]"
                />
              </div>
            </div>
          </form>

          <aside className="rounded-[24px] border border-[#E6E8EE] bg-white p-4 shadow-sm dark:border-[#343434] dark:bg-[#1E1E1E] sm:rounded-[30px] sm:p-6 lg:p-[26px]">
            <div className="space-y-5">
              <div className="border-b border-[#F0F2F7] pb-4 dark:border-[#2D2D2D]">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[#111827] dark:text-[#F2F2F2]">
                  <Send size={16} color="#ff7a33" /> Publication
                </h3>
                <p className="mt-1.5 text-[13px] text-[#6B7280] dark:text-[#A6A6A6]">
                  Configure channels and SEO details before publishing.
                </p>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  SEO Title
                </p>
                <input
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="SEO optimized title"
                  className="w-full rounded-xl border border-[#E6E8EE] bg-[#FBFCFE] px-3 py-2.5 text-sm text-[#1D2433] outline-none placeholder:text-[#9AA3B2] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2] dark:placeholder:text-[#868E99]"
                />
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  SEO Description
                </p>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  rows={4}
                  placeholder="Meta description"
                  className="w-full resize-y rounded-xl border border-[#E6E8EE] bg-[#FBFCFE] px-3 py-2.5 text-sm text-[#1D2433] outline-none placeholder:text-[#9AA3B2] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2] dark:placeholder:text-[#868E99]"
                />
              </div>

              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#8F96A3] dark:text-[#9CA3AF]">
                  Distribution Channels
                </p>
                <div className="grid gap-2">
                  {["PublishType", "WordPress", "Ghost", "Hashnode", "Dev.to"].map((channel) => {
                    const isSelected = selectedChannels.includes(channel)
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleChannel(channel)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition ${
                          isSelected
                            ? "border border-[#FFB087] bg-[#FFF3EA] text-[#202736] dark:border-[#D08A5F] dark:bg-[#2E2118] dark:text-[#F2F2F2]"
                            : "border border-[#E6E8EE] bg-white text-[#202736] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F2F2F2]"
                        }`}
                      >
                        {channel}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E6E8EE] bg-white px-3 py-2.5 text-[13px] font-bold text-[#1D2433] dark:border-[#3B3B3B] dark:bg-[#242424] dark:text-[#F4F4F4]"
                >
                  <Settings2 size={16} /> Settings
                </button>

                <button
                  type="submit"
                  form="new-article-form"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#121827] px-3 py-2.5 text-[13px] font-extrabold text-white dark:bg-[#FB6503] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
