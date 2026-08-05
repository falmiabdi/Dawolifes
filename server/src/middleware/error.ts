import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Max 50MB.' : err.message || 'Upload error'
    return res.status(400).json({ message })
  }
  if (err?.message && String(err.message).includes('File type not allowed')) {
    return res.status(400).json({ message: err.message })
  }
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal server error' })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not found' })
}
