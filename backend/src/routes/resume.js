import express from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import aiService from '../services/aiService.js';
import { uploadPDF, handleUploadErrors } from '../middleware/upload.js';

const router = express.Router();

/**
 * POST /api/v1/resume/upload
 * Upload and analyze resume PDF file
 */
router.post('/upload', (req, res, next) => {
  // Wrap multer middleware to catch async errors
  uploadPDF(req, res, (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }
    next();
  });
}, async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a PDF resume.'
      });
    }

    // Debug: Check buffer validity
    if (!req.file.buffer || !(req.file.buffer instanceof Buffer)) {
      console.error('Uploaded file buffer is invalid:', req.file.buffer);
      return res.status(400).json({
        success: false,
        message: 'Uploaded file buffer is invalid. Please try again.'
      });
    }
    
    console.log(`📄 Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Extract text from PDF using robust logic
    let resumeText;
    try {
      let pdfData;
      if (typeof pdf === 'function') {
        pdfData = await pdf(req.file.buffer);
      } else if (pdf.default && typeof pdf.default === 'function') {
        pdfData = await pdf.default(req.file.buffer);
      } else if (pdf.parse && typeof pdf.parse === 'function') {
        pdfData = await pdf.parse(req.file.buffer);
      } else {
        console.error('Available pdf-parse methods:', Object.keys(pdf));
        throw new Error('Cannot find pdf parsing function');
      }
      resumeText = pdfData.text;
      console.log(`✅ Extracted ${resumeText.length} characters from PDF`);
    } catch (pdfError) {
      console.error('❌ PDF parsing error:', pdfError);
      return res.status(400).json({
        success: false,
        message: 'Failed to parse PDF file. Please ensure it\'s a valid PDF document.'
      });
    }

    // Validate extracted text
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient text content in resume. Please upload a resume with more detailed content.'
      });
    }

    // Extract skills using AI service
    console.log('🤖 Sending to AI service for skill extraction...');
    const skillsResult = await aiService.extractSkills(resumeText);
    console.log('✅ Skills extracted successfully');

    // Prepare response data
    const responseData = {
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        uploadTime: new Date().toISOString()
      },
      extractedText: {
        length: resumeText.length,
        preview: resumeText.substring(0, 200) + '...'
      },
      analysis: skillsResult.data
    };

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Resume upload error:', error);
    next(error);
  }
});

/**
 * POST /api/v1/resume/analyze-text
 * Analyze raw text (for testing or direct text input)
 */
router.post('/analyze-text', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid text content for analysis (minimum 10 characters).'
      });
    }

    // Extract skills using AI service
    const skillsResult = await aiService.extractSkills(text);

    res.status(200).json({
      success: true,
      message: 'Text analyzed successfully',
      data: {
        analysis: skillsResult.data,
        textStats: {
          length: text.length,
          wordCount: text.split(/\s+/).length
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/resume/ai-status
 * Check AI service health status
 */
router.get('/ai-status', async (req, res, next) => {
  try {
    const isHealthy = await aiService.checkHealth();
    const status = isHealthy ? await aiService.getStatus() : null;

    res.status(200).json({
      success: true,
      message: 'AI service status retrieved',
      data: {
        isHealthy,
        status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

export default router;