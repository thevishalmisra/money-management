import {
  Expense,
  ExpenseCategory,
  ExpenseSummary,
  MonthlyBudget,
} from "../types/expense";

export class ExpenseManager {
  private storageKey = "expense-tracker-data";

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  public getAllExpenses(): Expense[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];

    const expenses = JSON.parse(data);
    return expenses.map((expense: any) => ({
      ...expense,
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt),
    }));
  }

  public addExpense(
    expenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">,
  ): Expense {
    const expense: Expense = {
      ...expenseData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const expenses = this.getAllExpenses();
    expenses.push(expense);
    this.saveExpenses(expenses);

    return expense;
  }

  public updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const expenses = this.getAllExpenses();
    const index = expenses.findIndex((expense) => expense.id === id);

    if (index === -1) return null;

    expenses[index] = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveExpenses(expenses);
    return expenses[index];
  }

  public deleteExpense(id: string): boolean {
    const expenses = this.getAllExpenses();
    const filteredExpenses = expenses.filter((expense) => expense.id !== id);

    if (filteredExpenses.length === expenses.length) return false;

    this.saveExpenses(filteredExpenses);
    return true;
  }

  public getExpensesByDateRange(startDate: Date, endDate: Date): Expense[] {
    const expenses = this.getAllExpenses();
    return expenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate,
    );
  }

  public getCurrentMonthExpenses(): Expense[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.getExpensesByDateRange(startOfMonth, endOfMonth);
  }

  public getExpenseSummary(startDate?: Date, endDate?: Date): ExpenseSummary {
    let expenses: Expense[];

    if (startDate && endDate) {
      expenses = this.getExpensesByDateRange(startDate, endDate);
    } else {
      expenses = this.getCurrentMonthExpenses();
    }

    const totalExpenses = expenses
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = expenses
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = expenses
      .filter((e) => e.type === "expense")
      .reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {} as Record<ExpenseCategory, number>,
      );

    // Generate monthly trend for the last 6 months
    const monthlyTrend = this.getMonthlyTrend();

    return {
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      expensesByCategory,
      monthlyTrend,
    };
  }

  private getMonthlyTrend() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthExpenses = this.getExpensesByDateRange(
        startOfMonth,
        endOfMonth,
      );

      const expenses = monthExpenses
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0);

      const income = monthExpenses
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        expenses,
        income,
      });
    }

    return months;
  }

  public getMonthlyBudgets(): MonthlyBudget[] {
    const currentMonthExpenses = this.getCurrentMonthExpenses();
    const budgetLimits: Record<ExpenseCategory, number> = {
      food: 800,
      transportation: 300,
      entertainment: 200,
      utilities: 150,
      healthcare: 100,
      shopping: 400,
      education: 100,
      travel: 500,
      housing: 1200,
      insurance: 200,
      savings: 1000,
      investment: 500,
      income: 0,
      other: 200,
    };

    return Object.entries(budgetLimits)
      .map(([category, limit]) => {
        const spent = currentMonthExpenses
          .filter((e) => e.category === category && e.type === "expense")
          .reduce((sum, e) => sum + e.amount, 0);

        return {
          category: category as ExpenseCategory,
          limit,
          spent,
          percentage: limit > 0 ? (spent / limit) * 100 : 0,
        };
      })
      .filter((budget) => budget.limit > 0);
  }

  private saveExpenses(expenses: Expense[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(expenses));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public exportData(): string {
    return JSON.stringify(this.getAllExpenses(), null, 2);
  }

  public importData(jsonData: string): boolean {
    try {
      const expenses = JSON.parse(jsonData);
      if (Array.isArray(expenses)) {
        this.saveExpenses(expenses);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
  }
}

export const expenseManager = new ExpenseManager();

export const categoryIcons: Record<ExpenseCategory, string> = {
  food: "🍽️",
  transportation: "🚗",
  entertainment: "🎬",
  utilities: "⚡",
  healthcare: "����",
  shopping: "🛍️",
  education: "📚",
  travel: "✈️",
  housing: "🏠",
  insurance: "🛡️",
  savings: "💰",
  investment: "📈",
  income: "💵",
  other: "📦",
};

export const categoryColors: Record<ExpenseCategory, string> = {
  food: "#ef4444",
  transportation: "#3b82f6",
  entertainment: "#8b5cf6",
  utilities: "#f59e0b",
  healthcare: "#ec4899",
  shopping: "#10b981",
  education: "#6366f1",
  travel: "#14b8a6",
  housing: "#f97316",
  insurance: "#84cc16",
  savings: "#22c55e",
  investment: "#06b6d4",
  income: "#22c55e",
  other: "#6b7280",
};
