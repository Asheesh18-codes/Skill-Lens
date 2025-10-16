import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

// In-memory chat sessions (in production, use Redis)
const chatSessions = new Map();

/**
 * POST /api/v1/chat/message
 * Send a message to the career advisor chatbot
 */
router.post('/message', async (req, res, next) => {
  try {
    const { sessionId, message, userProfile } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get or create session
    let session = chatSessions.get(sessionId) || {
      id: sessionId || `session_${Date.now()}`,
      history: [],
      userProfile: userProfile || {},
      createdAt: new Date().toISOString()
    };

    // Add user message to history
    session.history.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    console.log(`💬 Chat message from session ${session.id}: "${message}"`);

    // Generate AI response
    // Format history to only include role and content (required by Pydantic model)
    const formattedHistory = session.history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const aiResponse = await aiService.generateChatResponse({
      message,
      history: formattedHistory,
      userProfile: session.userProfile
    });

    // Add AI response to history
    session.history.push({
      role: 'assistant',
      content: aiResponse.message,
      data: aiResponse.data,
      timestamp: new Date().toISOString()
    });

    // Update session
    chatSessions.set(session.id, session);

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        message: aiResponse.message,
        data: aiResponse.data,
        suggestions: aiResponse.suggestions || []
      }
    });

  } catch (error) {
    console.error('❌ Chat message error:', error);
    next(error);
  }
});

/**
 * POST /api/v1/chat/roadmap
 * Generate a personalized career roadmap
 */
router.post('/roadmap', async (req, res, next) => {
  try {
    const { sessionId, targetRole, currentSkills, timeline } = req.body;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Target role is required'
      });
    }

    console.log(`🗺️ Generating roadmap for: ${targetRole}`);

    // Generate comprehensive roadmap
    const roadmap = await aiService.generateCareerRoadmap({
      targetRole,
      currentSkills: currentSkills || [],
      timeline: timeline || '6 months',
      sessionId
    });

    // Update session with roadmap
    if (sessionId && chatSessions.has(sessionId)) {
      const session = chatSessions.get(sessionId);
      session.userProfile.targetRole = targetRole;
      session.userProfile.roadmap = roadmap;
      chatSessions.set(sessionId, session);
    }

    res.status(200).json({
      success: true,
      data: roadmap
    });

  } catch (error) {
    console.error('❌ Roadmap generation error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/chat/history/:sessionId
 * Retrieve chat history for a session
 */
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = chatSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      sessionId: session.id,
      history: session.history,
      userProfile: session.userProfile,
      createdAt: session.createdAt
    }
  });
});

/**
 * POST /api/v1/chat/session
 * Create a new chat session with user profile
 */
router.post('/session', (req, res) => {
  const { userProfile, skills } = req.body;
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id: sessionId,
    history: [],
    userProfile: {
      ...userProfile,
      skills: skills || [],
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };

  chatSessions.set(sessionId, session);

  console.log(`✨ New chat session created: ${sessionId}`);

  res.status(201).json({
    success: true,
    data: {
      sessionId: session.id,
      message: 'Session created successfully'
    }
  });
});

/**
 * DELETE /api/v1/chat/session/:sessionId
 * Clear a chat session
 */
router.delete('/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (chatSessions.has(sessionId)) {
    chatSessions.delete(sessionId);
    console.log(`🗑️ Session deleted: ${sessionId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  }

  res.status(404).json({
    success: false,
    message: 'Session not found'
  });
});

export default router;
