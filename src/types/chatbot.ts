export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface ExpenseContext {
  totalExpenses: number;
  totalIncome: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
}
