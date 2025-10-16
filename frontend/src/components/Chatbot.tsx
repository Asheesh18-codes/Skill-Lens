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
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Chatbot: React.FC<ChatbotProps> = ({ userSkills = [], onRoadmapGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          skills: userSkills
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Career Coach</h2>
            <p className="text-sm text-white/90 font-medium">Your personal guide to career growth</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white" style={{ maxHeight: '500px' }}>
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
              <div className="whitespace-pre-wrap leading-relaxed" style={{ lineHeight: '1.7' }}>
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
              
              <p className={`text-xs mt-3 font-medium ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-md border border-gray-100">
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-all duration-200 border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your career..."
            className="input-primary flex-1"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
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
            className="text-xs px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 rounded-lg font-medium hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-indigo-100"
          >
            💻 Frontend Developer path
          </button>
          <button
            onClick={() => sendMessage("Create a Backend Developer roadmap")}
            className="text-xs px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg font-medium hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-100"
          >
            ⚙️ Backend Developer path
          </button>
          <button
            onClick={() => sendMessage("What projects should I build?")}
            className="text-xs px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg font-medium hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-100"
          >
            🚀 Project ideas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
