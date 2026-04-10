"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Loader2,
  Moon,
  MoreVertical,
  Search,
  Square,
  Sun,
  UploadCloud,
} from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { useTheme } from "@/lib/context/ThemeContext"
import { toast } from "sonner"

type Article = {
  id: string
  title: string
  content: string
  excerpt: string | null
  status: string
  slug: string
  scheduleAt?: string | null
  featuredImage?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
}

export default function ArticleEditorPage() {
  const { user, loading: authLoading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const params = useParams()
  const router = useRouter()
  const articleId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [publishDate, setPublishDate] = useState("")
  const [slug, setSlug] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [focusKeyword, setFocusKeyword] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const featuredImageInputRef = useRef<HTMLInputElement>(null)

  const [channelWedding, setChannelWedding] = useState(true)
  const [channelLinkedIn, setChannelLinkedIn] = useState(false)
  const [channelInstagram, setChannelInstagram] = useState(false)

  const [settingWedding, setSettingWedding] = useState(true)
  const [settingLinkedIn, setSettingLinkedIn] = useState(true)
  const [settingInstagramA, setSettingInstagramA] = useState(false)
  const [settingInstagramB, setSettingInstagramB] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && articleId) {
      if (articleId === "new") {
        router.replace("/dashboard/articles/new")
        return
      }
      fetchArticle()
    }
  }, [user, articleId])

  async function fetchArticle() {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/articles/${articleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load article")
      }

      const article: Article = data.data.article
      setTitle(article.title || "")
      setContent(article.content || "")
      setStatus(article.status || "DRAFT")
      setSlug(article.slug || "")
      setPublishDate(article.scheduleAt ? new Date(article.scheduleAt).toISOString().slice(0, 10) : "")
      setFeaturedImage(article.featuredImage || "")
      setMetaDescription(article.metaDescription || "")
      setFocusKeyword(article.focusKeyword || "")
    } catch (error: any) {
      toast.error(error.message || "Failed to load article")
      router.replace("/dashboard/articles")
    } finally {
      setLoading(false)
    }
  }

  async function saveArticle(nextStatus?: string) {
    try {
      setSaving(true)
      const token = localStorage.getItem("accessToken")

      const payload = {
        title,
        content,
        status: nextStatus || status,
        slug,
        scheduleAt: publishDate ? new Date(publishDate).toISOString() : null,
        featuredImage: featuredImage || null,
        metaDescription: metaDescription || null,
        focusKeyword: focusKeyword || null,
      }

      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save article")
      }

      if (nextStatus) setStatus(nextStatus)
      toast.success(nextStatus === "PUBLISHED" ? "Article published" : "Draft saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save article")
    } finally {
      setSaving(false)
    }
  }

  async function handleFeaturedImageUpload(file: File) {
    try {
      setUploadingImage(true)
      const token = localStorage.getItem("accessToken")
      const uploadForm = new FormData()
      uploadForm.append("file", file)
      uploadForm.append("articleId", articleId)
      uploadForm.append("alt", title || "Featured image")
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

      setFeaturedImage(data.url || data.data?.url || "")
      toast.success("Featured image uploaded")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  async function deleteArticle() {
    if (!confirm("Are you sure you want to delete this article?")) return

    try {
      setDeleting(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete article")
      }

      toast.success("Article deleted")
      router.replace("/dashboard/articles")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete article")
    } finally {
      setDeleting(false)
    }
  }

  const words = useMemo(() => {
    if (!content.trim()) return 0
    return content.trim().split(/\s+/).length
  }, [content])

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(words / 200))
  }, [words])

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#FB6503]" />
      </div>
    )
  }

  return (
    <div
      className="min-h-full bg-[#FFFEFD] text-[#212121] dark:bg-[#161616] dark:text-[#F2F2F2]"
      style={{
        fontFamily: "Satoshi, var(--font-geist-sans), sans-serif",
        backgroundImage:
          isDark
            ? "linear-gradient(rgba(10,10,10,0.8), rgba(10,10,10,0.8)), url('/design/BG%2023-01%202.png')"
            : "linear-gradient(rgba(255,255,255,0.76), rgba(255,255,255,0.76)), url('/design/BG%2023-01%202.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <header className="border-b border-[#E9E9E9] bg-[#FFFEFD] px-4 py-3 dark:border-[#2A2A2A] dark:bg-[#161616] md:px-6">
        <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:gap-4">
          <button onClick={() => router.push("/dashboard/articles")} className="flex min-w-0 items-center gap-2 text-sm text-[#212121] dark:text-[#F7F7F7]">
            <ArrowLeft className="h-4 w-4" />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-black dark:text-white sm:text-base">{title || "Wedding Trends 2026"}</p>
              <p className="text-[10px] font-bold text-[#6A6A6A]">DRAFT • Last saved 2 mins ago</p>
            </div>
          </button>

          <p className="order-3 w-full text-center text-[28px] font-black uppercase tracking-[-0.04em] text-[#FB6503] sm:text-[34px] lg:order-none lg:w-auto">LOGOIPSUM</p>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="rounded-full p-1 text-[#212121] dark:text-[#F7F7F7]" aria-label="Toggle dark mode">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className="hidden text-sm text-[#212121] dark:text-[#F7F7F7] sm:inline">Auto saving..</span>
            <button className="rounded-full border border-[#FB6503] bg-[#FFF0E6] px-5 py-1.5 text-sm font-bold text-[#212121]">Preview</button>
            <button onClick={() => saveArticle("PUBLISHED")} className="rounded-full border border-[#E9E9E9] bg-[#FB6503] px-5 py-1.5 text-sm font-bold text-[#FFF0E6]">
              Publish
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#E9E9E9] bg-[#FFF0E6] px-4 py-3 dark:border-[#2A2A2A] dark:bg-[#2A211D] md:px-6">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-x-auto text-sm text-[#4D4D4D] dark:text-[#BFBFBF]">
            <span className="font-bold">Paragraph</span>
            <span className="font-bold">B</span>
            <span className="italic">I</span>
            <span className="underline">U</span>
            <span>"</span>
            <span>∞</span>
            <span>☰</span>
            <span>⦿</span>
            <span>🖼</span>
            <span>◻</span>
          </div>
          <div className="hidden items-center gap-3 text-[#4D4D4D] dark:text-[#BFBFBF] sm:flex">
            <Search className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-4 px-4 py-4 lg:gap-5 lg:px-6 xl:grid-cols-[1.65fr_0.75fr]">
        <section className="space-y-4 rounded-2xl">
          <div className="rounded-3xl border border-dashed border-[#FC8435] bg-white/60 p-4 dark:bg-[#1E1E1E]/70 sm:p-6">
            <div className="mx-auto flex min-h-[180px] max-w-[360px] flex-col items-center justify-center gap-3 text-center">
              <button className="rounded-full bg-[#FFF0E6] p-3 text-[#FB6503]">
                <UploadCloud className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[24px] font-medium text-[#212121] dark:text-[#F3F3F3] sm:text-[31px]">Upload Featured Image:</p>
                <p className="text-sm text-[#6A6A6A]">Drag & drop or click to browse</p>
                <p className="text-xs text-[#999999]">Recommended size: 1280x720</p>
              </div>
              <input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="Image URL"
                className="w-full rounded-xl border border-[#E9E9E9] bg-white px-3 py-2 text-sm outline-none dark:border-[#3A3A3A] dark:bg-[#242424] dark:text-[#F7F7F7]"
              />
              <input
                ref={featuredImageInputRef}
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
                onClick={() => featuredImageInputRef.current?.click()}
                disabled={uploadingImage}
                className="rounded-full border border-[#FB6503] bg-[#FFF0E6] px-4 py-2 text-xs font-bold text-[#212121] disabled:opacity-70"
              >
                {uploadingImage ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[34px] font-bold leading-none text-[#212121] outline-none dark:text-[#F7F7F7] sm:text-[40px] md:text-[49px]"
            placeholder="The Art of Minimalist Event Desing"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing to continue..."
            className="min-h-[420px] w-full rounded-3xl border border-[#E9E9E9] bg-white/70 p-4 text-base leading-relaxed text-[#212121] outline-none dark:border-[#3A3A3A] dark:bg-[#1E1E1E]/80 dark:text-[#F2F2F2] sm:min-h-[620px] sm:p-5"
          />

          <div className="flex items-center justify-between text-sm text-[#4D4D4D] dark:text-[#BFBFBF]">
            <p>Words: {words}</p>
            <p>Reading time - {readingTime} min</p>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-[#E9E9E9] bg-white/80 p-4 dark:border-[#2F2F2F] dark:bg-[#1E1E1E]/90">
            <h3 className="text-[25px] font-bold text-[#1E1E1E] dark:text-[#F3F3F3]">Publication</h3>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="mb-1 text-[10px] font-bold text-[#999999]">STATUS</p>
                <input value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-[#E9E9E9] bg-[#FFFBF7] px-2 py-1.5 dark:border-[#3A3A3A] dark:bg-[#2A2A2A]" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold text-[#999999]">PUBLISH DATE</p>
                <div className="flex items-center gap-2 rounded-md border border-[#E9E9E9] bg-[#FFFBF7] px-2 py-1.5 dark:border-[#3A3A3A] dark:bg-[#2A2A2A]">
                  <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="w-full bg-transparent outline-none" />
                  <Calendar className="h-4 w-4 text-[#6A6A6A]" />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold text-[#999999]">URL SLUG</p>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-md border border-[#E9E9E9] bg-[#FFFBF7] px-2 py-1.5 dark:border-[#3A3A3A] dark:bg-[#2A2A2A]" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9E9E9] bg-white/80 p-4 dark:border-[#2F2F2F] dark:bg-[#1E1E1E]/90">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[25px] font-bold text-[#1E1E1E] dark:text-[#F3F3F3]">SEO</h3>
              <span className="text-sm font-bold text-[#FB6503]">85/100</span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-[10px] font-bold text-[#999999]">META DESCRIPTION</p>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="min-h-[70px] w-full rounded-md border border-[#E9E9E9] bg-[#FFFBF7] px-2 py-1.5 outline-none dark:border-[#3A3A3A] dark:bg-[#2A2A2A]"
                  placeholder="Enter a short description of the article"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold text-[#999999]">FOCUS KEYWORD</p>
                <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="w-full rounded-md border border-[#E9E9E9] bg-[#FFFBF7] px-2 py-1.5 dark:border-[#3A3A3A] dark:bg-[#2A2A2A]" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9E9E9] bg-white/80 p-4 dark:border-[#2F2F2F] dark:bg-[#1E1E1E]/90">
            <h3 className="text-[25px] font-bold text-[#1E1E1E] dark:text-[#F3F3F3]">Channels</h3>
            <div className="mt-3 space-y-2 text-sm text-[#212121] dark:text-[#F2F2F2]">
              <label className="flex items-center justify-between"><span>Wedding Blog</span><button type="button" onClick={() => setChannelWedding((v) => !v)}>{channelWedding ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></label>
              <label className="flex items-center justify-between"><span>LinkedIn</span><button type="button" onClick={() => setChannelLinkedIn((v) => !v)}>{channelLinkedIn ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></label>
              <label className="flex items-center justify-between"><span>Instagram</span><button type="button" onClick={() => setChannelInstagram((v) => !v)}>{channelInstagram ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></label>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E9E9E9] bg-white/80 p-4 dark:border-[#2F2F2F] dark:bg-[#1E1E1E]/90">
            <h3 className="text-[25px] font-bold text-[#1E1E1E] dark:text-[#F3F3F3]">Settings</h3>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center justify-between"><span>Wedding Blog</span><input checked={settingWedding} onChange={(e) => setSettingWedding(e.target.checked)} type="checkbox" /></label>
              <label className="flex items-center justify-between"><span>LinkedIn</span><input checked={settingLinkedIn} onChange={(e) => setSettingLinkedIn(e.target.checked)} type="checkbox" /></label>
              <label className="flex items-center justify-between"><span>Instagram</span><input checked={settingInstagramA} onChange={(e) => setSettingInstagramA(e.target.checked)} type="checkbox" /></label>
              <label className="flex items-center justify-between"><span>Instagram</span><input checked={settingInstagramB} onChange={(e) => setSettingInstagramB(e.target.checked)} type="checkbox" /></label>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => saveArticle("DRAFT")} disabled={saving} className="w-full rounded-full border border-[#FB6503] bg-[#FFFEFD] px-4 py-2 text-sm font-bold text-[#212121]">
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button onClick={() => saveArticle("SCHEDULED")} disabled={saving} className="w-full rounded-full border border-[#FB6503] bg-[#FFF0E6] px-4 py-2 text-sm font-bold text-[#1E1E1E]">
                Schedule Publish
              </button>
            </div>
            <button onClick={deleteArticle} disabled={deleting} className="w-full text-sm font-medium text-[#FB6503]">
              {deleting ? "Deleting..." : "Delete Article"}
            </button>
          </div>
        </aside>
      </div>

      <footer className="mx-auto mt-6 w-full max-w-[1360px] rounded-t-[40px] bg-gradient-to-b from-[#FFF6F0] to-[rgba(255,211,183,0.7)] px-4 py-8 dark:from-[#211A16] dark:to-[#1B1613] sm:rounded-t-[60px] sm:px-8 sm:py-10">
        <p className="text-center text-[56px] font-black uppercase leading-none text-[#FB65031F] sm:text-[100px] md:text-[140px]">LOGOIPSUM</p>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-[#BABABA] pb-6">
          <div>
            <p className="text-base text-[#212121] dark:text-[#F2F2F2]">All Assistant That Captures Every Details.</p>
            <p className="mt-3 text-base font-bold text-[#212121] dark:text-[#F2F2F2]">Our Social Media Accounts</p>
            <p className="text-sm text-[#4D4D4D] dark:text-[#BFBFBF]">Twitter • Facebook • LinkedIn</p>
          </div>
          <div className="text-base font-bold text-[#212121] dark:text-[#F2F2F2]">Home • About • Features • Pricing • Documentation</div>
          <div className="w-full max-w-[340px]">
            <p className="text-base font-bold text-[#212121] dark:text-[#F2F2F2]">Stay Connected</p>
            <div className="mt-2 flex items-center justify-between rounded-full bg-[#FFF0E6] p-2 dark:bg-[#2A221E]">
              <input className="w-full bg-transparent px-3 text-sm outline-none dark:text-[#F2F2F2]" placeholder="Enter Your Email" />
              <button className="rounded-full bg-[#FFFEFD] px-4 py-2 text-sm font-bold dark:bg-[#242424] dark:text-[#F2F2F2]">Submit</button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between text-sm text-[#212121] dark:text-[#F2F2F2]">
          <p>Privacy Policy • Term & Condition</p>
          <p>© 2025 logoipsum. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
