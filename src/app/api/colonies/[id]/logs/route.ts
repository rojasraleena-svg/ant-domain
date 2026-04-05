import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-api'
import { db } from '@/lib/db'

const VALID_STAGES = [
  'nuptial_flight',
  'nesting',
  'egg',
  'larva',
  'pupa',
  'first_workers',
  'early_growth',
  'steady_growth',
  'mature',
  'hibernation',
]

const VALID_EGG_STATUSES = ['none', 'few', 'many', 'abundant']
const VALID_ABNORMAL_TYPES = ['death', 'escape', 'disease', 'none']

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

    const { data: colony } = await db
      .from('colonies')
      .select('id, user_id')
      .eq('id', colonyId)
      .eq('user_id', user.id)
      .single()

    if (!colony) {
      return NextResponse.json({ error: '蚁群不存在或无权访问。' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const { data: logs, error, count } = await db
      .from('colony_logs')
      .select('*', { count: 'exact' })
      .eq('colony_id', colonyId)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get logs error:', error)
      return NextResponse.json({ error: '获取日志列表失败。' }, { status: 500 })
    }

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0 })
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json({ error: '获取日志列表失败。' }, { status: 500 })
  }
}

export async function POST(
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

    const { data: colony } = await db
      .from('colonies')
      .select('id, user_id')
      .eq('id', colonyId)
      .eq('user_id', user.id)
      .single()

    if (!colony) {
      return NextResponse.json({ error: '蚁群不存在或无权访问。' }, { status: 404 })
    }

    const body = await request.json()
    const {
      date,
      title,
      content,
      stage,
      workerCount,
      eggStatus,
      larvaStatus,
      pupaStatus,
      feedingRecord,
      temperature,
      humidity,
      abnormalType,
      abnormalDetail,
    } = body

    if (!date) {
      return NextResponse.json({ error: '请提供记录日期。' }, { status: 400 })
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: '请提供日志标题。' }, { status: 400 })
    }

    if (stage && !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: '无效的阶段。' }, { status: 400 })
    }

    if (eggStatus && !VALID_EGG_STATUSES.includes(eggStatus)) {
      return NextResponse.json({ error: '无效的卵状态。' }, { status: 400 })
    }

    if (abnormalType && !VALID_ABNORMAL_TYPES.includes(abnormalType)) {
      return NextResponse.json({ error: '无效的异常类型。' }, { status: 400 })
    }

    const { data: log, error } = await db
      .from('colony_logs')
      .insert({
        colony_id: colonyId,
        user_id: user.id,
        date,
        title: title.trim(),
        content: content || null,
        stage: stage || null,
        worker_count: workerCount || null,
        egg_status: eggStatus || null,
        larva_status: larvaStatus || null,
        pupa_status: pupaStatus || null,
        feeding_record: feedingRecord || null,
        temperature: temperature ? parseFloat(temperature) : null,
        humidity: humidity ? parseFloat(humidity) : null,
        abnormal_type: abnormalType || null,
        abnormal_detail: abnormalDetail || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create log error:', error)
      return NextResponse.json({ error: '创建日志失败。' }, { status: 500 })
    }

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Create log error:', error)
    return NextResponse.json({ error: '创建日志失败。' }, { status: 500 })
  }
}
