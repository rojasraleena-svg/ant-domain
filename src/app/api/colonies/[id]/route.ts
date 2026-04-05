import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-api'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: '未授权访问。' }, { status: 401 })
    }

    const { id } = await params
    const colonyId = parseInt(id, 10)

    if (isNaN(colonyId)) {
      return NextResponse.json({ error: '无效的蚁群 ID。' }, { status: 400 })
    }

    const { data: colony, error } = await db
      .from('colonies')
      .select(`
        id,
        name,
        species_id,
        founded_date,
        acquired_date,
        acquire_method,
        queen_count,
        current_stage,
        worker_range,
        notes,
        status,
        created_at,
        updated_at,
        species:species(id, name_cn, name_lat, genus, difficulty, beginner_friendly)
      `)
      .eq('id', colonyId)
      .eq('user_id', user.id)
      .single()

    if (error || !colony) {
      return NextResponse.json({ error: '蚁群不存在或无权访问。' }, { status: 404 })
    }

    return NextResponse.json({ colony })
  } catch (error) {
    console.error('Get colony error:', error)
    return NextResponse.json({ error: '获取蚁群详情失败。' }, { status: 500 })
  }
}
