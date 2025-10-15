import React from 'react';

interface RoadmapPhase {
  phase: string;
  duration: string;
  skills: string[];
  resources: Array<{
    title: string;
    type: string;
    url?: string;
    duration?: string;
  }>;
  projects: string[];
  milestones: string[];
}

interface RoadmapData {
  role: string;
  timeline: string;
  overview: string;
  skill_gaps: string[];
  phases: RoadmapPhase[];
  certifications: string[];
  job_search_tips: string[];
  salary_range?: string;
  industry_trends?: string[];
}

interface RoadmapDisplayProps {
  roadmap: RoadmapData;
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ roadmap }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">🗺️ Career Roadmap: {roadmap.role}</h2>
        <p className="text-lg opacity-90">Timeline: {roadmap.timeline}</p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-3">📝 Overview</h3>
        <p className="text-gray-700">{roadmap.overview}</p>
      </div>

      {/* Skill Gaps */}
      {roadmap.skill_gaps && roadmap.skill_gaps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">🎯 Skills to Learn</h3>
          <div className="flex flex-wrap gap-2">
            {roadmap.skill_gaps.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Learning Phases */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">📚 Learning Phases</h3>
        
        {roadmap.phases.map((phase, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold text-blue-600">{phase.phase}</h4>
                <p className="text-sm text-gray-500">Duration: {phase.duration}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Phase {index + 1}
              </span>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <p className="font-semibold mb-2">💡 Skills to Master:</p>
              <div className="flex flex-wrap gap-2">
                {phase.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Resources */}
            {phase.resources && phase.resources.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2">📖 Learning Resources:</p>
                <ul className="space-y-2">
                  {phase.resources.map((resource, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <div className="flex-1">
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {resource.title}
                          </a>
                        ) : (
                          <span className="font-medium">{resource.title}</span>
                        )}
                        <span className="text-sm text-gray-500 ml-2">
                          ({resource.type}{resource.duration ? ` • ${resource.duration}` : ''})
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projects */}
            {phase.projects && phase.projects.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2">🛠️ Hands-on Projects:</p>
                <ul className="space-y-1">
                  {phase.projects.map((project, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span className="text-gray-700">{project}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Milestones */}
            {phase.milestones && phase.milestones.length > 0 && (
              <div>
                <p className="font-semibold mb-2">✅ Milestones:</p>
                <ul className="space-y-1">
                  {phase.milestones.map((milestone, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span className="text-gray-700">{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Certifications */}
      {roadmap.certifications && roadmap.certifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">🎓 Recommended Certifications</h3>
          <ul className="space-y-2">
            {roadmap.certifications.map((cert, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">🏆</span>
                <span className="text-gray-700">{cert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Job Search Tips */}
      {roadmap.job_search_tips && roadmap.job_search_tips.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-3">💼 Job Search Tips</h3>
          <ul className="space-y-2">
            {roadmap.job_search_tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">💡</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Salary & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roadmap.salary_range && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">💰 Expected Salary</h3>
            <p className="text-gray-700 text-lg">{roadmap.salary_range}</p>
          </div>
        )}

        {roadmap.industry_trends && roadmap.industry_trends.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-3">📈 Industry Trends</h3>
            <ul className="space-y-1">
              {roadmap.industry_trends.map((trend, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span className="text-gray-700">{trend}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapDisplay;
