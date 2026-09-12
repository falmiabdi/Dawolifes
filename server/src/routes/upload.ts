import { Router } from 'express'
import multer from 'multer'
import { uploadFile } from '../utils/storage.js'
import { authMiddleware } from '../middleware/auth.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|pdf|doc|docx/
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '')
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

const router = Router()

router.post('/', authMiddleware, upload.single('file'), async (_req, res) => {
  try {
    if (!_req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const { url, publicId } = await uploadFile({
      buffer: _req.file.buffer,
      mime: _req.file.mimetype,
      originalname: _req.file.originalname,
      folder: 'delaharme',
    })
    res.json({
      message: 'Upload successful',
      url,
      publicId,
      filename: _req.file.originalname,
      size: _req.file.size,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

router.post('/multiple', authMiddleware, upload.array('files', 10), async (_req, res) => {
  try {
    if (!_req.files || _req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }
    const files = await Promise.all(
      (_req.files as Express.Multer.File[]).map(async (file) => {
        const { url, publicId } = await uploadFile({
          buffer: file.buffer,
          mime: file.mimetype,
          originalname: file.originalname,
          folder: 'delaharme',
        })
        return { url, publicId, filename: file.originalname, size: file.size }
      })
    )
    res.json({ message: 'Upload successful', files })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

export default router