import { NextRequest } from 'next/server'
import { getSession, verifyToken } from './auth'
import { validateApiKey } from './apiKey'
import { db } from './db'

export interface AuthUser {
  id: string
  username: string
  role?: string
}

export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    const validation = await validateApiKey(apiKey)
    if (validation.valid) {
      // API key 模式：查询用户角色
      const { data } = await db
        .from('users')
        .select('role')
        .eq('id', validation.userId)
        .single()
      return { id: validation.userId, username: '', role: data?.role || 'user' }
    }
    return null
  }

  // Session 模式：从 JWT 获取（已包含 role）
  const session = await getSession()
  return session
}

/** 检查用户是否为管理员 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthUser | null> {
  const user = await getAuthUser(request)
  if (!user || user.role !== 'admin') return null
  return user
}
