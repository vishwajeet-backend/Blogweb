import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authService } from '@/lib/services/auth.service'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${APP_URL}/api/oauth/google/callback`

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('[OAuth Google Callback] Started', {
      hasCode: !!code,
      error,
      env: {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        appUrl: APP_URL,
        redirectUri: GOOGLE_REDIRECT_URI,
      }
    })

    if (error) {
      console.error('[OAuth Google Callback] OAuth error from Google:', error)
      return NextResponse.redirect(`${APP_URL}/login?error=${error}`)
    }

    if (!code) {
      console.error('[OAuth Google Callback] No code provided')
      return NextResponse.redirect(`${APP_URL}/login?error=no_code`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('[OAuth Google Callback] Token exchange failed:', {
        status: tokenResponse.status,
        error: tokenData,
      })
      return NextResponse.redirect(`${APP_URL}/login?error=token_exchange_failed`)
    }

    console.log('[OAuth Google Callback] Token exchange successful')

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const userInfo = await userInfoResponse.json()

    if (!userInfoResponse.ok) {
      console.error('[OAuth Google Callback] User info fetch failed:', {
        status: userInfoResponse.status,
        error: userInfo,
      })
      return NextResponse.redirect(`${APP_URL}/login?error=user_info_failed`)
    }

    console.log('[OAuth Google Callback] User info retrieved:', {
      email: userInfo.email,
      name: userInfo.name,
    })

    // Check if user exists
    console.log('[OAuth Google Callback] Checking if user exists:', userInfo.email)
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    })

    if (!user) {
      console.log('[OAuth Google Callback] Creating new user')
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          password: '', // OAuth users don't need password
          name: userInfo.name || userInfo.email.split('@')[0],
          avatar: userInfo.picture,
          emailVerified: true, // Google emails are already verified
          provider: 'GOOGLE',
          providerId: userInfo.id,
        },
      })

      // Note: UsageStats model removed from schema
      // Usage stats are now tracked differently or not needed
    } else if (!user.providerId && user.provider !== 'GOOGLE') {
      // Update existing user to link Google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'GOOGLE',
          providerId: userInfo.id,
          avatar: userInfo.picture || user.avatar,
          emailVerified: true,
        },
      })
    }

    console.log('[OAuth Google Callback] User ready:', { userId: user.id, email: user.email })

    // Generate JWT tokens
    const { accessToken, refreshToken } = authService.generateTokens(user)
    console.log('[OAuth Google Callback] Tokens generated')

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    console.log('[OAuth Google Callback] Refresh token stored')

    // Redirect based on role with tokens
    const redirectPath = '/dashboard'
    const redirectUrl = new URL(redirectPath, APP_URL)
    redirectUrl.searchParams.set('accessToken', accessToken)
    redirectUrl.searchParams.set('refreshToken', refreshToken)

    console.log('[OAuth Google Callback] Redirecting to:', redirectUrl.toString())

    const response = NextResponse.redirect(redirectUrl.toString())
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('[OAuth Google Callback] FATAL ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.redirect(
      `${APP_URL}/login?error=oauth_failed&details=${encodeURIComponent(error.message)}`
    )
  }
}
