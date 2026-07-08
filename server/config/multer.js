const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

// ─────────────────────────────────────────
// STORAGE CONFIG
// Defines where and how to store uploaded files
// ─────────────────────────────────────────
const storage = multer.diskStorage({

  // Where to save the file
  destination: (req, file, cb) => {
    // Create uploads/attachments folder if it doesn't exist
    const uploadPath = path.join(__dirname, '../uploads/attachments')

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
      // recursive: true creates parent folders too
    }

    cb(null, uploadPath)
  },

  // What to name the file
  filename: (req, file, cb) => {
    // Generate unique filename using uuid
    // Example: a1b2c3d4-e5f6-7890.pdf
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    // path.extname gets the file extension (.pdf, .png etc)
    cb(null, uniqueName)
  },
})

// ─────────────────────────────────────────
// FILE FILTER
// Only allow certain file types
// ─────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
    // Accept file
  } else {
    cb(
      new Error(
        'File type not allowed. Allowed types: images, PDF, Word, Excel, text files'
      ),
      false
      // Reject file
    )
  }
}

// ─────────────────────────────────────────
// MULTER INSTANCE
// ─────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    // Max file size: 10MB
    // 10 * 1024 * 1024 = 10,485,760 bytes = 10MB
  },
})

module.exports = upload