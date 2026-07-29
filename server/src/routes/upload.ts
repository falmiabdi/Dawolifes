import { Router } from 'express'
import multer from 'multer'
import cloudinary from '../utils/cloudinary.js'

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

router.post('/', upload.single('file'), async (_req, res) => {
  try {
    if (!_req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'delaharme' },
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message || 'Cloudinary upload failed' })
        }
        res.json({
          message: 'Upload successful',
          url: result?.secure_url || '',
          publicId: result?.public_id || '',
          filename: _req.file!.originalname,
          size: _req.file!.size,
        })
      }
    )
    result.end(_req.file.buffer)
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

router.post('/multiple', upload.array('files', 10), async (_req, res) => {
  try {
    if (!_req.files || _req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }
    const uploadPromises = (_req.files as Express.Multer.File[]).map((file) => {
      return new Promise<{ url: string; publicId: string; filename: string; size: number }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'delaharme' },
          (error, result) => {
            if (error) return reject(error)
            resolve({
              url: result?.secure_url || '',
              publicId: result?.public_id || '',
              filename: file.originalname,
              size: file.size,
            })
          }
        ).end(file.buffer)
      })
    })
    const files = await Promise.all(uploadPromises)
    res.json({ message: 'Upload successful', files })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

export default router