"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface User {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  avatar?: string | null
  bio?: string | null
  website?: string | null
  twitterHandle?: string | null
  linkedinUrl?: string | null
  subscriptionPlan: 'FREE' | 'STARTER' | 'CREATOR' | 'PROFESSIONAL'
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const hydrateTokenFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const urlAccessToken = params.get('accessToken')
    const urlRefreshToken = params.get('refreshToken')

    if (!urlAccessToken) return null

    localStorage.setItem('accessToken', urlAccessToken)

    // Keep refresh token for debugging parity with existing OAuth callback flow.
    if (urlRefreshToken) {
      localStorage.setItem('refreshToken', urlRefreshToken)
    }

    params.delete('accessToken')
    params.delete('refreshToken')
    const cleanQuery = params.toString()
    const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', cleanUrl)

    return urlAccessToken
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || hydrateTokenFromUrl()

      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
      } else {
        localStorage.removeItem('accessToken')
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      localStorage.removeItem('accessToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [hydrateTokenFromUrl])

  useEffect(() => {
    fetchUser()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      const loggedInUser = data?.data?.user
      localStorage.setItem('accessToken', data.data.accessToken)
      await fetchUser()

      toast.success('Logged in successfully!')
      router.replace('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
      throw error
    }
  }, [fetchUser, router])

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken')

      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }

      localStorage.removeItem('accessToken')
      setUser(null)
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      localStorage.removeItem('accessToken')
      setUser(null)
      router.push('/login')
    }
  }, [router])

  const refetchUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  const value = useMemo(
    () => ({ user, loading, login, logout, refetchUser }),
    [user, loading, login, logout, refetchUser]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
