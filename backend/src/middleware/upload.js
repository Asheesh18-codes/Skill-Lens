import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req, file, cb) => {
  // Allow only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

/**
 * Middleware for handling single PDF file upload
 */
export const uploadPDF = upload.single('resume');

/**
 * Error handling middleware for multer and form parsing
 */
export const handleUploadErrors = (error, req, res, next) => {
  // Handle multer-specific errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please upload only one file.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Please use "resume" as the field name.'
      });
    }
  }
  
  // Handle busboy/multipart form errors
  if (error && error.message) {
    if (error.message.includes('Unexpected end of form')) {
      return res.status(400).json({
        success: false,
        message: 'Upload interrupted or incomplete. Please try uploading again.'
      });
    }
    
    if (error.message.includes('Missing boundary')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form data. Please ensure you are uploading a file correctly.'
      });
    }
    
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a PDF file.'
      });
    }
  }
  
  // Pass to next error handler if not handled
  next(error);
};