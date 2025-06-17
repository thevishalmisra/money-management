import React, { useState, useEffect } from "react";
import {
  Bell,
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  X,
  DollarSign,
  Repeat,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { ExpenseSummary } from "../types/expense";
import { BudgetAlert, budgetAlertManager } from "../lib/budgetAlerts";
import { settingsService } from "../lib/settings";
import { cn } from "../lib/utils";

interface SmartFeaturesProps {
  expenseSummary: ExpenseSummary;
  onRefresh?: () => void;
}

export function SmartFeatures({
  expenseSummary,
  onRefresh,
}: SmartFeaturesProps) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [savingSuggestions, setSavingSuggestions] = useState<any[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);

  useEffect(() => {
    // Check budget alerts
    const budgetAlerts = budgetAlertManager.checkBudgets(expenseSummary);
    setAlerts(budgetAlerts);

    // Generate savings suggestions
    const suggestions = settingsService.generateSavingSuggestions({
      expenses: [],
      expensesByCategory: expenseSummary.expensesByCategory,
    });
    setSavingSuggestions(suggestions);

    // Get recurring expenses
    const settings = settingsService.getSettings();
    if (settings) {
      setRecurringExpenses(
        settings.recurringExpenses.filter((e) => e.isActive),
      );
    }

    // Subscribe to alert updates
    const unsubscribe = budgetAlertManager.subscribeToAlerts(setAlerts);
    return unsubscribe;
  }, [expenseSummary]);

  const dismissAlert = (alertId: string) => {
    budgetAlertManager.dismissAlert(alertId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "danger":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return settingsService.formatCurrency(amount);
  };

  if (!showAlerts && alerts.length === 0 && savingSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Bell className="h-5 w-5" />
                Budget Alerts ({alerts.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(false)}
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                className={cn(
                  "relative",
                  alert.severity === "critical" &&
                    "border-red-500 bg-red-50 dark:bg-red-950",
                  alert.severity === "danger" &&
                    "border-orange-500 bg-orange-50 dark:bg-orange-950",
                  alert.severity === "warning" &&
                    "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          alert.severity === "critical" && "text-red-600",
                          alert.severity === "danger" && "text-orange-600",
                          alert.severity === "warning" && "text-yellow-600",
                        )}
                      />
                      <Badge
                        variant={getSeverityColor(alert.severity) as any}
                        className="text-xs"
                      >
                        {alert.percentage}% used
                      </Badge>
                      <span className="text-sm font-medium capitalize">
                        {alert.category}
                      </span>
                    </div>
                    <AlertDescription className="text-sm">
                      {alert.message}
                    </AlertDescription>
                    <div className="mt-2">
                      <Progress
                        value={Math.min(alert.percentage, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                        <span>{formatCurrency(alert.spent)}</span>
                        <span>{formatCurrency(alert.limit)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Savings Suggestions */}
      {savingSuggestions.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Lightbulb className="h-5 w-5" />
              Smart Savings Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {savingSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    suggestion.difficulty === "easy" &&
                      "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                    suggestion.difficulty === "medium" &&
                      "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
                    suggestion.difficulty === "hard" &&
                      "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
                  )}
                >
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      Save {formatCurrency(suggestion.potentialSaving)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    <Badge
                      variant={
                        suggestion.difficulty === "easy"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {suggestion.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recurring Expenses */}
      {recurringExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Upcoming Recurring Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recurringExpenses.slice(0, 3).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.frequency} • {expense.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(expense.nextDue).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={onRefresh}
            >
              <Bell className="h-4 w-4" />
              Review Budgets
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2"
              onClick={() => budgetAlertManager.clearAllAlerts()}
            >
              <X className="h-4 w-4" />
              Clear Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
