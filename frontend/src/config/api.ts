// API configuration
export const API_BASE_URL = 'http://localhost:3001/api/v1';

export const API_ENDPOINTS = {
  UPLOAD_RESUME: `${API_BASE_URL}/resume/upload`,
  ANALYZE_TEXT: `${API_BASE_URL}/resume/analyze-text`,
  AI_STATUS: `${API_BASE_URL}/resume/ai-status`,
} as const;