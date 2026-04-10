import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/services/auth.service'
import { ImageService } from '@/lib/services/image.service'

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await authService.getCurrentUser(token)
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId') || undefined
    const limit = Number(searchParams.get('limit') || '50')

    const result = await ImageService.getUserImages(currentUser.id, {
      articleId,
      limit,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to fetch images' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch images' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await authService.getCurrentUser(token)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const articleId = (formData.get('articleId') as string | null) || undefined
    const alt = (formData.get('alt') as string | null) || undefined
    const caption = (formData.get('caption') as string | null) || undefined
    const optimizeFlag = (formData.get('optimize') as string | null) !== 'false'

    const result = await ImageService.uploadImage(file, {
      userId: currentUser.id,
      articleId,
      alt,
      caption,
      optimize: optimizeFlag,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to upload image' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      url: result.data.url,
      thumbnailUrl: result.data.thumbnailUrl,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 },
    )
  }
}
