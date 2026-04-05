import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-api'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: '未授权访问。' }, { status: 401 })
    }

    const { data: colonies, error } = await db
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
        species:species(id, name_cn, name_lat, genus)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get colonies error:', error)
      return NextResponse.json({ error: '获取蚁群列表失败。' }, { status: 500 })
    }

    return NextResponse.json({ colonies })
  } catch (error) {
    console.error('Get colonies error:', error)
    return NextResponse.json({ error: '获取蚁群列表失败。' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: '未授权访问。' }, { status: 401 })
    }

    const body = await request.json()
    const { name, speciesId, foundedDate, queenCount, acquiredDate, acquireMethod, notes } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '请提供蚁群名称。' }, { status: 400 })
    }

    if (!speciesId || typeof speciesId !== 'number') {
      return NextResponse.json({ error: '请提供有效的物种 ID。' }, { status: 400 })
    }

    if (!foundedDate) {
      return NextResponse.json({ error: '请提供建档日期。' }, { status: 400 })
    }

    const { data: species } = await db
      .from('species')
      .select('id')
      .eq('id', speciesId)
      .single()

    if (!species) {
      return NextResponse.json({ error: '物种不存在。' }, { status: 400 })
    }

    const { data: colony, error } = await db
      .from('colonies')
      .insert({
        user_id: user.id,
        name: name.trim(),
        species_id: speciesId,
        founded_date: foundedDate,
        queen_count: queenCount || 1,
        acquired_date: acquiredDate || null,
        acquire_method: acquireMethod || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create colony error:', error)
      return NextResponse.json({ error: '创建蚁群失败。' }, { status: 500 })
    }

    return NextResponse.json({ colony }, { status: 201 })
  } catch (error) {
    console.error('Create colony error:', error)
    return NextResponse.json({ error: '创建蚁群失败。' }, { status: 500 })
  }
}
