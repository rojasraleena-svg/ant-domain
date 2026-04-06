// ============================================
// 常量
// ============================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_IMAGES_PER_LOG = 6
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// ============================================
// 类型
// ============================================

export interface UploadResult {
  url: string
  path: string
}

export interface UploadValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'TOO_MANY_FILES'
  message: string
}

// ============================================
// 纯函数：验证与路径生成（可单元测试）
// ============================================

/**
 * 验证上传文件 — 返回 null 表示通过，否则返回错误信息
 */
export function validateImageFile(
  file: File,
  currentCount: number
): UploadValidationError | null {
  if (currentCount >= MAX_IMAGES_PER_LOG) {
    return { code: 'TOO_MANY_FILES', message: `最多上传 ${MAX_IMAGES_PER_LOG} 张图片` }
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      code: 'INVALID_TYPE',
      message: `仅支持 ${ALLOWED_TYPES.map((t) => t.split('/')[1].toUpperCase()).join('、')} 格式`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return null
}

/**
 * 从 MIME 类型或文件名提取扩展名
 */
export function extractExtension(fileName: string, mimeType: string): string {
  // 优先从 MIME 类型映射
  const mimeExt = MIME_EXT_MAP[mimeType]
  if (mimeExt) return mimeExt

  // 回退到文件名提取
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex > 0) {
    return fileName.slice(dotIndex + 1).toLowerCase()
  }

  return 'bin'
}

/**
 * 生成 Supabase Storage 路径
 * 格式: {userId}/{colonyId}/logs/{timestamp}_{random8}.{ext}
 */
export function generateStoragePath(
  userId: string,
  colonyId: string,
  fileName: string,
  mimeType: string
): string {
  const ext = extractExtension(fileName, mimeType)
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `${userId}/${colonyId}/logs/${timestamp}_${random}.${ext}`
}

// ============================================
// I/O 函数：Supabase Storage 操作
// ============================================

/**
 * 上传文件到 Supabase Storage colony-images 桶
 */
export async function uploadToStorage(
  buffer: ArrayBuffer,
  path: string,
  contentType: string
): Promise<UploadResult> {
  const { db } = await import('./db')

  const { data, error } = await db.storage
    .from('colony-images')
    .upload(path, buffer, { contentType })

  if (error) {
    throw new Error(`存储上传失败: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = db.storage.from('colony-images').getPublicUrl(data.path)

  return { url: publicUrl, path: data.path }
}

/**
 * 从 Supabase Storage 删除文件
 */
export async function deleteFromStorage(path: string): Promise<void> {
  const { db } = await import('./db')

  const { error } = await db.storage.from('colony-images').remove([path])

  if (error) {
    throw new Error(`存储删除失败: ${error.message}`)
  }
}
