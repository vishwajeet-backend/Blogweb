"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, Clock, User, ArrowLeft, Loader2, Share2, Bookmark, Heart, Flag } from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { toast } from "sonner"
import { marked } from "marked"

interface Article {
  id: string
  title: string
  excerpt: string
  content: string
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
  engagement?: {
    likes: number
    comments: number
    shares: number
    views: number
  }
}

interface BlogComment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string | null
    name: string
    avatar: string | null
  }
  replies?: BlogComment[]
}

export default function BlogArticlePage() {
  const { user } = useAuth()
  const params = useParams()
  const articleId = params.id as string
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [likes, setLikes] = useState(0)
  const [shares, setShares] = useState(0)
  const [likeBusy, setLikeBusy] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [commentBusy, setCommentBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDetails, setReportDetails] = useState("")
  const [reportBusy, setReportBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [renderedContent, setRenderedContent] = useState("")

  const totalThreadComments = useMemo(() => {
    const count = (items: BlogComment[]): number =>
      items.reduce((sum, item) => sum + 1 + count(item.replies || []), 0)

    return count(comments)
  }, [comments])

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  useEffect(() => {
    void loadInteractionState()
    void loadComments()
  }, [articleId, article?.id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blogs/public/${articleId}`)
      const data = await response.json()

      if (data.success) {
        setArticle(data.data)
        setLikes(data.data?.engagement?.likes || 0)
        setShares(data.data?.engagement?.shares || 0)

        const rawContent = data.data?.content || ""
        const looksLikeHtml = /<\s*\w+[^>]*>/.test(rawContent)

        if (looksLikeHtml) {
          setRenderedContent(rawContent)
        } else {
          const html = await marked.parse(rawContent || "")
          setRenderedContent(typeof html === "string" ? html : String(html))
        }
      } else {
        setError(data.error || 'Article not found')
      }
    } catch (err) {
      console.error('Error fetching article:', err)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const likeStorageKey = article ? `blog-like:${article.id}` : ''

  const loadInteractionState = async () => {
    const token = localStorage.getItem('accessToken')

    if (likeStorageKey) {
      setLiked(localStorage.getItem(likeStorageKey) === '1')
    } else {
      setLiked(false)
    }

    if (!token) {
      setSaved(false)
      return
    }

    try {
      const response = await fetch(`/api/blogs/public/${articleId}/save`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setSaved(Boolean(data.data?.saved))
      }
    } catch {
      setSaved(false)
    }
  }

  const loadComments = async () => {
    try {
      setLoadingComments(true)
      const response = await fetch(`/api/blogs/public/${articleId}/comments`)
      const data = await response.json()
      if (response.ok && data.success) {
        setComments(data.data?.comments || [])
      }
    } catch {
      setComments([])
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!article) return
    if (!user) {
      toast.error('Please login to like this blog')
      return
    }
    if (liked) {
      toast.message('You already liked this blog')
      return
    }

    try {
      setLikeBusy(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/blogs/public/${article.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to like blog')
      }

      setLikes(data.data?.likes || likes + 1)
      setLiked(true)
      localStorage.setItem(likeStorageKey, '1')
      toast.success('Liked!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to like blog')
    } finally {
      setLikeBusy(false)
    }
  }

  const handleSave = async () => {
    if (!article) return
    if (!user) {
      toast.error('Please login to save this blog')
      return
    }

    try {
      setSaveBusy(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/blogs/public/${article.id}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save blog')
      }

      setSaved(Boolean(data.data?.saved))
      toast.success(data.data?.saved ? 'Saved to your list' : 'Removed from saved list')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save blog')
    } finally {
      setSaveBusy(false)
    }
  }

  const handleComment = async () => {
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    const content = newComment.trim()
    if (!content) return

    try {
      setCommentBusy(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/blogs/public/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add comment')
      }

      setNewComment('')
      await loadComments()
      toast.success('Comment added')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment')
    } finally {
      setCommentBusy(false)
    }
  }

  const handleReport = async () => {
    if (!user) {
      toast.error('Please login to report a blog')
      return
    }
    if (!article) return

    const reason = reportReason.trim()
    const details = reportDetails.trim()

    if (!reason) {
      toast.error('Please select or enter a report reason')
      return
    }

    try {
      setReportBusy(true)
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/blogs/public/${article.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, details }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to report blog')
      }

      toast.success('Report submitted to admin')
      setReportReason('')
      setReportDetails('')
      setReportOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to report blog')
    } finally {
      setReportBusy(false)
    }
  }

  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${article?.id || articleId}`
    : `/blog/${article?.id || articleId}`

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setShareCopied(true)
      toast.success('Blog link copied')
      setTimeout(() => setShareCopied(false), 1200)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleOpenShare = async () => {
    setShareOpen((prev) => !prev)

    if (shareOpen || !article) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/blogs/public/${article.id}/share`, {
        method: 'POST',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setShares(Number(data.data?.shares || 0))
      }
    } catch {
      // Non-blocking; sharing should still work even if tracking fails.
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: '#FF7A33' }} />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px' }}>{error || 'Story not found'}</h2>
          <Link href="/blog" style={{ color: '#FF7A33', fontWeight: 800, fontSize: '18px', textDecoration: 'none', borderBottom: '2px solid #FF7A33' }}>
            Back to our stories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', color: '#1a1a1a' }}>

      {/* Article Header / Hero */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url("/design/BG%2023-01%202.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '100px 24px 60px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '40px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            <ArrowLeft size={16} /> Back to stories
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{
              backgroundColor: '#FF7A33',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '50px',
              fontSize: '11px',
              fontWeight: 800
            }}>ARTICLE</span>
            <span style={{ color: '#666', fontSize: '14px', fontWeight: 600 }}>{article.readTime} min read</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 800,
            marginBottom: '32px',
            color: '#1a1a1a',
            lineHeight: '1.2'
          }}>
            {article.title}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '32px',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {article.user?.avatar ? (
                <img src={article.user.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} style={{ color: '#999' }} />
                </div>
              )}
              <div>
                <p style={{ fontWeight: 800, fontSize: '16px', margin: 0 }}>{article.user?.name}</p>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{formatDate(article.publishedAt)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleLike}
                disabled={likeBusy}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: likeBusy ? 'not-allowed' : 'pointer', background: '#fff', opacity: likeBusy ? 0.7 : 1 }}
                title={`Likes: ${likes}`}
              >
                <Heart size={18} style={{ color: liked ? '#E11D48' : '#666', fill: liked ? '#E11D48' : 'transparent' }} />
              </button>
              <button onClick={handleSave} disabled={saveBusy} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saveBusy ? 'not-allowed' : 'pointer', background: '#fff', opacity: saveBusy ? 0.7 : 1 }}>
                <Bookmark size={18} style={{ color: saved ? '#FB6503' : '#666', fill: saved ? '#FB6503' : 'transparent' }} />
              </button>
              <button onClick={handleOpenShare} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: shareOpen ? '#fff5ec' : '#fff' }}>
                <Share2 size={18} style={{ color: shareOpen ? '#FB6503' : '#666' }} />
              </button>
              <button onClick={() => setReportOpen((prev) => !prev)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: reportOpen ? '#fff5f5' : '#fff' }}>
                <Flag size={18} style={{ color: reportOpen ? '#E11D48' : '#666' }} />
              </button>
            </div>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '16px', color: '#666', fontSize: '13px', fontWeight: 700 }}>
            <span>Likes: {likes}</span>
            <span>Shares: {shares}</span>
            <span>Views: {article.engagement?.views || 0}</span>
            <span>Comments: {Math.max(article.engagement?.comments || 0, totalThreadComments)}</span>
          </div>

          {reportOpen && (
            <div style={{ marginTop: '16px', border: '1px solid #fde2e2', backgroundColor: '#fff8f8', borderRadius: '12px', padding: '14px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#B91C1C' }}>Report this blog</p>
              <div style={{ marginTop: '10px', display: 'grid', gap: '10px' }}>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ height: '40px', borderRadius: '8px', border: '1px solid #f2b6b6', padding: '0 10px', fontSize: '13px' }}
                >
                  <option value="">Select reason</option>
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Misinformation">Misinformation</option>
                  <option value="Policy Violation">Policy Violation</option>
                  <option value="Other">Other</option>
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Share additional details (optional)"
                  style={{ width: '100%', minHeight: '80px', borderRadius: '8px', border: '1px solid #f2b6b6', padding: '10px', fontSize: '13px', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button onClick={() => setReportOpen(false)} style={{ border: '1px solid #e5e5e5', background: '#fff', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', fontWeight: 700 }}>
                    Cancel
                  </button>
                  <button onClick={handleReport} disabled={reportBusy || !reportReason} style={{ border: 'none', background: '#E11D48', color: '#fff', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', fontWeight: 700, opacity: reportBusy || !reportReason ? 0.65 : 1 }}>
                    {reportBusy ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {shareOpen && (
            <div style={{ marginTop: '12px', border: '1px solid #ffe5d2', backgroundColor: '#fffaf5', borderRadius: '12px', padding: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#C2410C' }}>Share this blog</p>
              <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                <input
                  readOnly
                  value={shareLink}
                  style={{ height: '38px', borderRadius: '8px', border: '1px solid #fbd7bb', padding: '0 10px', fontSize: '13px', color: '#444', backgroundColor: '#fff' }}
                />
                <button
                  onClick={handleCopyShareLink}
                  style={{ border: 'none', borderRadius: '8px', backgroundColor: '#FB6503', color: '#fff', padding: '0 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {shareCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cover Image Area */}
      {(article.coverImage || article.featuredImage) && (
        <section style={{ maxWidth: '1100px', margin: '-20px auto 80px', padding: '0 24px' }}>
          <div style={{
            borderRadius: '48px',
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
            height: 'clamp(300px, 50vh, 600px)'
          }}>
            <img
              src={article.coverImage || article.featuredImage || ''}
              alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </section>
      )}

      {/* Article Content */}
      <section style={{ padding: '0 24px 120px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            className="article-body"
            style={{
              fontSize: '18px',
              lineHeight: '1.8',
              color: '#333'
            }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          <div style={{ marginTop: '64px', borderTop: '1px solid #eee', paddingTop: '32px' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '14px' }}>Comments</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? 'Add your comment...' : 'Login to comment'}
                disabled={!user || commentBusy}
                style={{ width: '100%', minHeight: '100px', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '12px', fontSize: '15px', outline: 'none', resize: 'vertical' }}
              />
              <div>
                <button
                  onClick={handleComment}
                  disabled={!user || commentBusy || !newComment.trim()}
                  style={{ border: 'none', borderRadius: '10px', backgroundColor: '#FB6503', color: '#fff', padding: '10px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', opacity: !user || commentBusy || !newComment.trim() ? 0.6 : 1 }}
                >
                  {commentBusy ? 'POSTING...' : 'POST COMMENT'}
                </button>
              </div>
            </div>

            {loadingComments ? (
              <p style={{ color: '#666', fontSize: '14px' }}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px' }}>No comments yet. Start the conversation.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                          {comment.user.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <strong style={{ fontSize: '13px' }}>{comment.user.name}</strong>
                      <span style={{ fontSize: '11px', color: '#888' }}>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#333', lineHeight: 1.6 }}>{comment.content}</p>

                    {(comment.replies || []).length > 0 && (
                      <div style={{ marginTop: '10px', marginLeft: '14px', borderLeft: '2px solid #f0f0f0', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(comment.replies || []).map((reply) => (
                          <div key={reply.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '12px' }}>{reply.user.name}</strong>
                              <span style={{ fontSize: '11px', color: '#888' }}>{formatDate(reply.createdAt)}</span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#444' }}>{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .article-body p { margin-bottom: 32px; }
        .article-body h2 { 
          font-size: 32px; 
          font-weight: 800; 
          margin: 64px 0 24px; 
          line-height: 1.2;
        }
        .article-body h3 { 
          font-size: 24px; 
          font-weight: 800; 
          margin: 48px 0 20px; 
        }
        .article-body ul, .article-body ol { 
          margin-bottom: 32px; 
          padding-left: 24px; 
        }
        .article-body li { margin-bottom: 12px; }
        .article-body blockquote { 
          border-left: 4px solid #FF7A33; 
          padding-left: 32px; 
          margin: 48px 0; 
          font-style: italic; 
          font-size: 24px;
          line-height: 1.5;
          color: #555;
        }
        .article-body img { 
          border-radius: 24px; 
          margin: 48px 0; 
          width: 100%; 
        }
        .article-body a { 
          color: #FF7A33; 
          text-decoration: none; 
          font-weight: 700;
          border-bottom: 2px solid rgba(255, 122, 51, 0.2);
        }
        .article-body a:hover {
          border-bottom-color: #FF7A33;
        }
      `}</style>

    </div>
  )
}
