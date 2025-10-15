"""
Career Advisor AI Module
Generates personalized career roadmaps, learning paths, and advice
"""

import logging
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Import OpenAI
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI not available for career advisor")

logger = logging.getLogger(__name__)

class CareerAdvisor:
    """AI-powered career guidance and roadmap generation"""
    
    def __init__(self):
        """Initialize the career advisor"""
        self.openai_client = None
        self.use_openai = os.getenv("USE_OPENAI", "false").lower() == "true"
        
        if self.use_openai and OPENAI_AVAILABLE:
            self._initialize_openai()
        else:
            logger.info("Career advisor running in template mode (OpenAI disabled)")
    
    def _initialize_openai(self):
        """Initialize OpenAI client"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.error("OPENAI_API_KEY not found in environment")
                return
            
            # Initialize OpenAI client (compatible with openai>=1.0.0)
            self.openai_client = openai.OpenAI(api_key=api_key)
            logger.info("✅ Career Advisor: OpenAI client initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI for career advisor: {e}")
            self.openai_client = None
    
    async def generate_chat_response(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a conversational response to user's message
        
        Args:
            message: User's message
            history: Conversation history
            user_profile: User's profile including skills, goals, etc.
        
        Returns:
            Response with message, data, and suggestions
        """
        if self.openai_client:
            return await self._generate_ai_chat_response(message, history, user_profile)
        else:
            return self._generate_template_chat_response(message, user_profile)
    
    async def _generate_ai_chat_response(
        self,
        message: str,
        history: List[Dict[str, str]],
        user_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate AI-powered chat response using OpenAI"""
        try:
            # Build context
            context = self._build_chat_context(user_profile)
            
            # Build conversation messages
            messages = [
                {
                    "role": "system",
                    "content": f"""You are an expert AI Career Coach and Mentor. Your role is to:
1. Analyze users' current skills and career goals
2. Provide personalized career advice and roadmaps
3. Suggest learning resources, certifications, and projects
4. Help users understand skill gaps and how to bridge them
5. Be encouraging, specific, and actionable

{context}

Always provide:
- Clear, actionable advice
- Specific learning resources (courses, books, tutorials)
- Project ideas to build skills
- Timeline estimates for skill development
- Industry insights and trends

Be conversational, empathetic, and motivating."""
                }
            ]
            
            # Add conversation history (last 10 messages for context)
            for msg in history[-10:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Call OpenAI API with retry logic
            response = await self._call_openai_with_retry(messages)
            
            # Parse response
            ai_message = response.choices[0].message.content
            
            # Extract structured data if present
            structured_data = self._extract_structured_data(ai_message)
            
            # Generate suggestions
            suggestions = self._generate_suggestions(message, user_profile)
            
            return {
                "message": ai_message,
                "data": structured_data,
                "suggestions": suggestions
            }
        
        except Exception as e:
            logger.error(f"❌ Error generating AI chat response: {e}")
            return self._generate_template_chat_response(message, user_profile)
    
    async def _call_openai_with_retry(
        self,
        messages: List[Dict[str, str]],
        max_retries: int = 3
    ) -> Any:
        """Call OpenAI API with exponential backoff retry"""
        import time
        
        for attempt in range(max_retries):
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1500
                )
                return response
            except Exception as e:
                if "rate_limit" in str(e).lower() and attempt < max_retries - 1:
                    wait_time = (2 ** attempt)  # 1s, 2s, 4s
                    logger.warning(f"⏳ Rate limit hit, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    raise
    
    def _build_chat_context(self, user_profile: Optional[Dict[str, Any]]) -> str:
        """Build context string from user profile"""
        if not user_profile:
            return "No user profile available yet."
        
        context_parts = []
        
        if user_profile.get("skills"):
            skills_str = ", ".join(user_profile["skills"][:15])
            context_parts.append(f"User's current skills: {skills_str}")
        
        if user_profile.get("targetRole"):
            context_parts.append(f"Target role: {user_profile['targetRole']}")
        
        if user_profile.get("experience"):
            context_parts.append(f"Experience level: {user_profile['experience']}")
        
        return "\\n".join(context_parts) if context_parts else "No profile information available."
    
    def _extract_structured_data(self, message: str) -> Optional[Dict[str, Any]]:
        """Extract structured data from AI response (e.g., resources, timeline)"""
        # Simple extraction - can be enhanced with regex or prompt engineering
        data = {}
        
        # Look for common patterns
        if "roadmap" in message.lower():
            data["type"] = "roadmap"
        elif "resource" in message.lower() or "course" in message.lower():
            data["type"] = "resources"
        elif "project" in message.lower():
            data["type"] = "project_idea"
        
        return data if data else None
    
    def _generate_suggestions(
        self,
        message: str,
        user_profile: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Generate quick action suggestions"""
        suggestions = []
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["roadmap", "path", "plan"]):
            suggestions.append("Generate detailed roadmap")
        
        if any(word in message_lower for word in ["learn", "study", "course"]):
            suggestions.append("Find learning resources")
        
        if any(word in message_lower for word in ["project", "build", "practice"]):
            suggestions.append("Get project ideas")
        
        if any(word in message_lower for word in ["skill", "gap", "improve"]):
            suggestions.append("Analyze skill gaps")
        
        return suggestions[:3]  # Limit to 3 suggestions
    
    def _generate_template_chat_response(
        self,
        message: str,
        user_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate template-based response when OpenAI is unavailable"""
        message_lower = message.lower()
        
        # Simple keyword-based responses
        if any(word in message_lower for word in ["hello", "hi", "hey"]):
            response = "Hello! I'm your AI Career Coach. I can help you with career guidance, learning roadmaps, and skill development. How can I assist you today?"
        
        elif any(word in message_lower for word in ["roadmap", "path", "plan"]):
            response = "I can help you create a personalized learning roadmap! Please tell me:\n1. What role are you targeting?\n2. What skills do you currently have?\n3. What's your timeline?"
        
        elif any(word in message_lower for word in ["frontend", "react", "web developer"]):
            response = "Great! Frontend development is an exciting field. A typical path includes:\n\n1. **Foundations** (2-3 months):\n   - HTML, CSS, JavaScript\n   - Git & GitHub\n\n2. **Framework** (2-3 months):\n   - React or Vue.js\n   - State management\n   - API integration\n\n3. **Advanced** (2-3 months):\n   - TypeScript\n   - Testing (Jest, React Testing Library)\n   - Performance optimization\n\nWould you like specific resources for any of these areas?"
        
        elif any(word in message_lower for word in ["backend", "api", "server"]):
            response = "Backend development roadmap:\n\n1. **Core Skills**:\n   - Programming language (Python, Node.js, Java)\n   - Databases (SQL + NoSQL)\n   - REST APIs\n\n2. **Advanced**:\n   - Authentication & Authorization\n   - Caching strategies\n   - Microservices\n\n3. **DevOps**:\n   - Docker\n   - CI/CD\n   - Cloud platforms (AWS/Azure)\n\nWhat's your preferred programming language?"
        
        else:
            response = f"I understand you're interested in: '{message}'. I can help with:\n\n• Creating personalized learning roadmaps\n• Identifying skill gaps\n• Recommending courses and resources\n• Suggesting hands-on projects\n\nWhat would you like to explore first?"
        
        return {
            "message": response,
            "data": None,
            "suggestions": ["Generate roadmap", "Find resources", "Analyze skills"]
        }
    
    async def generate_career_roadmap(
        self,
        target_role: str,
        current_skills: List[str],
        timeline: str = "6 months"
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive career roadmap
        
        Args:
            target_role: Target job role
            current_skills: List of current skills
            timeline: Desired timeline (e.g., "6 months", "1 year")
        
        Returns:
            Structured roadmap with phases, resources, and milestones
        """
        if self.openai_client:
            return await self._generate_ai_roadmap(target_role, current_skills, timeline)
        else:
            return self._generate_template_roadmap(target_role, current_skills, timeline)
    
    async def _generate_ai_roadmap(
        self,
        target_role: str,
        current_skills: List[str],
        timeline: str
    ) -> Dict[str, Any]:
        """Generate AI-powered career roadmap"""
        try:
            skills_str = ", ".join(current_skills) if current_skills else "beginner level"
            
            prompt = f"""Create a detailed, actionable career roadmap for someone who wants to become a {target_role}.

Current skills: {skills_str}
Timeline: {timeline}

Provide a comprehensive roadmap in the following JSON format:

{{
  "role": "{target_role}",
  "timeline": "{timeline}",
  "overview": "Brief overview of the role and career path",
  "skill_gaps": ["list", "of", "skills", "to", "learn"],
  "phases": [
    {{
      "phase": "Phase 1: Foundations",
      "duration": "2 months",
      "skills": ["skill1", "skill2"],
      "resources": [
        {{"title": "Resource name", "type": "course/book/tutorial", "url": "link", "duration": "time"}},
      ],
      "projects": ["project idea 1", "project idea 2"],
      "milestones": ["milestone 1", "milestone 2"]
    }}
  ],
  "certifications": ["certification 1", "certification 2"],
  "job_search_tips": ["tip 1", "tip 2"],
  "salary_range": "Expected salary range",
  "industry_trends": ["trend 1", "trend 2"]
}}

Be specific, actionable, and realistic. Include actual course names, book titles, and project ideas."""

            response = await self._call_openai_with_retry([
                {
                    "role": "system",
                    "content": "You are an expert career advisor. Generate detailed, structured career roadmaps in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ])
            
            # Parse JSON response
            content = response.choices[0].message.content
            
            # Extract JSON from markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            roadmap = json.loads(content)
            
            logger.info(f"✅ Generated AI roadmap for {target_role}")
            return roadmap
        
        except Exception as e:
            logger.error(f"❌ Error generating AI roadmap: {e}")
            return self._generate_template_roadmap(target_role, current_skills, timeline)
    
    def _generate_template_roadmap(
        self,
        target_role: str,
        current_skills: List[str],
        timeline: str
    ) -> Dict[str, Any]:
        """Generate template-based roadmap"""
        # Load role-specific templates
        templates = self._load_roadmap_templates()
        
        role_lower = target_role.lower()
        template_key = None
        
        # Match role to template
        for key in templates.keys():
            if key in role_lower or role_lower in key:
                template_key = key
                break
        
        if template_key:
            return templates[template_key]
        
        # Default generic roadmap
        return {
            "role": target_role,
            "timeline": timeline,
            "overview": f"Career path for {target_role}",
            "skill_gaps": ["Identify specific skills needed", "Check job postings"],
            "phases": [
                {
                    "phase": "Phase 1: Research & Foundation",
                    "duration": "1-2 months",
                    "skills": ["Core concepts", "Fundamental tools"],
                    "resources": [
                        {
                            "title": "Online courses on Coursera/Udemy",
                            "type": "course",
                            "url": "https://www.coursera.org",
                            "duration": "varies"
                        }
                    ],
                    "projects": ["Build a simple project to apply basics"],
                    "milestones": ["Complete foundation courses", "Build first project"]
                }
            ],
            "certifications": ["Research relevant certifications for your role"],
            "job_search_tips": [
                "Build a strong portfolio",
                "Network on LinkedIn",
                "Contribute to open source"
            ],
            "salary_range": "Research on Glassdoor/Levels.fyi",
            "industry_trends": ["Stay updated with industry blogs", "Follow thought leaders"]
        }
    
    def _load_roadmap_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load predefined roadmap templates for common roles"""
        return {
            "frontend": {
                "role": "Frontend Developer",
                "timeline": "6 months",
                "overview": "Frontend developers build user interfaces and client-side applications using HTML, CSS, JavaScript, and modern frameworks.",
                "skill_gaps": ["React/Vue", "TypeScript", "State Management", "Testing", "Performance Optimization"],
                "phases": [
                    {
                        "phase": "Phase 1: Foundations",
                        "duration": "2 months",
                        "skills": ["HTML5", "CSS3", "JavaScript ES6+", "Git"],
                        "resources": [
                            {"title": "freeCodeCamp Responsive Web Design", "type": "course", "url": "https://www.freecodecamp.org", "duration": "300 hours"},
                            {"title": "JavaScript.info", "type": "tutorial", "url": "https://javascript.info", "duration": "self-paced"},
                            {"title": "Eloquent JavaScript", "type": "book", "url": "https://eloquentjavascript.net", "duration": "4 weeks"}
                        ],
                        "projects": ["Personal portfolio website", "To-do list app", "Calculator"],
                        "milestones": ["Master DOM manipulation", "Build 3 vanilla JS projects", "Learn Git workflow"]
                    },
                    {
                        "phase": "Phase 2: Modern Framework",
                        "duration": "2 months",
                        "skills": ["React", "Component architecture", "Hooks", "API integration"],
                        "resources": [
                            {"title": "React Official Tutorial", "type": "tutorial", "url": "https://react.dev", "duration": "2 weeks"},
                            {"title": "The Complete React Developer Course", "type": "course", "url": "https://www.udemy.com", "duration": "40 hours"},
                            {"title": "Kent C. Dodds Epic React", "type": "course", "url": "https://epicreact.dev", "duration": "8 weeks"}
                        ],
                        "projects": ["Weather app with API", "E-commerce product page", "Blog with routing"],
                        "milestones": ["Build 3 React apps", "Integrate REST APIs", "Deploy to Vercel"]
                    },
                    {
                        "phase": "Phase 3: Advanced & Professional",
                        "duration": "2 months",
                        "skills": ["TypeScript", "State management (Redux/Zustand)", "Testing", "Performance"],
                        "resources": [
                            {"title": "TypeScript Handbook", "type": "docs", "url": "https://www.typescriptlang.org", "duration": "2 weeks"},
                            {"title": "Testing JavaScript", "type": "course", "url": "https://testingjavascript.com", "duration": "4 weeks"},
                            {"title": "Web Performance Fundamentals", "type": "course", "url": "https://frontendmasters.com", "duration": "3 hours"}
                        ],
                        "projects": ["Full-stack CRUD app", "Real-time chat app", "Portfolio with CMS"],
                        "milestones": ["Convert project to TypeScript", "Achieve 90+ Lighthouse score", "Write unit tests"]
                    }
                ],
                "certifications": [
                    "Meta Front-End Developer Professional Certificate",
                    "Microsoft Certified: Azure Developer Associate (optional)"
                ],
                "job_search_tips": [
                    "Build 5+ projects showcasing different skills",
                    "Contribute to open source React projects",
                    "Write technical blog posts",
                    "Network on Twitter and LinkedIn",
                    "Practice LeetCode easy/medium problems"
                ],
                "salary_range": "$60k-$120k (varies by location and experience)",
                "industry_trends": [
                    "Server components and Next.js 14+",
                    "AI-assisted development",
                    "Web3 and blockchain frontends",
                    "Micro-frontends architecture"
                ]
            },
            "backend": {
                "role": "Backend Developer",
                "timeline": "6 months",
                "overview": "Backend developers build server-side logic, APIs, and database systems that power applications.",
                "skill_gaps": ["API design", "Database optimization", "Authentication", "Caching", "DevOps basics"],
                "phases": [
                    {
                        "phase": "Phase 1: Programming & Databases",
                        "duration": "2 months",
                        "skills": ["Python/Node.js", "SQL", "REST APIs", "Git"],
                        "resources": [
                            {"title": "Python for Everybody", "type": "course", "url": "https://www.py4e.com", "duration": "8 weeks"},
                            {"title": "SQL Tutorial - W3Schools", "type": "tutorial", "url": "https://www.w3schools.com/sql", "duration": "2 weeks"},
                            {"title": "FastAPI/Django/Express Tutorial", "type": "tutorial", "url": "official docs", "duration": "4 weeks"}
                        ],
                        "projects": ["Simple CRUD API", "Blog API", "User authentication system"],
                        "milestones": ["Build 3 REST APIs", "Master SQL queries", "Deploy to Heroku/Render"]
                    },
                    {
                        "phase": "Phase 2: Advanced Backend",
                        "duration": "2 months",
                        "skills": ["Database design", "Caching (Redis)", "Message queues", "Security"],
                        "resources": [
                            {"title": "System Design Primer", "type": "github", "url": "https://github.com/donnemartin/system-design-primer", "duration": "ongoing"},
                            {"title": "Designing Data-Intensive Applications", "type": "book", "url": "amazon", "duration": "8 weeks"}
                        ],
                        "projects": ["E-commerce backend", "Real-time notification service", "File upload system"],
                        "milestones": ["Implement caching", "Add JWT auth", "Handle 1000+ requests/sec"]
                    },
                    {
                        "phase": "Phase 3: DevOps & Scale",
                        "duration": "2 months",
                        "skills": ["Docker", "CI/CD", "AWS/Azure", "Monitoring"],
                        "resources": [
                            {"title": "Docker Mastery", "type": "course", "url": "udemy", "duration": "20 hours"},
                            {"title": "AWS Certified Developer", "type": "certification", "url": "aws.amazon.com", "duration": "6 weeks"}
                        ],
                        "projects": ["Dockerize apps", "Set up CI/CD pipeline", "Deploy to AWS"],
                        "milestones": ["Containerize all projects", "Automate deployments", "Monitor with logs"]
                    }
                ],
                "certifications": [
                    "AWS Certified Developer Associate",
                    "Microsoft Certified: Azure Developer Associate"
                ],
                "job_search_tips": [
                    "Build scalable systems",
                    "Master system design interviews",
                    "Contribute to backend frameworks",
                    "Learn microservices patterns"
                ],
                "salary_range": "$70k-$140k",
                "industry_trends": [
                    "Serverless architecture",
                    "GraphQL over REST",
                    "Event-driven systems",
                    "Edge computing"
                ]
            }
        }

# Create global instance
career_advisor = CareerAdvisor()
