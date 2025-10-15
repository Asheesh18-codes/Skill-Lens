"""
SkillLens NLP Engine
Advanced skill extraction using spaCy, HuggingFace, and OpenAI
"""

import spacy
import re
import logging
import os
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict, Counter
import json
from dotenv import load_dotenv  # This line is retained for loading environment variables

# Load environment variables
load_dotenv()

# Optional imports - will gracefully handle if not available
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except (ImportError, Exception) as e:
    TRANSFORMERS_AVAILABLE = False
    logging.warning(f"Transformers not available: {e}")

try:
    try:
        import openai
        OPENAI_AVAILABLE = True
    except ImportError:
        openai = None
        OPENAI_AVAILABLE = False
        logging.warning("OpenAI package not installed. Install with: pip install openai")
    OPENAI_AVAILABLE = True
except (ImportError, Exception) as e:
    OPENAI_AVAILABLE = False
    logging.warning(f"OpenAI not available: {e}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SkillExtractor:
    """
    Advanced skill extraction engine using multiple NLP approaches
    """
    
    def __init__(self, spacy_model: str = "en_core_web_sm"):
        """Initialize the skill extractor with spaCy model"""
        try:
            self.nlp = spacy.load(spacy_model)
            logger.info(f"Loaded spaCy model: {spacy_model}")
        except OSError:
            logger.error(f"spaCy model '{spacy_model}' not found. Install with: python -m spacy download {spacy_model}")
            raise
        
        # Initialize skill patterns and categories
        self.skill_patterns = self._load_skill_patterns()
        self.skill_categories = self._load_skill_categories()
        
        # Initialize advanced ML models
        self.hf_classifier = None
        self.openai_client = None
        
        # Enable advanced features
        if TRANSFORMERS_AVAILABLE:
            self._initialize_huggingface()
        
        if OPENAI_AVAILABLE:
            self._initialize_openai()
        
        logger.info("NLP engine initialized with advanced features enabled")
    
    def _load_skill_patterns(self) -> Dict[str, List[str]]:
        """Load predefined skill patterns for better recognition"""
        return {
            "programming_languages": [
                r"\bpython\b", r"\bjava\b", r"\bjavascript\b", r"\bjs\b", r"\btypescript\b", r"\bts\b",
                r"\bc\+\+\b", r"\bc#\b", r"\bruby\b", r"\bphp\b", r"\bgo\b", r"\brust\b", r"\bswift\b",
                r"\bkotlin\b", r"\bscala\b", r"\br\b", r"\bmatlab\b", r"\bsql\b", r"\bhtml\b", r"\bcss\b"
            ],
            "frameworks": [
                r"\breact\b", r"\bangular\b", r"\bvue\b", r"\bnode\.?js\b", r"\bexpress\b", r"\bdjango\b",
                r"\bflask\b", r"\bspring\b", r"\blaravel\b", r"\bruby on rails\b", r"\b\.net\b",
                r"\bbootstrap\b", r"\btailwind\b", r"\bjquery\b", r"\bfastapi\b"
            ],
            "databases": [
                r"\bmysql\b", r"\bpostgresql\b", r"\bmongodb\b", r"\bredis\b", r"\boracle\b",
                r"\bsqlite\b", r"\belasticsearch\b", r"\bcassandra\b", r"\bdynamodb\b"
            ],
            "cloud_platforms": [
                r"\baws\b", r"\bamazon web services\b", r"\bgcp\b", r"\bgoogle cloud\b", r"\bazure\b",
                r"\bdigitalocean\b", r"\bheroku\b", r"\bvercel\b", r"\bnetlify\b"
            ],
            "tools": [
                r"\bgit\b", r"\bdocker\b", r"\bkubernetes\b", r"\bjenkins\b", r"\bansible\b",
                r"\bterraform\b", r"\bwebpack\b", r"\bbabel\b", r"\bnpm\b", r"\byarn\b", r"\bvscode\b"
            ],
            "data_science": [
                r"\bmachine learning\b", r"\bml\b", r"\bdeep learning\b", r"\bai\b", r"\bartificial intelligence\b",
                r"\bnlp\b", r"\bnatural language processing\b", r"\bpandas\b", r"\bnumpy\b", r"\bscikit-learn\b",
                r"\btensorflow\b", r"\bpytorch\b", r"\bkeras\b", r"\bdata analysis\b", r"\bdata visualization\b"
            ]
        }
    
    def _load_skill_categories(self) -> Dict[str, str]:
        """Map skills to their categories"""
        categories = {}
        
        # Programming Languages
        prog_langs = ["python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", 
                     "go", "rust", "swift", "kotlin", "scala", "r", "matlab", "sql", "html", "css"]
        for lang in prog_langs:
            categories[lang] = "Programming Languages"
        
        # Web Technologies
        web_techs = ["react", "angular", "vue", "node.js", "express", "bootstrap", "tailwind", 
                    "jquery", "webpack", "babel"]
        for tech in web_techs:
            categories[tech] = "Web Technologies"
        
        # Databases
        databases = ["mysql", "postgresql", "mongodb", "redis", "oracle", "sqlite", 
                    "elasticsearch", "cassandra", "dynamodb"]
        for db in databases:
            categories[db] = "Databases"
        
        # Cloud & DevOps
        cloud_devops = ["aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "ansible", 
                       "terraform", "git", "ci/cd"]
        for tech in cloud_devops:
            categories[tech] = "Cloud & DevOps"
        
        # Data Science & ML
        data_ml = ["machine learning", "deep learning", "ai", "nlp", "pandas", "numpy", 
                  "scikit-learn", "tensorflow", "pytorch", "keras", "data analysis"]
        for skill in data_ml:
            categories[skill] = "Data Science & ML"
        
        return categories
    
    def _initialize_huggingface(self):
        """Initialize HuggingFace model for advanced classification"""
        try:
            if TRANSFORMERS_AVAILABLE and os.getenv("USE_HUGGINGFACE", "true").lower() == "true":
                model_name = os.getenv("HUGGINGFACE_MODEL", "facebook/bart-large-mnli")
                logger.info(f"Loading HuggingFace model: {model_name}")
                
                self.hf_classifier = pipeline(
                    "zero-shot-classification",
                    model=model_name
                )
                logger.info("HuggingFace classifier initialized successfully")
            else:
                self.hf_classifier = None
                logger.info("HuggingFace disabled or not available")
        except Exception as e:
            logger.warning(f"Failed to initialize HuggingFace model: {e}")
            self.hf_classifier = None
    
    def _initialize_openai(self):
        """
        Initialize OpenAI client with API key and configuration.
        Ensures valid environment setup and prevents missing authentication errors.
        """
        try:
            if OPENAI_AVAILABLE and os.getenv("USE_OPENAI", "false").lower() == "true":
                api_key = os.getenv("OPENAI_API_KEY")
                
                if not api_key or api_key == "your_openai_api_key_here":
                    self.openai_client = None
                    logger.warning("OpenAI API key not configured. Set OPENAI_API_KEY in .env file")
                    return
                
                # Initialize using the new SDK client with explicit API key
                self.openai_client = openai.OpenAI(api_key=api_key)
                logger.info("✅ OpenAI client initialized successfully")
            else:
                self.openai_client = None
                logger.info("OpenAI disabled in configuration")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI client: {e}")
            self.openai_client = None
    
    def extract_skills_spacy(self, text: str) -> Tuple[List[str], Dict[str, float]]:
        """Extract skills using spaCy NER and pattern matching"""
        doc = self.nlp(text.lower())
        detected_skills = set()
        confidence_scores = {}
        
        # Pattern-based extraction
        for category, patterns in self.skill_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text.lower(), re.IGNORECASE)
                for match in matches:
                    skill = match.group().strip()
                    detected_skills.add(skill)
                    # Higher confidence for exact pattern matches
                    confidence_scores[skill] = 0.8
        
        # NER-based extraction for technical terms
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT", "LANGUAGE"]:
                skill_candidate = ent.text.lower().strip()
                if len(skill_candidate) > 2 and skill_candidate not in ["the", "and", "for"]:
                    detected_skills.add(skill_candidate)
                    confidence_scores[skill_candidate] = 0.6
        
        # Noun phrase extraction for potential skills
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            if len(chunk_text.split()) <= 3 and len(chunk_text) > 2:
                # Check if it contains technical keywords
                if any(keyword in chunk_text for keyword in ["development", "programming", "analysis", "design"]):
                    detected_skills.add(chunk_text)
                    confidence_scores[chunk_text] = 0.4
        
        return list(detected_skills), confidence_scores
    
    def extract_skills_huggingface(self, text: str) -> Tuple[List[str], Dict[str, float]]:
        """Extract skills using HuggingFace zero-shot classification (optimized for speed)"""
        if not self.hf_classifier:
            return [], {}
        
        try:
            # Get configuration from environment
            confidence_threshold = float(os.getenv("HF_CONFIDENCE_THRESHOLD", "0.3"))
            
            # OPTIMIZED: Reduced candidate list for faster inference on CPU
            # Focus on high-level categories and ambiguous terms
            candidate_skills = [
                "web development", "frontend development", "backend development", "full stack development",
                "machine learning", "data science", "data analysis",
                "cloud computing", "devops practices", "software engineering",
                "mobile development", "database management", "api development",
                "agile methodology", "project management", "leadership skills"
            ]
            
            # Classify text against candidate skills
            result = self.hf_classifier(text[:800], candidate_skills)  # Limit text length
            
            skills = []
            confidence_scores = {}
            
            # Filter skills with high confidence
            for label, score in zip(result['labels'], result['scores']):
                if score > confidence_threshold:
                    skills.append(label)
                    confidence_scores[label] = float(score)
            
            # Sort by confidence score (descending)
            skills = sorted(skills, key=lambda x: confidence_scores[x], reverse=True)
            
            return skills[:10], confidence_scores  # Limit to top 10 for speed
            
        except Exception as e:
            logger.error(f"HuggingFace extraction failed: {e}")
            return [], {}
    
    def extract_skills_openai(self, text: str) -> Tuple[List[str], Dict[str, float]]:
        """
        Use OpenAI GPT model to extract skills from input text.
        Includes rate-limit handling with exponential backoff and structured parsing.
        """
        if not self.openai_client:
            return [], {}
        
        max_tokens = int(os.getenv("MAX_TOKENS_OPENAI", "500"))
        retries = 3
        
        prompt = f"""You are an expert HR analyst specializing in technical skill extraction from resumes and profiles.
Analyze the following text and extract ALL technical skills, programming languages, frameworks, 
tools, databases, cloud platforms, and relevant professional skills.

For each skill, assign a confidence score from 0.1 to 1.0 based on:
- How explicitly mentioned it is
- Context and depth of experience indicated
- Number of occurrences and variations

Text to analyze:
{text[:1500]}

Return ONLY valid JSON in this exact format:
{{
    "skills": ["skill1", "skill2", "skill3"],
    "confidence_scores": {{"skill1": 0.9, "skill2": 0.7, "skill3": 0.8}}
}}

Include skills from these categories:
- Programming languages (Python, Java, JavaScript, etc.)
- Web frameworks (React, Django, Express, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, etc.)
- Cloud platforms (AWS, Azure, GCP, etc.)
- DevOps tools (Docker, Kubernetes, Jenkins, etc.)
- Data science tools (pandas, numpy, TensorFlow, etc.)
- Soft skills (leadership, communication, etc.)"""
        
        # Retry loop for rate-limit handling with exponential backoff
        for attempt in range(retries):
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a technical skill extraction expert. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=0.2
                )
                
                # Parse response safely
                result_text = response.choices[0].message.content.strip()
                
                # Remove markdown code blocks if present
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                elif result_text.startswith("```"):
                    result_text = result_text.replace("```", "").strip()
                
                result_json = json.loads(result_text)
                skills = result_json.get("skills", [])
                confidence_scores = result_json.get("confidence_scores", {})
                
                logger.info(f"✅ OpenAI extracted {len(skills)} skills successfully")
                return skills, confidence_scores
                
            except json.JSONDecodeError as e:
                logger.error(f"❌ OpenAI returned invalid JSON: {e}")
                logger.error(f"Response text: {result_text[:200]}")
                return [], {}
                
            except Exception as e:
                import time
                error_msg = str(e).lower()
                
                # Handle specific OpenAI errors
                if isinstance(e, openai.AuthenticationError):
                    logger.error(f"❌ OpenAI authentication error: {e}")
                    return [], {}
                    
                elif isinstance(e, openai.RateLimitError) or "rate limit" in error_msg or "429" in error_msg:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    logger.warning(f"⚠️ OpenAI rate limit reached. Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{retries})")
                    time.sleep(wait_time)
                    continue
                    
                elif isinstance(e, openai.APIConnectionError):
                    logger.error(f"❌ OpenAI connection error: {e}")
                    return [], {}
                    
                elif isinstance(e, openai.APITimeoutError):
                    logger.error(f"❌ OpenAI timeout error: {e}")
                    return [], {}
                    
                else:
                    logger.error(f"❌ OpenAI extraction failed: {e}")
                    return [], {}
        
        logger.error("❌ Max retries exceeded while calling OpenAI API")
        return [], {}
    
    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize extracted skills into predefined categories"""
        categorized = defaultdict(list)
        
        for skill in skills:
            skill_lower = skill.lower().strip()
            category = self.skill_categories.get(skill_lower, "Other")
            
            # Try partial matching for compound skills
            if category == "Other":
                for known_skill, cat in self.skill_categories.items():
                    if known_skill in skill_lower or skill_lower in known_skill:
                        category = cat
                        break
            
            categorized[category].append(skill)
        
        return dict(categorized)
    
    def extract_skills(self, text: str, use_all_methods: bool = True) -> Dict:
        """
        Main method to extract skills using optimized hybrid approach
        
        Args:
            text: Resume or profile text
            use_all_methods: Whether to use all available NLP methods
            
        Returns:
            Dict with skills, categories, and confidence scores
        """
        all_skills = set()
        all_confidence_scores = {}
        
        # Method 1: spaCy + regex (always available, fast, accurate for known skills)
        spacy_skills, spacy_confidence = self.extract_skills_spacy(text)
        all_skills.update(spacy_skills)
        all_confidence_scores.update(spacy_confidence)
        
        if use_all_methods:
            # Method 2: HuggingFace (optimized - only for high-level categories)
            # This complements spaCy by identifying broader skill categories
            if self.hf_classifier:
                hf_skills, hf_confidence = self.extract_skills_huggingface(text)
                all_skills.update(hf_skills)
                # Merge confidence scores (take higher value)
                for skill, conf in hf_confidence.items():
                    all_confidence_scores[skill] = max(
                        all_confidence_scores.get(skill, 0), conf
                    )
            
            # Method 3: OpenAI (if available and API key set) - disabled by default for speed
            # Only enable if USE_OPENAI=true and you need GPT-level understanding
            if self.openai_client and os.getenv("USE_OPENAI", "false").lower() == "true":
                openai_skills, openai_confidence = self.extract_skills_openai(text)
                all_skills.update(openai_skills)
                # Merge confidence scores (take higher value)
                for skill, conf in openai_confidence.items():
                    all_confidence_scores[skill] = max(
                        all_confidence_scores.get(skill, 0), conf
                    )
        
        # Convert to list and categorize
        final_skills = list(all_skills)
        categorized_skills = self.categorize_skills(final_skills)
        
        # Clean up confidence scores to only include final skills
        final_confidence_scores = {
            skill: all_confidence_scores.get(skill, 0.5)
            for skill in final_skills
        }
        
        return {
            "skills": final_skills,
            "categories": categorized_skills,
            "confidence_scores": final_confidence_scores,
            "total_skills": len(final_skills),
            "categories_count": len(categorized_skills)
        }

class JobRoleMatcher:
    """
    Match extracted skills to job roles using ML classification
    """
    
    def __init__(self):
        self.job_skill_mapping = self._load_job_skill_mapping()
        
        # Enable advanced job role classification (respect USE_HUGGINGFACE flag)
        self.role_classifier = None

        if TRANSFORMERS_AVAILABLE and os.getenv("USE_HUGGINGFACE", "false").lower() == "true":
            try:
                self.role_classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli"
                )
                logger.info("Advanced role classifier initialized")
            except Exception as e:
                logger.warning(f"Failed to load role classifier: {e}")
                self.role_classifier = None
        else:
            self.role_classifier = None
            logger.info("Role classifier disabled or transformers unavailable")
        
        logger.info("Job role matcher initialized with advanced ML features")
    
    def _load_job_skill_mapping(self) -> Dict[str, List[str]]:
        """Define mapping between job roles and required skills"""
        return {
            "Software Engineer": [
                "python", "java", "javascript", "git", "sql", "algorithms", "data structures"
            ],
            "Frontend Developer": [
                "javascript", "react", "html", "css", "typescript", "vue", "angular"
            ],
            "Backend Developer": [
                "python", "java", "node.js", "sql", "api development", "microservices"
            ],
            "Full Stack Developer": [
                "javascript", "python", "react", "node.js", "sql", "git", "html", "css"
            ],
            "Data Scientist": [
                "python", "machine learning", "pandas", "numpy", "sql", "statistics", "r"
            ],
            "DevOps Engineer": [
                "docker", "kubernetes", "aws", "jenkins", "ansible", "terraform", "linux"
            ],
            "Product Manager": [
                "project management", "agile", "analytics", "communication", "leadership"
            ],
            "UI/UX Designer": [
                "figma", "sketch", "adobe", "prototyping", "user research", "wireframing"
            ]
        }
    
    def calculate_role_fit(self, user_skills: List[str], target_role: str) -> Dict:
        """Calculate how well user skills match a target role"""
        required_skills = self.job_skill_mapping.get(target_role, [])
        
        if not required_skills:
            return {"fit_percentage": 0, "missing_skills": [], "matching_skills": []}
        
        user_skills_lower = [skill.lower() for skill in user_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matching_skills = []
        for req_skill in required_skills_lower:
            for user_skill in user_skills_lower:
                if req_skill in user_skill or user_skill in req_skill:
                    matching_skills.append(req_skill)
                    break
        
        missing_skills = [skill for skill in required_skills_lower if skill not in matching_skills]
        fit_percentage = (len(matching_skills) / len(required_skills)) * 100
        
        return {
            "fit_percentage": round(fit_percentage, 2),
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "total_required": len(required_skills),
            "total_matching": len(matching_skills)
        }
    
    def suggest_best_roles(self, user_skills: List[str], top_n: int = 5) -> List[Dict]:
        """Suggest best matching job roles for user skills"""
        role_fits = []
        
        for role in self.job_skill_mapping.keys():
            fit_data = self.calculate_role_fit(user_skills, role)
            role_fits.append({
                "role": role,
                **fit_data
            })
        
        # Sort by fit percentage
        role_fits.sort(key=lambda x: x["fit_percentage"], reverse=True)
        
        return role_fits[:top_n]

# Factory function to create skill extractor
def create_skill_extractor(spacy_model: str = "en_core_web_sm") -> SkillExtractor:
    """Factory function to create and configure skill extractor"""
    return SkillExtractor(spacy_model)

# Factory function to create job role matcher
def create_job_role_matcher() -> JobRoleMatcher:
    """Factory function to create job role matcher"""
    return JobRoleMatcher()