"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Bookmark, Clock, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"

type SavedArticle = {
  id: string
  title: string
  excerpt: string | null
  slug: string
  coverImage: string | null
  featuredImage?: string | null
  publishedAt: string
  readTime: number
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

export default function SavedBlogsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [articles, setArticles] = useState<SavedArticle[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/saved")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) {
      void fetchSavedBlogs()
    }
  }, [user])

  const fetchSavedBlogs = async () => {
    try {
      setLoadingData(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/blogs/saved", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch saved blogs")
      }

      setArticles(data.data?.articles || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch saved blogs")
    } finally {
      setLoadingData(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading || loadingData) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#FB6503" }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", color: "#1a1a1a" }}>
      <section
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url("/design/BG%2023-01%202.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "110px 24px 44px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/blog" style={{ textDecoration: "none", color: "#666", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
            <ArrowLeft size={15} /> Back to Blog
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
            <Bookmark size={22} style={{ color: "#FB6503" }} />
            <h1 style={{ margin: 0, fontSize: "clamp(30px, 7vw, 42px)", fontWeight: 800 }}>Saved Blogs</h1>
          </div>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "15px" }}>
            Revisit all your bookmarked stories in one place.
          </p>
        </div>
      </section>

      <section style={{ padding: "34px 24px 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {articles.length === 0 ? (
            <div style={{ border: "1px dashed #ddd", borderRadius: "20px", padding: "42px", textAlign: "center", color: "#666" }}>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>No saved blogs yet</p>
              <p style={{ margin: "8px 0 0", fontSize: "14px" }}>Save any blog post and it will appear here.</p>
              <Link href="/blog" style={{ display: "inline-block", marginTop: "16px", color: "#FB6503", fontWeight: 800, textDecoration: "none", borderBottom: "2px solid #FB6503" }}>
                Explore Blogs
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "18px" }}>
              {articles.map((article) => {
                const cardImage = article.coverImage || article.featuredImage || null
                return (
                  <Link key={article.id} href={`/blog/${article.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <article style={{ border: "1px solid #f0f0f0", borderRadius: "16px", overflow: "hidden", backgroundColor: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
                      <div style={{ height: "160px", backgroundColor: "#fafafa" }}>
                        {cardImage ? <img src={cardImage} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                      </div>
                      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#888", fontSize: "11px", fontWeight: 700 }}>
                          <span>{formatDate(article.publishedAt)}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {article.readTime} min</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, lineHeight: 1.35 }}>{article.title}</p>
                        <p style={{ margin: 0, color: "#666", fontSize: "13px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {article.excerpt || "Read this saved story"}
                        </p>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
