import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import SkillsDisplay from './components/SkillsDisplay';
import SkillRadar from './components/SkillRadar';
import DashboardStats from './components/DashboardStats';
import SystemStatus from './components/SystemStatus';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Chatbot from './components/Chatbot';
import RoadmapDisplay from './components/RoadmapDisplay';
import { apiService } from './services/apiService';
import { UploadResponse, AnalysisResult } from './types/api';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [view, setView] = useState<'upload' | 'chat' | 'roadmap'>('chat');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response: UploadResponse = await apiService.uploadResume(file);
      
      if (response.success) {
        setAnalysisResult(response.data.analysis);
        setFileInfo(response.data.file);
        
        // Extract skill names for chatbot context
        const skills = response.data.analysis.skills || [];
        setExtractedSkills(skills);
        
        // Switch to results view
        setView('upload');
      } else {
        setError(response.message || 'Failed to analyze resume');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to upload and analyze resume. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoadmapGenerated = (generatedRoadmap: any) => {
    setRoadmap(generatedRoadmap);
    setView('roadmap');
  };

  const handleRetry = () => {
    setError(null);
    setAnalysisResult(null);
    setFileInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">🎯 SkillLens AI Career Coach</h1>
            <p className="mt-2 text-gray-600">
              Your personalized AI mentor for career growth and learning
            </p>
          </div>
          
          {/* Navigation */}
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setView('chat')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💬 Career Coach
            </button>
            <button
              onClick={() => setView('upload')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 Analyze Resume
            </button>
            {roadmap && (
              <button
                onClick={() => setView('roadmap')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === 'roadmap'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🗺️ My Roadmap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status */}
        <SystemStatus />

        {/* Chat View */}
        {view === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Chatbot 
                userSkills={extractedSkills}
                onRoadmapGenerated={handleRoadmapGenerated}
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3">📤 Quick Actions</h3>
                <FileUpload 
                  onFileSelect={handleFileUpload}
                  isLoading={isLoading}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Upload your resume to get personalized career advice
                </p>
              </div>
              
              {extractedSkills.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold mb-3">🎯 Your Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.slice(0, 10).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {extractedSkills.length > 10 && (
                    <p className="mt-2 text-sm text-gray-500">
                      +{extractedSkills.length - 10} more
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload/Resume Analysis View */}
        {view === 'upload' && (
          <>
            {!analysisResult && !isLoading && !error && (
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Upload Your Resume
                  </h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Upload your resume in PDF format and let our AI analyze your skills, 
                    categorize them, and provide confidence scores for each skill detected.
                  </p>
                </div>
                
                <FileUpload 
                  onFileSelect={handleFileUpload}
                  isLoading={isLoading}
                />
              </div>
            )}

            {isLoading && (
              <LoadingSpinner 
                size="lg" 
                message="Analyzing your resume... This may take a few moments."
              />
            )}

            {error && (
              <ErrorMessage 
                message={error}
                onRetry={handleRetry}
              />
            )}

            {analysisResult && fileInfo && (
              <div className="space-y-8">
                {/* File Info */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">File Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">File Name:</span>
                      <span className="ml-2 text-gray-600">{fileInfo.originalName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Size:</span>
                      <span className="ml-2 text-gray-600">
                        {(fileInfo.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Processed:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(fileInfo.uploadTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <DashboardStats analysis={analysisResult} />

                {/* Skills Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Skills List */}
                  <div>
                    <SkillsDisplay analysis={analysisResult} />
                  </div>
                  
                  {/* Skill Radar Chart */}
                  <div>
                    <SkillRadar 
                      skillCategories={analysisResult.categories}
                      confidenceScores={analysisResult.confidence_scores}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="text-center">
                  <button
                    onClick={handleRetry}
                    className="btn-primary"
                  >
                    Analyze Another Resume
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Roadmap View */}
        {view === 'roadmap' && roadmap && (
          <RoadmapDisplay roadmap={roadmap} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Powered by AI • Built with React & FastAPI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
