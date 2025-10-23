export interface Skill {
  name: string;
  confidence: number;
}

export interface SkillCategory {
  [category: string]: string[];
}

export interface AnalysisResult {
  skills: string[];
  categories: SkillCategory;
  confidence_scores: { [skill: string]: number };
}

export interface ATSBreakdown {
  sections: number;
  keywords: number;
  formatting: number;
  impact: number;
  quantification: number;
  contact: number;
}

export interface ATSMeta {
  skillsCount: number;
  categories: string[];
  avgConfidence: number;
}

export interface ATSResult {
  score: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  meta: ATSMeta;
  version: string;
}

export interface ResumeSummary {
  resumeSummary: string;
  improvements: string; // concise combined suggestions line
}

export interface FileInfo {
  originalName: string;
  size: number;
  uploadTime: string;
}

export interface ExtractedText {
  length: number;
  preview: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    file: FileInfo;
    extractedText: ExtractedText;
    analysis: AnalysisResult;
    ats?: ATSResult;
    summary?: ResumeSummary;
  };
}

export interface ApiError {
  success: false;
  message: string;
}