import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-api'
import { db } from '@/lib/db'
import {
  validateImageFile,
  generateStoragePath,
  uploadToStorage,
  MAX_IMAGES_PER_LOG,
} from '@/lib/image-upload'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: '请先登录。' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const colonyIdStr = formData.get('colonyId') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '请选择要上传的图片。' }, { status: 400 })
    }

    if (!colonyIdStr) {
      return NextResponse.json({ error: '缺少 colonyId 参数。' }, { status: 400 })
    }

    const colonyId = parseInt(colonyIdStr, 10)
    if (isNaN(colonyId)) {
      return NextResponse.json({ error: '无效的蚁群 ID。' }, { status: 400 })
    }

    // 校验蚁群所有权
    const { data: colony } = await db
      .from('colonies')
      .select('id')
      .eq('id', colonyId)
      .eq('user_id', user.id)
      .single()

    if (!colony) {
      return NextResponse.json({ error: '蚁群不存在或无权访问。' }, { status: 404 })
    }

    // 验证文件（数量限制由客户端控制，此处仅做兜底）
    const validation = validateImageFile(file, 0)
    if (validation) {
      return NextResponse.json({ error: validation.message }, { status: 400 })
    }

    // 生成存储路径并上传
    const path = generateStoragePath(user.id, String(colonyId), file.name, file.type)
    const buffer = await file.arrayBuffer()
    const result = await uploadToStorage(buffer, path, file.type)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[upload-image] Error:', error)
    const message = error instanceof Error ? error.message : '图片上传失败，请稍后重试。'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
