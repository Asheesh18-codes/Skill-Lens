import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface HealthStatus {
  isHealthy: boolean;
  status: {
    status: string;
    categories_loaded: number;
    service: string;
    version: string;
  };
  timestamp: string;
}

const SystemStatus: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.checkAiStatus();
      if (response.success) {
        setHealthStatus(response.data);
      }
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${healthStatus?.isHealthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-3 ${healthStatus?.isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <h4 className="text-sm font-medium text-gray-900">System Status</h4>
            <p className="text-xs text-gray-600">
              {healthStatus?.isHealthy ? 'All services operational' : 'Service unavailable'}
            </p>
          </div>
        </div>
        
        {healthStatus?.isHealthy && (
          <div className="text-right">
            <div className="text-xs text-gray-600">
              AI Service: {healthStatus.status.service} v{healthStatus.status.version}
            </div>
            <div className="text-xs text-gray-500">
              {healthStatus.status.categories_loaded} skill categories loaded
            </div>
          </div>
        )}
        
        <button
          onClick={checkSystemHealth}
          className="ml-4 text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default SystemStatus;