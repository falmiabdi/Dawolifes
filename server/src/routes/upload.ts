import { Router } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'

const uploadDir = path.join(process.cwd(), 'server', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|pdf|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

const router = Router()

// Upload file
router.post('/', upload.single('file'), (_req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    res.json({
      message: 'Upload successful',
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

// Upload multiple files
router.post('/multiple', upload.array('files', 10), (_req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }
    const files = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    }))
    res.json({ message: 'Upload successful', files })
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' })
  }
})

export default router
