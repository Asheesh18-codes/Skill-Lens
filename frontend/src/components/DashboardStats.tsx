import React from 'react';
import { AnalysisResult } from '../types/api';

interface DashboardStatsProps {
  analysis: AnalysisResult;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ analysis }) => {
  const totalSkills = analysis.skills.length;
  const categoriesCount = Object.keys(analysis.categories).length;
  
  // Calculate average confidence
  const confidenceValues = Object.values(analysis.confidence_scores);
  const avgConfidence = confidenceValues.reduce((sum, score) => sum + score, 0) / confidenceValues.length;
  
  // Categorize skills by confidence
  const highConfidenceSkills = confidenceValues.filter(score => score >= 0.8).length;
  const mediumConfidenceSkills = confidenceValues.filter(score => score >= 0.5 && score < 0.8).length;
  const lowConfidenceSkills = confidenceValues.filter(score => score < 0.5).length;

  const stats = [
    {
      title: 'Total Skills',
      value: totalSkills,
      icon: '🎯',
      color: 'bg-blue-500'
    },
    {
      title: 'Skill Categories',
      value: categoriesCount,
      icon: '📂',
      color: 'bg-green-500'
    },
    {
      title: 'Avg Confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      icon: '📊',
      color: 'bg-purple-500'
    },
    {
      title: 'High Confidence',
      value: highConfidenceSkills,
      icon: '⭐',
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Skill Analysis Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`${stat.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Confidence Distribution */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-medium text-gray-800 mb-4">Confidence Distribution</h4>
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>High (80%+): {highConfidenceSkills} skills</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Medium (50-80%): {mediumConfidenceSkills} skills</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Low (&lt;50%): {lowConfidenceSkills} skills</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;