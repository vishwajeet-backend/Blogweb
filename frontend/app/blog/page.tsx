"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, User, ArrowRight, Search, Loader2, Clock, Bookmark, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/context/AuthContext"

interface Article {
  id: string
  title: string
  excerpt: string
  slug: string
  coverImage: string | null
  featuredImage?: string | null
  publishedAt: string
  readTime: number
  wordCount: number
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

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

export default function BlogPage() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])

  useEffect(() => {
    fetchArticles(currentPage, searchQuery)
  }, [currentPage])

  const fetchArticles = async (page: number, search: string = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(search && { search })
      })

      const response = await fetch(`/api/blogs/public?${params}`)
      const data = await response.json()

      if (data.success) {
        setArticles(data.data.articles)
        setPagination(data.data.pagination)
      } else {
        toast.error("Failed to load blog posts")
      }
    } catch (error) {
      console.error("Error fetching articles:", error)
      toast.error("Failed to load blog posts")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchArticles(1, searchQuery)
  }

  const openSavedWindow = async () => {
    if (!user) {
      toast.error("Please login to view saved blogs")
      return
    }

    try {
      setSavedLoading(true)
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
      setSavedArticles(data.data?.articles || [])
      setSavedOpen(true)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch saved blogs")
    } finally {
      setSavedLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: '#1a1a1a' }}>

      {/* Hero Section */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url("/design/BG%2023-01%202.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{
            fontSize: '12px',
            fontWeight: 800,
            color: '#FF7A33',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: '16px'
          }}>Insights & Resources</p>
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 64px)',
            fontWeight: 800,
            marginBottom: '16px',
            color: '#1a1a1a',
            lineHeight: '1.2'
          }}>
            Our <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#666', fontFamily: '"Playfair Display", serif' }}>Blog</span>
          </h1>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto' }}>
            Discover tips, strategies, and insights to help you create better content and grow your audience.
          </p>

          <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '18px 24px 18px 56px',
                borderRadius: '50px',
                border: '2px solid #FF7A33',
                fontSize: '16px',
                outline: 'none',
                color: '#1a1a1a',
                backgroundColor: '#fff',
                boxShadow: '0 4px 20px rgba(255, 122, 51, 0.05)'
              }}
            />
            <Search
              size={20}
              style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#FF7A33' }}
            />
          </form>

          <div style={{ marginTop: '18px' }}>
            <button
              onClick={openSavedWindow}
              disabled={savedLoading}
              style={{
                border: '1px solid #FF7A33',
                color: '#FF7A33',
                background: '#fff',
                borderRadius: '40px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: savedLoading ? 'not-allowed' : 'pointer',
                opacity: savedLoading ? 0.7 : 1,
              }}
            >
              <Bookmark size={16} /> {savedLoading ? "Loading..." : "Saved Blogs"}
            </button>
          </div>
        </div>
      </section>

      {/* Blog Feed */}
      <section style={{ padding: '60px 24px 120px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Loader2 size={48} className="animate-spin" style={{ color: '#FF7A33', margin: '0 auto' }} />
              <p style={{ marginTop: '16px', color: '#666' }}>Fetching stories...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0', backgroundColor: '#fafafa', borderRadius: '40px', border: '1px dashed #ddd' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>No stories match your search</h3>
              <p style={{ color: '#666' }}>Try adjusting your keywords or browse all categories.</p>
              <button
                onClick={() => { setSearchQuery(""); fetchArticles(1, ""); }}
                style={{ marginTop: '24px', color: '#FF7A33', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none', borderBottom: '2px solid #FF7A33' }}>
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '40px'
              }}>
                {articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {(() => {
                      const cardImage = article.coverImage || article.featuredImage || null
                      return (
                    <article
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        border: '1px solid #f0f0f0',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.borderColor = '#FF7A33';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 122, 51, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#f0f0f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Image Container */}
                      <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden' }}>
                        {cardImage ? (
                          <img
                            src={cardImage}
                            alt={article.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', backgroundColor: '#FFF5F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Search size={40} style={{ color: '#FF7A33', opacity: 0.2 }} />
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          top: '20px',
                          left: '20px',
                          backgroundColor: '#FF7A33',
                          color: '#fff',
                          padding: '6px 14px',
                          borderRadius: '50px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          ARTICLE
                        </div>
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', color: '#999', fontSize: '12px', fontWeight: 700 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} style={{ color: '#FF7A33' }} />
                            {formatDate(article.publishedAt)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} style={{ color: '#FF7A33' }} />
                            {article.readTime} min read
                          </span>
                        </div>

                        <h2 style={{
                          fontSize: '24px',
                          fontWeight: 800,
                          marginBottom: '16px',
                          lineHeight: '1.3',
                          color: '#1a1a1a'
                        }}>{article.title}</h2>

                        <p style={{
                          color: '#666',
                          fontSize: '15px',
                          lineHeight: '1.6',
                          marginBottom: '24px',
                          display: '-webkit-box',
                          WebkitLineClamp: '3',
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          flex: 1
                        }}>
                          {article.excerpt}
                        </p>

                        <div style={{
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '24px',
                          borderTop: '1px solid #f9f9f9'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {article.user?.avatar ? (
                              <img
                                src={article.user.avatar}
                                alt={article.user.name}
                                style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                              />
                            ) : (
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                {article.user?.name?.charAt(0)}
                              </div>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>{article.user?.name}</span>
                          </div>
                          <ArrowRight size={20} style={{ color: '#FF7A33' }} />
                        </div>
                      </div>
                    </article>
                      )
                    })()}
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '80px' }}>
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '1px solid #eee',
                        backgroundColor: currentPage === i + 1 ? '#FF7A33' : '#fff',
                        color: currentPage === i + 1 ? '#fff' : '#1a1a1a',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ backgroundColor: '#FFF5F2', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '20px' }}>
            Get exclusive creator tips
          </h2>
          <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
            We share high-quality insights every week. No spam, just value.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link href="/signup">
              <button
                style={{
                  backgroundColor: '#FF7A33',
                  color: 'white',
                  padding: '18px 56px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(255, 122, 51, 0.3)'
                }}>
                JOIN THE NEWSLETTER
              </button>
            </Link>
          </div>
        </div>
      </section>

      {savedOpen && (
        <div
          onClick={() => setSavedOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(920px, 100%)',
              maxHeight: '80vh',
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '20px',
              border: '1px solid #f0f0f0',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.08em', fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>Reader Library</p>
                <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: '#1a1a1a' }}>Saved Blogs</h3>
              </div>
              <button onClick={() => setSavedOpen(false)} style={{ border: '1px solid #ececec', background: '#fff', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '18px 20px 22px' }}>
              {savedArticles.length === 0 ? (
                <div style={{ padding: '36px 8px', textAlign: 'center', color: '#666' }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>No saved blogs yet</p>
                  <p style={{ margin: '8px 0 0', fontSize: '13px' }}>When you save blogs, they will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {savedArticles.map((article) => {
                    const cardImage = article.coverImage || article.featuredImage || null
                    return (
                      <Link key={article.id} href={`/blog/${article.id}`} onClick={() => setSavedOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <article style={{ border: '1px solid #f1f1f1', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#fff' }}>
                          <div style={{ height: '120px', backgroundColor: '#fafafa' }}>
                            {cardImage ? (
                              <img src={cardImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}
                          </div>
                          <div style={{ padding: '10px 12px 12px' }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.35 }}>{article.title}</p>
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#666', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {article.excerpt || 'Read this saved blog'}
                            </p>
                          </div>
                        </article>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
