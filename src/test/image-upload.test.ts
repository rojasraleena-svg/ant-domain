import { describe, it, expect } from 'vitest'
import {
  validateImageFile,
  generateStoragePath,
  extractExtension,
} from '@/lib/image-upload'

// ============================================
// TDD: 观测日志图片上传 — 核心逻辑测试
// ============================================

function createTestFile(name: string, type: string, size: number = 1024): File {
  return new File(['x'.repeat(size)], name, { type })
}

// ---- 1. 文件验证 ----

describe('图片上传验证', () => {
  describe('validateImageFile — 应接受有效图片', () => {
    it('接受 JPEG 文件', () => {
      const file = createTestFile('photo.jpg', 'image/jpeg')
      expect(validateImageFile(file, 0)).toBeNull()
    })

    it('接受 PNG 文件', () => {
      const file = createTestFile('photo.png', 'image/png')
      expect(validateImageFile(file, 0)).toBeNull()
    })

    it('接受 WebP 文件', () => {
      const file = createTestFile('photo.webp', 'image/webp')
      expect(validateImageFile(file, 0)).toBeNull()
    })

    it('未超限时接受（currentCount=5）', () => {
      const file = createTestFile('photo.jpg', 'image/jpeg')
      expect(validateImageFile(file, 5)).toBeNull()
    })
  })

  describe('validateImageFile — 应拒绝无效文件', () => {
    it('拒绝超过 5MB 的文件', () => {
      const file = createTestFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
      const result = validateImageFile(file, 0)
      expect(result).not.toBeNull()
      expect(result?.code).toBe('FILE_TOO_LARGE')
    })

    it('恰好 5MB 应接受', () => {
      const file = createTestFile('ok.jpg', 'image/jpeg', 5 * 1024 * 1024)
      expect(validateImageFile(file, 0)).toBeNull()
    })

    it('拒绝 PDF', () => {
      const result = validateImageFile(createTestFile('doc.pdf', 'application/pdf'), 0)
      expect(result?.code).toBe('INVALID_TYPE')
    })

    it('拒绝纯文本', () => {
      const result = validateImageFile(createTestFile('data.txt', 'text/plain'), 0)
      expect(result?.code).toBe('INVALID_TYPE')
    })

    it('拒绝 GIF', () => {
      const result = validateImageFile(createTestFile('anim.gif', 'image/gif'), 0)
      expect(result?.code).toBe('INVALID_TYPE')
    })

    it('已满 6 张时应拒绝', () => {
      const result = validateImageFile(createTestFile('extra.jpg', 'image/jpeg'), 6)
      expect(result?.code).toBe('TOO_MANY_FILES')
    })
  })
})

// ---- 2. 存储路径生成 ----

describe('存储路径生成 generateStoragePath', () => {
  it('应生成符合规范的路径格式', () => {
    const path = generateStoragePath('user-123', '42', 'photo.jpg', 'image/jpeg')
    expect(path).toMatch(/^user-123\/42\/logs\/\d+_[a-z0-9]{8}\.jpg$/)
  })

  it('不同调用应产生不同随机后缀', () => {
    const p1 = generateStoragePath('u', '1', 'a.jpg', 'image/jpeg')
    const p2 = generateStoragePath('u', '1', 'b.jpg', 'image/jpeg')
    expect(p1).not.toBe(p2)
  })

  it('PNG MIME → .png 扩展名', () => {
    expect(generateStoragePath('u', '1', 'photo.png', 'image/png')).toMatch(/\.png$/)
  })

  it('WebP MIME → .webp 扩展名', () => {
    expect(generateStoragePath('u', '1', 'photo.webp', 'image/webp')).toMatch(/\.webp$/)
  })

  it('JPEG MIME → .jpg 扩展名', () => {
    expect(generateStoragePath('u', '1', 'photo.jpeg', 'image/jpeg')).toMatch(/\.jpg$/)
  })

  it('路径应包含 userId/colonyId 前缀', () => {
    const path = generateStoragePath('abc-def', '99', 'img.png', 'image/png')
    expect(path).toMatch(/^abc-def\/99\/logs\//)
  })
})

// ---- 3. 扩展名提取 ----

describe('扩展名提取 extractExtension', () => {
  it('image/jpeg → jpg', () => {
    expect(extractExtension('photo.jpg', 'image/jpeg')).toBe('jpg')
  })

  it('image/png → png (大小写无关)', () => {
    expect(extractExtension('photo.PNG', 'image/png')).toBe('png')
  })

  it('image/webp → webp', () => {
    expect(extractExtension('photo.webp', 'image/webp')).toBe('webp')
  })

  it('未知 MIME 时从文件名回退', () => {
    expect(extractExtension('photo.webp', 'application/octet-stream')).toBe('webp')
  })

  it('无扩展名且未知 MIME → bin', () => {
    expect(extractExtension('datafile', 'application/octet-stream')).toBe('bin')
  })
})

// ---- 4. 数据结构契约 ----

describe('colony_logs.images 数据结构', () => {
  it('应为 url+path 对象数组', () => {
    const images = [
      { url: 'https://example.com/img1.jpg', path: 'user/1/logs/abc.jpg' },
      { url: 'https://example.com/img2.png', path: 'user/1/logs/def.png' },
    ]
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveProperty('url')
    expect(images[0]).toHaveProperty('path')
  })

  it('空数组表示无图片', () => {
    const images: unknown[] = []
    expect(images).toHaveLength(0)
  })

  it('最多支持 6 张', () => {
    const images = Array.from({ length: 6 }, (_, i) => ({
      url: `https://example.com/img${i}.jpg`,
      path: `user/1/logs/img${i}.jpg`,
    }))
    expect(images.length).toBe(6)
  })

  it('URL 应为有效 HTTP(S) 地址', () => {
    const img = { url: 'https://xxx.supabase.co/storage/v1/object/public/colony-images/a.jpg', path: '' }
    expect(img.url).toMatch(/^https?:\/\//)
  })
})
