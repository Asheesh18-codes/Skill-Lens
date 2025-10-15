import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarProps {
  skillCategories: {
    [category: string]: string[];
  };
  confidenceScores: {
    [skill: string]: number;
  };
}

const SkillRadar: React.FC<SkillRadarProps> = ({ skillCategories, confidenceScores }) => {
  // Transform data for radar chart
  const radarData = Object.entries(skillCategories).map(([category, skills]) => {
    // Calculate average confidence for this category
    const categoryConfidence = skills.reduce((sum, skill) => {
      return sum + (confidenceScores[skill] || 0);
    }, 0) / skills.length;

    return {
      category: category.replace(' & ', '\n&\n'), // Break long category names
      confidence: Math.round(categoryConfidence * 100), // Convert to percentage
      fullMark: 100
    };
  });

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Skill Competency Radar
      </h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fontSize: 12, fill: '#374151' }}
            className="text-sm"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#6B7280' }}
          />
          <Radar
            name="Confidence"
            dataKey="confidence"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 text-sm text-gray-600 text-center">
        Confidence levels based on skill frequency and context in your resume
      </div>
    </div>
  );
};

export default SkillRadar;