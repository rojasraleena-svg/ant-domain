import { NextRequest, NextResponse } from 'next/server'
import { createApiKey, deleteApiKey, listApiKeys } from '@/lib/apiKey'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录。' }, { status: 401 })
    }

    const keys = await listApiKeys(user.id)
    return NextResponse.json({ keys })
  } catch (error) {
    console.error('List API keys error:', error)
    return NextResponse.json({ error: '获取 API Key 列表失败。' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录。' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '请提供 API Key 名称。' }, { status: 400 })
    }

    if (name.trim().length > 50) {
      return NextResponse.json({ error: '名称不能超过 50 个字符。' }, { status: 400 })
    }

    const rawKey = await createApiKey(user.id, name.trim())

    return NextResponse.json({
      key: rawKey,
      name: name.trim(),
      message: '请妥善保存此 Key，关闭后无法再次查看。',
    })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: '创建 API Key 失败。' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录。' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: '缺少 Key ID。' }, { status: 400 })
    }

    if (keyId === 'all') {
      await db.from('api_keys').delete().eq('user_id', user.id)
      return NextResponse.json({ success: true })
    }

    const deleted = await deleteApiKey(user.id, keyId)
    if (!deleted) {
      return NextResponse.json({ error: 'Key 不存在或无权删除。' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json({ error: '删除 API Key 失败。' }, { status: 500 })
  }
}
