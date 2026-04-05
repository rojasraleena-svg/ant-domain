import { NextRequest } from 'next/server'
import { getSession } from './auth'
import { validateApiKey } from './apiKey'

export async function getAuthUser(
  request: NextRequest
): Promise<{ id: string; username: string } | null> {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    const validation = await validateApiKey(apiKey)
    if (validation.valid) {
      return { id: validation.userId, username: '' }
    }
    return null
  }

  const session = await getSession()
  return session
}
