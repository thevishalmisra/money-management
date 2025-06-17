import {
  UserSettings,
  Currency,
  RecurringExpense,
  BudgetLimit,
  SavingSuggestion,
  SUPPORTED_CURRENCIES,
} from "../types/settings";

export class SettingsService {
  private storageKey = "expense-tracker-settings";

  constructor() {
    this.initializeSettings();
  }

  private initializeSettings() {
    const settings = this.getSettings();
    if (!settings) {
      const defaultSettings: UserSettings = {
        theme: "system",
        currency: SUPPORTED_CURRENCIES[0], // USD
        budgetReminders: true,
        savingsSuggestions: true,
        recurringExpenses: [],
        budgetLimits: [],
        language: "en",
        dateFormat: "MM/DD/YYYY",
      };
      this.saveSettings(defaultSettings);
    }
  }

  public getSettings(): UserSettings | null {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return null;

    const settings = JSON.parse(data);
    return {
      ...settings,
      recurringExpenses:
        settings.recurringExpenses?.map((expense: any) => ({
          ...expense,
          nextDue: new Date(expense.nextDue),
          lastProcessed: expense.lastProcessed
            ? new Date(expense.lastProcessed)
            : undefined,
        })) || [],
    };
  }

  public saveSettings(settings: UserSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
    this.applyTheme(settings.theme);
  }

  public updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ): void {
    const settings = this.getSettings();
    if (settings) {
      settings[key] = value;
      this.saveSettings(settings);
    }
  }

  public applyTheme(theme: "light" | "dark" | "system"): void {
    const root = document.documentElement;

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
  }

  public addRecurringExpense(
    expense: Omit<RecurringExpense, "id">,
  ): RecurringExpense {
    const settings = this.getSettings();
    if (!settings) throw new Error("Settings not initialized");

    const newExpense: RecurringExpense = {
      ...expense,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };

    settings.recurringExpenses.push(newExpense);
    this.saveSettings(settings);
    return newExpense;
  }

  public updateRecurringExpense(
    id: string,
    updates: Partial<RecurringExpense>,
  ): void {
    const settings = this.getSettings();
    if (!settings) return;

    const index = settings.recurringExpenses.findIndex(
      (expense) => expense.id === id,
    );
    if (index !== -1) {
      settings.recurringExpenses[index] = {
        ...settings.recurringExpenses[index],
        ...updates,
      };
      this.saveSettings(settings);
    }
  }

  public deleteRecurringExpense(id: string): void {
    const settings = this.getSettings();
    if (!settings) return;

    settings.recurringExpenses = settings.recurringExpenses.filter(
      (expense) => expense.id !== id,
    );
    this.saveSettings(settings);
  }

  public addBudgetLimit(limit: Omit<BudgetLimit, "id">): BudgetLimit {
    const settings = this.getSettings();
    if (!settings) throw new Error("Settings not initialized");

    const newLimit: BudgetLimit = {
      ...limit,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };

    settings.budgetLimits.push(newLimit);
    this.saveSettings(settings);
    return newLimit;
  }

  public updateBudgetLimit(id: string, updates: Partial<BudgetLimit>): void {
    const settings = this.getSettings();
    if (!settings) return;

    const index = settings.budgetLimits.findIndex((limit) => limit.id === id);
    if (index !== -1) {
      settings.budgetLimits[index] = {
        ...settings.budgetLimits[index],
        ...updates,
      };
      this.saveSettings(settings);
    }
  }

  public deleteBudgetLimit(id: string): void {
    const settings = this.getSettings();
    if (!settings) return;

    settings.budgetLimits = settings.budgetLimits.filter(
      (limit) => limit.id !== id,
    );
    this.saveSettings(settings);
  }

  public convertAmount(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
  ): number {
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromCurrency.rate;
    return usdAmount * toCurrency.rate;
  }

  public formatCurrency(amount: number, currency?: Currency): string {
    const settings = this.getSettings();
    const currentCurrency =
      currency || settings?.currency || SUPPORTED_CURRENCIES[0];

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currentCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  public generateSavingSuggestions(expenseData: any): SavingSuggestion[] {
    const suggestions: SavingSuggestion[] = [];
    const settings = this.getSettings();
    if (!settings?.savingsSuggestions) return suggestions;

    // Analyze subscription patterns
    const subscriptionExpenses =
      expenseData.expenses?.filter(
        (expense: any) =>
          expense.description.toLowerCase().includes("subscription") ||
          expense.description.toLowerCase().includes("netflix") ||
          expense.description.toLowerCase().includes("spotify"),
      ) || [];

    if (subscriptionExpenses.length > 0) {
      suggestions.push({
        id: "sub-review",
        title: "Review Subscriptions",
        description: `You have ${subscriptionExpenses.length} subscription-like expenses. Consider canceling unused ones.`,
        category: "subscriptions",
        potentialSaving:
          subscriptionExpenses.reduce(
            (sum: number, exp: any) => sum + exp.amount,
            0,
          ) * 0.3,
        difficulty: "easy",
        type: "subscription",
      });
    }

    // Food spending analysis
    const foodExpenses =
      expenseData.expenses?.filter(
        (expense: any) => expense.category === "food",
      ) || [];

    if (foodExpenses.length > 15) {
      // More than 15 food transactions per month
      suggestions.push({
        id: "meal-prep",
        title: "Try Meal Prepping",
        description:
          "You eat out frequently. Meal prepping could save you significant money.",
        category: "food",
        potentialSaving:
          foodExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) *
          0.4,
        difficulty: "medium",
        type: "habit",
      });
    }

    return suggestions;
  }

  public checkBudgetAlerts(expenseData: any): Array<{
    category: string;
    spent: number;
    limit: number;
    percentage: number;
  }> {
    const settings = this.getSettings();
    if (!settings?.budgetReminders) return [];

    const alerts: Array<{
      category: string;
      spent: number;
      limit: number;
      percentage: number;
    }> = [];

    settings.budgetLimits.forEach((limit) => {
      if (!limit.isActive) return;

      const categorySpent =
        expenseData.expensesByCategory?.[limit.category] || 0;
      const percentage = (categorySpent / limit.limit) * 100;

      if (percentage >= limit.notificationThreshold) {
        alerts.push({
          category: limit.category,
          spent: categorySpent,
          limit: limit.limit,
          percentage: Math.round(percentage),
        });
      }
    });

    return alerts;
  }
}

export const settingsService = new SettingsService();
