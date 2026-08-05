import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = Number(process.env.PORT) || 3000
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'out')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

async function resolveFile(reqPath) {
  let pathname
  try {
    pathname = decodeURIComponent(reqPath)
  } catch {
    return null
  }
  if (pathname.includes('\0')) return null

  let filePath = normalize(join(ROOT, pathname))
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) return null

  try {
    const info = await stat(filePath)
    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html')
      const idx = await stat(filePath)
      if (!idx.isFile()) return null
    }
  } catch {
    try {
      const info = await stat(filePath + '.html')
      return filePath + '.html'
    } catch {
      return null
    }
  }

  return filePath
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      res.end('Method Not Allowed')
      return
    }

    const filePath = await resolveFile(url.pathname)
    if (!filePath) {
      console.log('[static-server] 404 for', url.pathname, 'cwd=', process.cwd())
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found')
      return
    }

    const content = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': url.pathname.startsWith('/_next/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    res.end(req.method === 'HEAD' ? undefined : content)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Internal Server Error')
  }
}).listen(PORT, () => {
  console.log(`DawoLife web (static) running on http://localhost:${PORT}`)
})
