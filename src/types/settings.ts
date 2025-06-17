export interface UserSettings {
  theme: "light" | "dark" | "system";
  currency: Currency;
  budgetReminders: boolean;
  savingsSuggestions: boolean;
  recurringExpenses: RecurringExpense[];
  budgetLimits: BudgetLimit[];
  language: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate compared to USD
}

export interface RecurringExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextDue: Date;
  isActive: boolean;
  lastProcessed?: Date;
}

export interface BudgetLimit {
  id: string;
  category: string;
  limit: number;
  period: "monthly" | "weekly" | "yearly";
  notificationThreshold: number; // Percentage (e.g., 80 for 80%)
  isActive: boolean;
}

export interface SavingSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  potentialSaving: number;
  difficulty: "easy" | "medium" | "hard";
  type: "subscription" | "habit" | "alternative" | "optimization";
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.85 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.73 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 110 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.25 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.35 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.92 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 75 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 6.45 },
];
