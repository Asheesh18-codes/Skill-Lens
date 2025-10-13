import spacy
import re
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="SkillLens AI Service",
    description="AI-powered skill extraction from resumes and job descriptions",
    version="1.0.0"
)

# Load spaCy model (download with: python -m spacy download en_core_web_sm)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: spaCy model 'en_core_web_sm' not found. Please install with: python -m spacy download en_core_web_sm")
    nlp = None

# Request/Response models
class SkillExtractionRequest(BaseModel):
    text: str

class SkillExtractionResponse(BaseModel):
    skills: List[str]
    categories: Dict[str, List[str]]
    confidence_scores: Dict[str, float]

# Predefined skill categories and keywords
SKILL_CATEGORIES = {
    "Programming Languages": [
        "python", "javascript", "java", "c++", "c#", "typescript", "php", "ruby", "go", "rust",
        "swift", "kotlin", "scala", "r", "matlab", "sql", "html", "css", "bash", "powershell"
    ],
    "Web Technologies": [
        "react", "angular", "vue", "node.js", "express", "django", "flask", "spring", "laravel",
        "jquery", "bootstrap", "tailwind", "sass", "webpack", "vite", "next.js", "nuxt.js"
    ],

    "Databases": [
        "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "oracle", "sqlite",
        "cassandra", "dynamodb", "firebase", "supabase"
    ],
    "Cloud & DevOps": [
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab", "github actions",
        "terraform", "ansible", "chef", "puppet", "nginx", "apache", "linux", "unix"
    ],
    "Data Science & ML": [
        "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas",
        "numpy", "matplotlib", "seaborn", "jupyter", "tableau", "power bi", "spark", "hadoop"
    ],
    "Mobile Development": [
        "android", "ios", "react native", "flutter", "xamarin", "ionic", "cordova"
    ],
    "Soft Skills": [
        "leadership", "communication", "teamwork", "problem solving", "project management",
        "agile", "scrum", "kanban", "mentoring", "presentation", "negotiation"
    ]
}

def extract_skills_with_spacy(text: str) -> List[str]:
    """Extract skills using spaCy NLP processing"""
    if not nlp:
        return []
    
    doc = nlp(text.lower())
    extracted_skills = set()
    
    # Extract entities that might be skills
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "LANGUAGE"]:
            extracted_skills.add(ent.text.strip())
    
    # Extract noun phrases that might be technical skills
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:  # Keep phrases short
            extracted_skills.add(chunk.text.strip())
    
    return list(extracted_skills)

def extract_skills_with_keywords(text: str) -> Dict[str, List[str]]:
    """Extract skills using predefined keyword matching"""
    text_lower = text.lower()
    categorized_skills = {}
    
    for category, skills in SKILL_CATEGORIES.items():
        found_skills = []
        for skill in skills:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                found_skills.append(skill)
        
        if found_skills:
            categorized_skills[category] = found_skills
    
    return categorized_skills

def calculate_confidence_scores(skills: List[str], text: str) -> Dict[str, float]:
    """Calculate confidence scores for extracted skills"""
    text_lower = text.lower()
    scores = {}
    
    for skill in skills:
        # Count occurrences
        occurrences = len(re.findall(r'\b' + re.escape(skill.lower()) + r'\b', text_lower))
        # Normalize by text length (simple heuristic)
        confidence = min(occurrences / max(len(text.split()) / 100, 1), 1.0)
        scores[skill] = round(confidence, 2)
    
    return scores

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SkillLens AI Service is running", "status": "healthy"}

@app.post("/extract", response_model=SkillExtractionResponse)
async def extract_skills(request: SkillExtractionRequest):
    """
    Extract skills from resume text or job description
    
    Args:
        request: SkillExtractionRequest containing text to analyze
    
    Returns:
        SkillExtractionResponse with extracted skills, categories, and confidence scores
    """
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Text is too short or empty")
        
        # Extract skills using keyword matching (more reliable)
        categorized_skills = extract_skills_with_keywords(request.text)
        
        # Flatten all skills
        all_skills = []
        for skills_list in categorized_skills.values():
            all_skills.extend(skills_list)
        
        # Remove duplicates while preserving order
        unique_skills = list(dict.fromkeys(all_skills))
        
        # Calculate confidence scores
        confidence_scores = calculate_confidence_scores(unique_skills, request.text)
        
        # Enhance with spaCy if available
        if nlp:
            spacy_skills = extract_skills_with_spacy(request.text)
            # Add high-confidence spaCy skills that aren't already found
            for skill in spacy_skills:
                if skill not in unique_skills and len(skill) > 2:
                    unique_skills.append(skill)
                    confidence_scores[skill] = 0.7  # Medium confidence for spaCy-only skills
        
        return SkillExtractionResponse(
            skills=unique_skills,
            categories=categorized_skills,
            confidence_scores=confidence_scores
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill extraction failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Detailed health check with service status"""
    return {
        "status": "healthy",
        "categories_loaded": len(SKILL_CATEGORIES),
        "service": "SkillLens AI Service",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )