import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import cloudinary from './cloudinary.js'

export type StoredFile = { url: string; publicId: string }

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

function extensionFor(mime: string, fallbackName?: string): string {
  const byMime = EXT_BY_MIME[mime.toLowerCase()]
  if (byMime) return byMime
  const ext = (fallbackName?.split('.').pop() || '').toLowerCase()
  if (/^[a-z0-9]{1,8}$/.test(ext)) return ext
  return 'bin'
}

// Local-disk storage for self-hosted cPanel deployments. Set STORAGE_DRIVER=local
// (see server/.env.example) and make sure the UPLOAD_DIR is writable by the Node
// process. Files are served back under /uploads via express.static() — which on
// cPanel works automatically because the Node app runs behind its own subdomain.
function uploadLocal(opts: { buffer: Buffer; mime: string; originalname: string }): StoredFile {
  const dir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
  const base = process.env.PUBLIC_UPLOAD_BASE_URL || `http://localhost:${process.env.PORT || 4000}`
  const now = new Date()
  const folder = join(dir, String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, '0'))
  mkdirSync(folder, { recursive: true })
  const ext = extensionFor(opts.mime, opts.originalname)
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const absolute = join(folder, filename)
  writeFileSync(absolute, opts.buffer)
  const rel = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${filename}`
  return { url: `${base.replace(/\/$/, '')}/uploads/${rel}`, publicId: `local:${rel}` }
}

async function uploadCloudinary(opts: {
  buffer: Buffer
  mime: string
  folder: string
}): Promise<StoredFile> {
  return new Promise<StoredFile>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: opts.folder },
      (error, result) => {
        if (error || !result) return reject(new Error(error?.message || 'Upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    ).end(opts.buffer)
  })
}

/** Returns true when the instance stores files on this server's disk (cPanel). */
export function isLocalStorage(): boolean {
  const driver = (process.env.STORAGE_DRIVER || process.env.UPLOAD_DRIVER || 'cloudinary').toLowerCase()
  return driver === 'local' || driver === 'disk' || driver === 'cpanel'
}

export function ensureUploadDir(): void {
  if (!isLocalStorage()) return
  const dir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
  mkdirSync(dir, { recursive: true })
}

/**
 * Uploads a file using the configured backend (Cloudinary by default, local
 * disk for self-hosted cPanel deployments). Always resolves with a URL + id.
 */
export async function uploadFile(opts: {
  buffer: Buffer
  mime: string
  originalname: string
  folder?: string
}): Promise<StoredFile> {
  if (isLocalStorage()) {
    return uploadLocal({ buffer: opts.buffer, mime: opts.mime, originalname: opts.originalname })
  }
  return uploadCloudinary({ buffer: opts.buffer, mime: opts.mime, folder: opts.folder || 'delaharme' })
}

/** Absolute folder where local files are stored (for reference/setup docs). */
export function uploadDirPath(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
}

export function uploadDirExists(): boolean {
  return existsSync(uploadDirPath())
}

export function subExtension(mime: string, fallbackName?: string): string {
  return extensionFor(mime, fallbackName)
}