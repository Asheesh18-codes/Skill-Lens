import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { UploadResponse } from '../types/api';

const api = axios.create({
  timeout: 30000, // 30 seconds timeout
});

export const apiService = {
  // Upload resume file
  uploadResume: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post<UploadResponse>(
      API_ENDPOINTS.UPLOAD_RESUME,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  // Analyze text directly
  analyzeText: async (text: string): Promise<UploadResponse> => {
    const response = await api.post<UploadResponse>(
      API_ENDPOINTS.ANALYZE_TEXT,
      { text }
    );

    return response.data;
  },

  // Check AI service status
  checkAiStatus: async (): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.AI_STATUS);
    return response.data;
  },
};