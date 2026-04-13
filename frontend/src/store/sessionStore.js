/**
 * sessionStore.js
 * Global Zustand store for session state.
 * Auth state is persisted to localStorage so it survives page refreshes.
 */

import { create } from 'zustand';

const AUTH_KEY = 'learnpeer_auth';

// Helper: load persisted auth from localStorage (safe)
function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { isAuthenticated: false, user: null };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

// Helper: save auth to localStorage
function persistAuth(isAuthenticated, user) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated, user }));
  } catch {
    // quota exceeded or private mode — fail silently
  }
}

const useSessionStore = create((set) => {
  const { isAuthenticated, user } = loadAuth();

  return {
    // ── Auth ─────────────────────────────────────────────────────────────────
    isAuthenticated,
    user,

    setIsAuthenticated: (value, userData = null) => {
      persistAuth(value, userData);
      set({ isAuthenticated: value, user: userData });
    },

    logout: () => {
      persistAuth(false, null);
      set({ isAuthenticated: false, user: null });
    },

    // ── Session ──────────────────────────────────────────────────────────────
    sessionId: null,
    topic: '',
    keywords: [],
    uploadedDocument: null,

    setSessionId: (id) => set({ sessionId: id }),
    setTopic: (topic) => set({ topic }),
    setKeywords: (keywords) => set({ keywords }),

    setUploadedDocument: (doc) => set({ uploadedDocument: doc }),

    // ── Chat history ─────────────────────────────────────────────────────────
    chatHistory: [],

    addChatMessage: (msg) =>
      set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

    clearChatHistory: () => set({ chatHistory: [] }),

    // ── Full session reset (e.g., start new session) ─────────────────────────
    resetSession: () =>
      set({
        sessionId: null,
        topic: '',
        keywords: [],
        uploadedDocument: null,
        chatHistory: [],
      }),
  };
});

export { useSessionStore };
