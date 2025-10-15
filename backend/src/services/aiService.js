import axios from 'axios';

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 120000; // 120 seconds
  }

  /**
   * Extract skills from resume text using AI service
   * @param {string} text - Resume text to analyze
   * @returns {Promise<Object>} - Extracted skills data
   */
  async extractSkills(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length < 10) {
        throw new Error('Invalid or insufficient text provided for skill extraction');
      }

      const response = await axios.post(
        `${this.baseURL}/extract`,
        { text: text.trim() },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Skills extracted successfully'
      };

    } catch (error) {
      console.error('AI Service Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is not available. Please ensure the FastAPI service is running.');
      }
      
      if (error.response) {
        // AI service returned an error
        throw new Error(`AI service error: ${error.response.data?.detail || error.response.statusText}`);
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI service request timed out. Please try again.');
      }
      
      throw new Error(`Failed to extract skills: ${error.message}`);
    }
  }

  /**
   * Check if AI service is healthy
   * @returns {Promise<boolean>} - Service health status
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 60000 // 60 seconds
      });
      return response.status === 200;
    } catch (error) {
      if (error.response) {
        console.error('AI Service health check failed:', error.response.status, error.response.data);
      } else {
        console.error('AI Service health check failed:', error.message);
      }
      return false;
    }
  }

  /**
   * Get AI service status and configuration
   * @returns {Promise<Object>} - Service status details
   */
  async getStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get AI service status: ${error.message}`);
    }
  }
}

export default new AIService();