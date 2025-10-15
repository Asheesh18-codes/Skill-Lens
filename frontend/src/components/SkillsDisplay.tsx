import React from 'react';
import { AnalysisResult } from '../types/api';

interface SkillsDisplayProps {
  analysis: AnalysisResult;
}

const SkillsDisplay: React.FC<SkillsDisplayProps> = ({ analysis }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Skills by Category */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Skills by Category</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(analysis.categories).map(([category, skills]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const confidence = analysis.confidence_scores[skill] || 0;
                  return (
                    <span
                      key={skill}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(confidence)}`}
                      title={`Confidence: ${(confidence * 100).toFixed(0)}%`}
                    >
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Skills with Confidence Scores */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Detected Skills</h3>
        <div className="space-y-3">
          {analysis.skills
            .filter(skill => analysis.confidence_scores[skill] > 0.2) // Filter low confidence
            .sort((a, b) => (analysis.confidence_scores[b] || 0) - (analysis.confidence_scores[a] || 0))
            .map((skill) => {
              const confidence = analysis.confidence_scores[skill] || 0;
              return (
                <div key={skill} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="font-medium text-gray-900">{skill}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(confidence)}`}>
                      {getConfidenceLabel(confidence)}
                    </span>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{analysis.skills.length}</div>
            <div className="text-sm text-gray-600">Total Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-600">{Object.keys(analysis.categories).length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analysis.skills.filter(skill => (analysis.confidence_scores[skill] || 0) >= 0.8).length}
            </div>
            <div className="text-sm text-gray-600">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {analysis.skills.filter(skill => {
                const conf = analysis.confidence_scores[skill] || 0;
                return conf >= 0.6 && conf < 0.8;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Medium Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsDisplay;