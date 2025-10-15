/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error caught by global handler:', err.message);
  
  // Log full stack in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle busboy/multipart form errors
  if (err.message && err.message.includes('Unexpected end of form')) {
    statusCode = 400;
    message = 'Upload interrupted or incomplete. Please try uploading again.';
  } else if (err.message && err.message.includes('Missing boundary')) {
    statusCode = 400;
    message = 'Invalid form data. Please ensure you are uploading a file correctly.';
  }
  // Handle specific error types
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'File upload error';
  } else if (err.message) {
    message = err.message;
    
    // Set appropriate status codes based on error message
    if (err.message.includes('not found') || err.message.includes('does not exist')) {
      statusCode = 404;
    } else if (err.message.includes('unauthorized') || err.message.includes('not authorized')) {
      statusCode = 401;
    } else if (err.message.includes('forbidden') || err.message.includes('access denied')) {
      statusCode = 403;
    } else if (err.message.includes('validation') || err.message.includes('invalid')) {
      statusCode = 400;
    } else if (err.message.includes('timeout') || err.message.includes('timed out')) {
      statusCode = 504;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      errorType: err.name 
    })
  });
};

/**
 * 404 handler for routes not found
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};