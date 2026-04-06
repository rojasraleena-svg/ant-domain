import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-api'
import { deleteFromStorage } from '@/lib/image-upload'

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录。' }, { status: 401 })
    }

    const body = await request.json()
    const { path } = body

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: '缺少 path 参数。' }, { status: 400 })
    }

    // 所有权校验：路径必须以用户 ID 开头
    if (!path.startsWith(user.id + '/')) {
      return NextResponse.json({ error: '无权删除此文件。' }, { status: 403 })
    }

    await deleteFromStorage(path)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[delete-image] Error:', error)
    const message = error instanceof Error ? error.message : '图片删除失败，请稍后重试。'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
