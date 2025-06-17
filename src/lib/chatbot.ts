import { ChatMessage, ChatSession, ExpenseContext } from "../types/chatbot";
import { geminiService } from "./gemini";

export class ChatbotService {
  private storageKey = "expense-chatbot-sessions";
  private currentSessionId: string | null = null;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public createNewSession(): string {
    const sessionId = this.generateId();
    const session: ChatSession = {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    const sessions = this.getAllSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);
    this.currentSessionId = sessionId;

    return sessionId;
  }

  public getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId) {
      this.currentSessionId = this.createNewSession();
    }

    const sessions = this.getAllSessions();
    return sessions.find((s) => s.id === this.currentSessionId) || null;
  }

  public getAllSessions(): ChatSession[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];

    const sessions = JSON.parse(data);
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      lastActivity: new Date(session.lastActivity),
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  }

  private saveSessions(sessions: ChatSession[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(sessions));
  }

  public async sendMessage(
    content: string,
    expenseContext?: ExpenseContext,
    isGeneralSearch: boolean = false,
  ): Promise<ChatMessage> {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    session.messages.push(userMessage);
    session.lastActivity = new Date();

    // Create conversation history for context
    const conversationHistory = session.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // Get AI response
      const aiResponse = await geminiService.generateResponse(
        content,
        expenseContext,
        conversationHistory,
        isGeneralSearch,
      );

      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      };

      session.messages.push(assistantMessage);
      session.lastActivity = new Date();

      // Save updated session
      const sessions = this.getAllSessions();
      const sessionIndex = sessions.findIndex((s) => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = session;
        this.saveSessions(sessions);
      }

      return assistantMessage;
    } catch (error) {
      console.error("Error getting AI response:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        content:
          "I'm having trouble connecting right now. Please try again in a moment! 🤖",
        role: "assistant",
        timestamp: new Date(),
      };

      session.messages.push(errorMessage);
      session.lastActivity = new Date();

      const sessions = this.getAllSessions();
      const sessionIndex = sessions.findIndex((s) => s.id === session.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex] = session;
        this.saveSessions(sessions);
      }

      return errorMessage;
    }
  }

  public addTypingIndicator(): ChatMessage {
    const session = this.getCurrentSession();
    if (!session) throw new Error("No active session");

    const typingMessage: ChatMessage = {
      id: "typing-" + this.generateId(),
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isTyping: true,
    };

    session.messages.push(typingMessage);
    return typingMessage;
  }

  public removeTypingIndicator() {
    const session = this.getCurrentSession();
    if (!session) return;

    session.messages = session.messages.filter((msg) => !msg.isTyping);
  }

  public clearCurrentSession() {
    const session = this.getCurrentSession();
    if (!session) return;

    session.messages = [];
    session.lastActivity = new Date();

    const sessions = this.getAllSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === session.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = session;
      this.saveSessions(sessions);
    }
  }

  public deleteSession(sessionId: string) {
    const sessions = this.getAllSessions();
    const filteredSessions = sessions.filter((s) => s.id !== sessionId);
    this.saveSessions(filteredSessions);

    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  public switchToSession(sessionId: string) {
    this.currentSessionId = sessionId;
  }
}

export const chatbotService = new ChatbotService();
