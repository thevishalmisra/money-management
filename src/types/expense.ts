export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  type: "expense" | "income";
  tags?: string[];
  recurring?: boolean;
  recurringPeriod?: "daily" | "weekly" | "monthly" | "yearly";
}

export type ExpenseCategory =
  | "food"
  | "transportation"
  | "entertainment"
  | "utilities"
  | "healthcare"
  | "shopping"
  | "education"
  | "travel"
  | "housing"
  | "insurance"
  | "savings"
  | "investment"
  | "income"
  | "other";

export interface ExpenseSummary {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  monthlyTrend: Array<{
    month: string;
    expenses: number;
    income: number;
  }>;
}

export interface VoiceRecognitionResult {
  amount?: number;
  description: string;
  category?: ExpenseCategory;
  confidence: number;
  rawText: string;
}

export interface MonthlyBudget {
  category: ExpenseCategory;
  limit: number;
  spent: number;
  percentage: number;
}
