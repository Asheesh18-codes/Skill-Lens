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
  };
}

export interface ApiError {
  success: false;
  message: string;
}