import React, { useEffect, useState } from 'react';
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
import { UploadResponse, AnalysisResult, ATSResult, ResumeSummary } from './types/api';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [ats, setAts] = useState<ATSResult | null>(null);
  const [prevAts, setPrevAts] = useState<ATSResult | null>(null);
  const [summary, setSummary] = useState<ResumeSummary | null>(null);
  const [view, setView] = useState<'upload' | 'chat' | 'roadmap'>('chat');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response: UploadResponse = await apiService.uploadResume(file);
      
      if (response.success) {
        // move current ats to prev before setting new one
        setPrevAts(prev => (ats ? ats : prev));
        setAnalysisResult(response.data.analysis);
        setFileInfo(response.data.file);
        setAts(response.data.ats || null);
        setSummary(response.data.summary || null);
        
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
    setAts(null);
    setSummary(null);
    // Keep prevAts so user can compare next upload
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm dark:shadow-none border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">🎯 SkillLens AI Career Coach</h1>
              <p className="mt-2 text-gray-600 dark:text-slate-400">
              Your personalized AI mentor for career growth and learning
            </p>
            </div>
            <button
              onClick={toggleTheme}
              className="ml-4 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
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
          <div className="max-w-6xl mx-auto">
            <Chatbot 
              userSkills={extractedSkills}
              onRoadmapGenerated={handleRoadmapGenerated}
            />
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

                {/* ATS Score & Summary */}
                {(ats || summary) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ATS Score Card */}
                    {ats && (
                      <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">ATS Score</h3>
                          <div className="flex items-center gap-2">
                            {prevAts && (
                              <span className={`text-xs px-2 py-1 rounded-full ${ats.score - prevAts.score >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {ats.score - prevAts.score >= 0 ? '+' : ''}{Math.round(ats.score - prevAts.score)}
                              </span>
                            )}
                            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-700 font-bold text-lg">
                              {Math.round(ats.score)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Sections</div>
                            <div className="font-semibold">{ats.breakdown.sections}/35</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Keywords</div>
                            <div className="font-semibold">{ats.breakdown.keywords}/30</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Formatting</div>
                            <div className="font-semibold">{ats.breakdown.formatting}/20</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Impact</div>
                            <div className="font-semibold">{ats.breakdown.impact}/10</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Quantification</div>
                            <div className="font-semibold">{ats.breakdown.quantification}/5</div>
                          </div>
                          <div className="p-3 rounded-lg bg-gray-50">
                            <div className="text-gray-500">Contact</div>
                            <div className="font-semibold">{ats.breakdown.contact}/5</div>
                          </div>
                        </div>
                        {ats.suggestions?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-800 mb-2">Top Improvements</h4>
                            <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                              {ats.suggestions.slice(0, 5).map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Concise Resume Summary */}
                    {summary && (
                      <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Suggested Resume Summary</h3>
                        <p className="text-gray-700 text-sm leading-relaxed">{summary.resumeSummary}</p>
                        {summary.improvements && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                            <span className="font-semibold">Quick tip:</span> {summary.improvements}
                          </div>
                        )}
                        <button
                          className="mt-4 btn-secondary text-sm"
                          onClick={() => navigator.clipboard.writeText(summary.resumeSummary)}
                        >
                          Copy Summary
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 dark:text-slate-400 text-sm">
            <p>Powered by AI • Built with React & FastAPI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
