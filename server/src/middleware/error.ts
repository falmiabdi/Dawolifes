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
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error'
  res.status(500).json({ message })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not found' })
}
