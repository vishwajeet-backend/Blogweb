'use client';

/**
 * Article Edit Page with Collaborative Editing
 * Real-time collaborative article editor
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CollaborativeEditor from '@/components/CollaborativeEditor';

interface Article {
  id: string;
  title: string;
  content: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ArticleEditPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticleAndUser();
  }, [articleId]);

  const fetchArticleAndUser = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Fetch article
      const articleResponse = await fetch(`/api/articles/${articleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!articleResponse.ok) {
        const errorData = await articleResponse.json();
        console.error('Article fetch error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch article');
      }

      const articleData = await articleResponse.json();
      console.log('Article data received:', articleData); // Debug log

      if (!articleData.success || !articleData.data) {
        throw new Error(articleData.error || 'Failed to fetch article');
      }

      setArticle(articleData.data.article);

      // Fetch current user (you might want to store this in context)
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('User data received:', userData); // Debug log

        if (userData.success && userData.data) {
          setCurrentUser(userData.data.user);
        }
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (err: any) {
      console.error('Error loading article:', err);
      setError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (title: string, content: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      console.log('Article saved successfully');
    } catch (err) {
      console.error('Error saving article:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-neutral-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-[16px] text-red-600 mb-4">{error || 'Article not found'}</p>
          <a
            href="/dashboard/articles"
            className="text-[14px] text-emerald-600 hover:text-emerald-700"
          >
            ← Back to Articles
          </a>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditor
      articleId={article.id}
      initialTitle={article.title}
      initialContent={article.content}
      currentUser={currentUser}
      onSave={handleSave}
    />
  );
}
