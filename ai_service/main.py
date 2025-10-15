import spacy
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import logging

# Import our custom NLP engine
from nlp_engine import create_skill_extractor, create_job_role_matcher
from career_advisor import career_advisor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SkillLens AI Service",
    description="AI-powered skill extraction from resumes and job descriptions",
    version="1.0.0"
)

# Initialize NLP components
try:
    skill_extractor = create_skill_extractor()
    job_matcher = create_job_role_matcher()
    logger.info("NLP engine initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize NLP engine: {e}")
    skill_extractor = None
    job_matcher = None

# Request/Response models
class SkillExtractionRequest(BaseModel):
    text: str

class SkillExtractionResponse(BaseModel):
    skills: List[str]
    categories: Dict[str, List[str]]
    confidence_scores: Dict[str, float]

class JobMatchRequest(BaseModel):
    skills: List[str]
    target_role: str = None

class JobMatchResponse(BaseModel):
    suggested_roles: List[Dict[str, Any]]
    best_fit: Optional[Dict[str, Any]] = None

# Chat and Roadmap models
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    userProfile: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    message: str
    data: Optional[Dict[str, Any]] = None
    suggestions: List[str] = []

class RoadmapRequest(BaseModel):
    targetRole: str
    currentSkills: List[str] = []
    timeline: str = "6 months"

# Legacy skill categories for fallback
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
    # Load spaCy model if not already loaded
    global nlp
    if "nlp" not in globals() or nlp is None:
        try:
            nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            logger.error(f"Failed to load spaCy model: {e}")
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
    Extract skills from resume text or job description using advanced NLP
    
    Args:
        request: SkillExtractionRequest containing text to analyze
    
    Returns:
        SkillExtractionResponse with extracted skills, categories, and confidence scores
    """
    try:
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Text is too short or empty")
        
        # Use advanced NLP engine if available
        if skill_extractor:
            logger.info("Using advanced NLP engine for skill extraction")
            result = skill_extractor.extract_skills(request.text, use_all_methods=True)
            
            return SkillExtractionResponse(
                skills=result["skills"],
                categories=result["categories"],
                confidence_scores=result["confidence_scores"]
            )
        
        # Fallback to legacy extraction method
        logger.warning("Using fallback skill extraction method")
        categorized_skills = extract_skills_with_keywords(request.text)
        
        # Flatten all skills
        all_skills = []
        for skills_list in categorized_skills.values():
            all_skills.extend(skills_list)
        
        # Remove duplicates while preserving order
        unique_skills = list(dict.fromkeys(all_skills))
        
        # Calculate confidence scores
        confidence_scores = calculate_confidence_scores(unique_skills, request.text)
        
        return SkillExtractionResponse(
            skills=unique_skills,
            categories=categorized_skills,
            confidence_scores=confidence_scores
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill extraction failed: {str(e)}")

@app.post("/match-job-roles", response_model=JobMatchResponse)
async def match_job_roles(request: JobMatchRequest):
    """
    Match user skills to potential job roles
    
    Args:
        request: JobMatchRequest containing user skills and optional target role
    
    Returns:
        JobMatchResponse with suggested roles and fit analysis
    """
    try:
        if not request.skills:
            raise HTTPException(status_code=400, detail="No skills provided")
        
        if job_matcher:
            # Get suggested roles
            suggested_roles = job_matcher.suggest_best_roles(request.skills, top_n=5)
            
            # If target role specified, calculate specific fit
            best_fit = None
            if request.target_role:
                best_fit = job_matcher.calculate_role_fit(request.skills, request.target_role)
                best_fit["role"] = request.target_role
            
            return JobMatchResponse(
                suggested_roles=suggested_roles,
                best_fit=best_fit
            )
        else:
            raise HTTPException(status_code=503, detail="Job matching service not available")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat with AI Career Coach
    
    Args:
        request: ChatRequest with message, history, and user profile
    
    Returns:
        ChatResponse with AI's message, structured data, and suggestions
    """
    try:
        logger.info(f"💬 Chat request: '{request.message[:50]}...'")
        
        response = await career_advisor.generate_chat_response(
            message=request.message,
            history=request.history,
            user_profile=request.userProfile
        )
        
        logger.info(f"✅ Chat response generated")
        return ChatResponse(**response)
    
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/roadmap")
async def generate_roadmap(request: RoadmapRequest):
    """
    Generate personalized career roadmap
    
    Args:
        request: RoadmapRequest with target role, current skills, and timeline
    
    Returns:
        Detailed career roadmap with phases, resources, and milestones
    """
    try:
        logger.info(f"🗺️ Roadmap request for: {request.targetRole}")
        
        roadmap = await career_advisor.generate_career_roadmap(
            target_role=request.targetRole,
            current_skills=request.currentSkills,
            timeline=request.timeline
        )
        
        logger.info(f"✅ Roadmap generated for {request.targetRole}")
        return roadmap
    
    except Exception as e:
        logger.error(f"❌ Roadmap error: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Detailed health check with service status"""
    nlp_engine_status = "available" if skill_extractor else "unavailable"
    job_matcher_status = "available" if job_matcher else "unavailable"
    career_advisor_status = "available" if career_advisor else "unavailable"
    
    return {
        "status": "healthy",
        "categories_loaded": len(SKILL_CATEGORIES),
        "service": "SkillLens AI Career Coach",
        "version": "2.0.0",
        "nlp_engine": nlp_engine_status,
        "job_matcher": job_matcher_status,
        "career_advisor": career_advisor_status
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )