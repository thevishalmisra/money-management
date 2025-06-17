import { ExpenseSummary } from "../types/expense";
import { settingsService } from "./settings";

export interface BudgetAlert {
  id: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  severity: "warning" | "danger" | "critical";
  message: string;
  timestamp: Date;
}

export class BudgetAlertManager {
  private alerts: BudgetAlert[] = [];
  private alertCallbacks: ((alerts: BudgetAlert[]) => void)[] = [];

  public checkBudgets(expenseSummary: ExpenseSummary): BudgetAlert[] {
    const settings = settingsService.getSettings();
    if (!settings?.budgetReminders) return [];

    const newAlerts: BudgetAlert[] = [];

    settings.budgetLimits.forEach((budgetLimit) => {
      if (!budgetLimit.isActive) return;

      const spent =
        expenseSummary.expensesByCategory[budgetLimit.category] || 0;
      const percentage =
        budgetLimit.limit > 0 ? (spent / budgetLimit.limit) * 100 : 0;

      if (percentage >= budgetLimit.notificationThreshold) {
        const severity = this.getSeverity(percentage);
        const alert: BudgetAlert = {
          id: `${budgetLimit.category}-${Date.now()}`,
          category: budgetLimit.category,
          spent,
          limit: budgetLimit.limit,
          percentage: Math.round(percentage),
          severity,
          message: this.generateAlertMessage(
            budgetLimit.category,
            percentage,
            spent,
            budgetLimit.limit,
          ),
          timestamp: new Date(),
        };

        newAlerts.push(alert);
      }
    });

    this.alerts = newAlerts;
    this.notifyCallbacks();
    return newAlerts;
  }

  private getSeverity(percentage: number): "warning" | "danger" | "critical" {
    if (percentage >= 100) return "critical";
    if (percentage >= 90) return "danger";
    return "warning";
  }

  private generateAlertMessage(
    category: string,
    percentage: number,
    spent: number,
    limit: number,
  ): string {
    const remaining = Math.max(0, limit - spent);

    if (percentage >= 100) {
      const overspent = spent - limit;
      return `⚠️ You've exceeded your ${category} budget by $${overspent.toFixed(2)}!`;
    } else if (percentage >= 90) {
      return `🚨 Almost at your ${category} budget limit! Only $${remaining.toFixed(2)} remaining.`;
    } else {
      return `⚡ You've used ${percentage.toFixed(0)}% of your ${category} budget. $${remaining.toFixed(2)} remaining.`;
    }
  }

  public getActiveAlerts(): BudgetAlert[] {
    return this.alerts;
  }

  public subscribeToAlerts(
    callback: (alerts: BudgetAlert[]) => void,
  ): () => void {
    this.alertCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks() {
    this.alertCallbacks.forEach((callback) => callback(this.alerts));
  }

  public dismissAlert(alertId: string) {
    this.alerts = this.alerts.filter((alert) => alert.id !== alertId);
    this.notifyCallbacks();
  }

  public clearAllAlerts() {
    this.alerts = [];
    this.notifyCallbacks();
  }
}

export const budgetAlertManager = new BudgetAlertManager();
