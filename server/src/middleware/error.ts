import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal server error' })
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not found' })
}
