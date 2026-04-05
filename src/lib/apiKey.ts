import { randomBytes } from 'crypto'
import { db } from './db'

export function generateApiKey(): string {
  return `ant_${randomBytes(24).toString('hex')}`
}

export function hashApiKey(key: string): string {
  return key
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('ant_') && key.length === 52
}

export async function validateApiKey(
  key: string
): Promise<{ valid: true; userId: string } | { valid: false; reason: string }> {
  if (!isValidApiKeyFormat(key)) {
    return { valid: false, reason: 'Invalid API key format' }
  }

  const keyHash = hashApiKey(key)

  const { data: apiKey, error } = await db
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKey) {
    return { valid: false, reason: 'API key not found' }
  }

  return { valid: true, userId: apiKey.user_id }
}

export async function createApiKey(userId: string, name: string): Promise<string> {
  const rawKey = generateApiKey()
  const keyHash = hashApiKey(rawKey)

  await db.from('api_keys').insert({
    name,
    key_hash: keyHash,
    user_id: userId,
  })

  return rawKey
}

export async function deleteApiKey(userId: string, keyId: string): Promise<boolean> {
  const { data, error } = await db
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId)
    .select()

  if (error) {
    throw error
  }

  return (data?.length ?? 0) > 0
}

export async function listApiKeys(userId: string) {
  const { data: keys, error } = await db
    .from('api_keys')
    .select('id, name, key_hash, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return keys ?? []
}
