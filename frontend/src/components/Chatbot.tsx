import React, { useState, useRef, useEffect } from 'react';
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
  }, [messages]);

  useEffect(() => {
    // Create session on mount
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
        
        // Add welcome message
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

  const generateRoadmap = async (targetRole: string) => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/chat/roadmap`, {
        sessionId,
        targetRole,
        currentSkills: userSkills,
        timeline: '6 months'
      });

      if (response.data.success) {
        const roadmap = response.data.data;
        
        // Add roadmap message
        const roadmapMessage: Message = {
          role: 'assistant',
          content: `🗺️ I've generated a comprehensive ${roadmap.timeline} roadmap for becoming a **${roadmap.role}**!\n\nCheck out the detailed roadmap below with learning phases, resources, and milestones.`,
          timestamp: new Date().toISOString(),
          data: roadmap
        };
        
        setMessages(prev => [...prev, roadmapMessage]);
        
        if (onRoadmapGenerated) {
          onRoadmapGenerated(roadmap);
        }
      }
    } catch (error: any) {
      console.error('Roadmap error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I couldn't generate the roadmap: ${error.response?.data?.message || error.message}`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: generateRoadmap can be triggered via chat messages in future updates
  // For now, roadmaps are generated through the chat interface

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('roadmap')) {
      // Prompt for target role
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">🤖 AI Career Coach</h2>
        <p className="text-sm opacity-90">Your personal guide to career growth</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Render roadmap data if present */}
              {message.data?.phases && (
                <div className="mt-3 p-3 bg-white rounded-lg text-gray-900 text-sm">
                  <p className="font-semibold mb-2">📚 Learning Phases:</p>
                  <ul className="space-y-1">
                    {message.data.phases.map((phase: any, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="font-medium mr-2">{idx + 1}.</span>
                        <span>{phase.phase} ({phase.duration})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your career..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => sendMessage("What should I learn to become a Frontend Developer?")}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
          >
            Frontend Developer path
          </button>
          <button
            onClick={() => sendMessage("Create a Backend Developer roadmap")}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
          >
            Backend Developer path
          </button>
          <button
            onClick={() => sendMessage("What projects should I build?")}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
          >
            Project ideas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
