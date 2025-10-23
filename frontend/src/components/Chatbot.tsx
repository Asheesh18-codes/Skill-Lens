import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
}

interface ChatbotProps {
  userSkills?: string[];
  onRoadmapGenerated?: (roadmap: any) => void;
  fullScreen?: boolean; // when true, fill available height (App provides a full-height container)
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Chatbot: React.FC<ChatbotProps> = ({ userSkills = [], onRoadmapGenerated, fullScreen = false }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ skills: string[] }>({ skills: userSkills });
  const [prevAtsScore, setPrevAtsScore] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, messagesEndRef]);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat/session`, {
        userProfile: {},
        skills: userSkills
      });
      
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        
        setMessages([{
          role: 'assistant',
          content: "👋 Hi! I'm your AI Career Coach. I can help you:\n\n• Create personalized learning roadmaps\n• Identify skill gaps for your target role\n• Recommend courses and resources\n• Suggest hands-on projects\n• Provide career guidance\n\nYou can start by telling me about your career goals, or upload your resume to analyze your current skills!",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageText = content || inputMessage;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat/message`, {
        sessionId,
        message: messageText,
        userProfile: {
          skills: userProfile.skills
        }
      });

      if (response.data.success) {
        const aiMessage: Message = {
          role: 'assistant',
          content: response.data.data.message,
          timestamp: new Date().toISOString(),
          data: response.data.data.data
        };

        setMessages(prev => [...prev, aiMessage]);
        setSuggestions(response.data.data.suggestions || []);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.response?.data?.message || error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      // Attach sessionId so backend can link resume to this chat session
      const url = `${API_BASE_URL}/api/v1/resume/upload?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        // Merge skills from response's session profile if present
        const mergedSkills = res.data.data?.session?.userProfile?.skills || userProfile.skills;
        setUserProfile({ skills: mergedSkills });

        const ats = res.data.data?.ats;
        const analysis = res.data.data?.analysis;
        const summary = res.data.data?.summary;
        const previous = prevAtsScore;
        if (typeof ats?.score === 'number') {
          setPrevAtsScore(ats.score);
        }
        const scoreLine = ats?.score != null ? ` ATS score: ${ats.score}/100.` : '';
        const topSuggestion = ats?.suggestions?.[0] ? ` Suggestion: ${ats.suggestions[0]}` : '';

        // Notify the chat that resume has been linked and include ATS score summary
        const infoMessage: Message = {
          role: 'assistant',
          content: `✅ I've analyzed your resume and updated your profile with detected skills.${scoreLine}${topSuggestion}\n\nYou can now ask targeted questions like "What roles fit my skills?" or "Create a 3-month roadmap for ${mergedSkills[0] || 'my target role'}".`,
          timestamp: new Date().toISOString(),
          data: { ats, summary, analysis, prevAtsScore: previous }
        };
        setMessages(prev => [...prev, infoMessage]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      const infoMessage: Message = {
        role: 'assistant',
        content: `❌ Resume upload error: ${errorMsg}. Please ensure it's a valid PDF under 5MB.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, infoMessage]);
    } finally {
      setUploading(false);
    }
  };

  const generateSummaryVariants = (analysis: any, ats: any): string[] => {
    const skills: string[] = Array.isArray(analysis?.skills) ? analysis.skills : [];
    const top = skills.slice(0, 6);
    const cats: string[] = analysis?.categories ? Object.keys(analysis.categories) : [];
    const cat3 = cats.slice(0, 3).join(', ');
    const impact = (ats?.breakdown?.impact ?? 0) >= 6 ? 'proven impact' : 'business impact';
    const focus = top[0] || 'core strengths';

    const v1 = `Hands-on with ${top.slice(0,3).join(', ')}${top[3] ? `, and ${top[3]}` : ''}${cat3 ? ` across ${cat3}` : ''}. Focused on ${impact}, quality execution, and continuous improvement.`;
    const v2 = `${focus}-focused engineer with experience spanning ${cat3 || 'modern stacks'}. Delivering measurable outcomes through clean architecture, automation, and collaboration.`;
    const v3 = `Driving results with ${top.slice(0,2).join(' & ')} and complementary skills. Leveraging ${cat3 || 'industry best practices'} to accelerate delivery and reliability.`;
    return [v1, v2, v3].map(s => (s.length > 280 ? s.slice(0,277) + '...' : s));
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('roadmap')) {
      sendMessage("I'd like to generate a career roadmap");
    } else if (suggestion.toLowerCase().includes('resources')) {
      sendMessage("Can you recommend learning resources?");
    } else if (suggestion.toLowerCase().includes('project')) {
      sendMessage("What projects should I build?");
    } else if (suggestion.toLowerCase().includes('skill')) {
      sendMessage("Can you analyze my skill gaps?");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={
        `flex flex-col ${fullScreen ? 'h-full' : 'h-[80vh] lg:h-[82vh] rounded-2xl'} ` +
        'bg-bg-primary dark:bg-slate-900 ' +
        (fullScreen ? '' : 'shadow-xl border border-border ') +
        'overflow-hidden'
      }
    >
  {/* Header */}
  <div className="px-6 py-4 border-b border-border bg-slate-900/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">AI Career Coach</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Focused, calm, and actionable guidance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/60" style={{ maxHeight: '100%' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === 'user'
                  ? 'message-user'
                  : 'message-assistant prose-chat'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-text-primary dark:text-slate-200" style={{ lineHeight: '1.7' }}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...rest }: any) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prose-link"
                          aria-label={typeof children === 'string' ? children : href}
                          {...rest}
                        >
                          {children && children.length > 0 ? children : href}
                        </a>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              
              {/* Render roadmap data if present */}
              {message.data?.phases && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <p className="font-semibold mb-3 text-indigo-900 flex items-center">
                    <span className="mr-2">📚</span>
                    Learning Phases
                  </p>
                  <ul className="space-y-2 text-sm">
                    {message.data.phases.map((phase: any, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold">{phase.phase}</span>
                          <span className="text-indigo-600 ml-2">({phase.duration})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Render ATS card if present */}
              {message.data?.ats && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">📊</span>
                      ATS Score
                    </p>
                    <div className="flex items-center gap-2">
                      {typeof message.data.prevAtsScore === 'number' && (
                        <span className={`text-xs px-2 py-1 rounded-full ${message.data.ats.score - message.data.prevAtsScore >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {message.data.ats.score - message.data.prevAtsScore >= 0 ? '+' : ''}{Math.round(message.data.ats.score - message.data.prevAtsScore)}
                        </span>
                      )}
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold">
                        {Math.round(message.data.ats.score)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Sections</div><div className="font-semibold">{message.data.ats.breakdown.sections}/35</div></div>
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Keywords</div><div className="font-semibold">{message.data.ats.breakdown.keywords}/30</div></div>
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Formatting</div><div className="font-semibold">{message.data.ats.breakdown.formatting}/20</div></div>
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Impact</div><div className="font-semibold">{message.data.ats.breakdown.impact}/10</div></div>
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Quant</div><div className="font-semibold">{message.data.ats.breakdown.quantification}/5</div></div>
                    <div className="p-2 rounded bg-gray-50"><div className="text-gray-500">Contact</div><div className="font-semibold">{message.data.ats.breakdown.contact}/5</div></div>
                  </div>
                  {message.data.ats.suggestions?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm">Top Improvements</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-0.5 text-xs">
                        {message.data.ats.suggestions.slice(0, 3).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {message.data.summary?.resumeSummary && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                      <div className="font-semibold mb-1">Suggested Resume Summary</div>
                      <div className="text-blue-900 text-xs">{message.data.summary.resumeSummary}</div>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100"
                          onClick={() => navigator.clipboard.writeText(message.data.summary.resumeSummary)}
                        >Copy</button>
                        <button
                          className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100"
                          onClick={() => {
                            const variants = generateSummaryVariants(message.data.analysis, message.data.ats);
                            const variantText = `Here are 3 concise summary variants based on your profile:\n\n1) ${variants[0]}\n\n2) ${variants[1]}\n\n3) ${variants[2]}`;
                            const msg: Message = { role: 'assistant', content: variantText, timestamp: new Date().toISOString() };
                            setMessages(prev => [...prev, msg]);
                          }}
                        >Generate 3 variants</button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                      onClick={() => sendMessage('Analyze my skill gaps and suggest top 3 changes to raise my ATS score.')}
                    >Ask to improve ATS</button>
                    <button
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                      onClick={() => sendMessage('Create a 3-month roadmap focusing on my ATS gaps and most valuable skills.')}
                    >Roadmap from gaps</button>
                  </div>
                </div>
              )}
              
              <p className={`text-xs mt-3 font-medium ${message.role === 'user' ? 'text-white/70' : 'text-gray-400 dark:text-slate-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md border border-border">
              <div className="flex space-x-2">
                <div className="loading-dot"></div>
                <div className="loading-dot" style={{ animationDelay: '0.15s' }}></div>
                <div className="loading-dot" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
  <div className="px-6 py-4 bg-slate-900/40 border-t border-border">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 border border-border shadow-sm hover:shadow-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
  <div className="border-t border-border p-6 bg-slate-900">
        <div className="flex space-x-3">
          <label className="inline-flex items-center px-3 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-medium border border-border hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeUpload(file);
                // Reset so the same file can be re-selected if needed
                e.currentTarget.value = '';
              }}
              disabled={uploading}
            />
            <span className="flex items-center gap-2">
              <span>📄</span>
              <span className="text-sm">{uploading ? 'Uploading…' : 'Upload resume (PDF)'}</span>
            </span>
          </label>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your career..."
            className="input-primary flex-1 bg-white dark:bg-slate-900 text-text-primary dark:text-slate-200"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            <span className="flex items-center space-x-2">
              <span>Send</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => sendMessage("What should I learn to become a Frontend Developer?")}
            className="text-xs px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 border border-border"
          >
            💻 Frontend Developer path
          </button>
          <button
            onClick={() => sendMessage("Create a Backend Developer roadmap")}
            className="text-xs px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 border border-border"
          >
            ⚙️ Backend Developer path
          </button>
          <button
            onClick={() => sendMessage("What projects should I build?")}
            className="text-xs px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 border border-border"
          >
            🚀 Project ideas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
