// Simple in-memory session store. In production, replace with Redis or database.
const chatSessions = new Map();

export function getSession(sessionId) {
  return chatSessions.get(sessionId) || null;
}

export function createSession(initial = {}) {
  const id = initial.id || `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const session = {
    id,
    history: [],
    userProfile: { ...(initial.userProfile || {}) },
    createdAt: new Date().toISOString()
  };
  chatSessions.set(id, session);
  return session;
}

export function setSession(session) {
  if (!session || !session.id) return;
  chatSessions.set(session.id, session);
}

export function ensureSession(sessionId, fallbackProfile = {}) {
  let session = sessionId ? getSession(sessionId) : null;
  if (!session) {
    session = createSession({ id: sessionId, userProfile: fallbackProfile });
  }
  return session;
}

export function updateUserProfile(sessionId, updates = {}) {
  const session = ensureSession(sessionId);
  session.userProfile = { ...session.userProfile, ...updates };
  setSession(session);
  return session;
}

export function appendHistory(sessionId, message) {
  const session = ensureSession(sessionId);
  session.history.push(message);
  setSession(session);
  return session;
}

export function deleteSession(sessionId) {
  return chatSessions.delete(sessionId);
}

export function hasSession(sessionId) {
  return chatSessions.has(sessionId);
}

export default {
  getSession,
  createSession,
  setSession,
  ensureSession,
  updateUserProfile,
  appendHistory,
  deleteSession,
  hasSession
};
