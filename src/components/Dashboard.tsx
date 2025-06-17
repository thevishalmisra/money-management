import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Upload,
  BarChart3,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { Charts } from "./Charts";
import { FloatingChatbot } from "./FloatingChatbot";
import { UserSettings } from "./Settings";
import { SmartFeatures } from "./SmartFeatures";
import { ThemeIcon } from "./ThemeIcon";
import { CurrencySelector } from "./CurrencySelector";
import { Expense, ExpenseSummary, MonthlyBudget } from "../types/expense";
import { ExpenseContext } from "../types/chatbot";
import { expenseManager } from "../lib/expenses";
import { settingsService } from "../lib/settings";
import { themeManager } from "../lib/theme";
import { budgetAlertManager } from "../lib/budgetAlerts";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

export function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseContext, setExpenseContext] = useState<ExpenseContext | null>(
    null,
  );
  const { toast } = useToast();

  const refreshData = () => {
    setIsLoading(true);
    try {
      const allExpenses = expenseManager.getAllExpenses();
      const expenseSummary = expenseManager.getExpenseSummary();
      const monthlyBudgets = expenseManager.getMonthlyBudgets();

      setExpenses(allExpenses);
      setSummary(expenseSummary);
      setBudgets(monthlyBudgets);

      // Create context for chatbot
      const context: ExpenseContext = {
        totalExpenses: expenseSummary.totalExpenses,
        totalIncome: expenseSummary.totalIncome,
        topCategories: Object.entries(expenseSummary.expensesByCategory)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage:
              expenseSummary.totalExpenses > 0
                ? (amount / expenseSummary.totalExpenses) * 100
                : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
        recentTransactions: allExpenses
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 10)
          .map((expense) => ({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date.toLocaleDateString(),
          })),
      };
      setExpenseContext(context);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load expense data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize settings and apply theme
    const settings = settingsService.getSettings();
    if (settings) {
      themeManager.setTheme(settings.theme);
    }

    refreshData();
  }, []);

  const handleExportData = () => {
    try {
      const data = expenseManager.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expense-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Expense data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = expenseManager.importData(data);

        if (success) {
          refreshData();
          toast({
            title: "Success",
            description: "Data imported successfully",
          });
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
            <p className="text-lg font-medium">Loading your expenses...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4 relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white header-text">
              Budget Buddy
            </h1>
            {/* Theme Toggle Icon */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <ThemeIcon />
            </div>
          </div>
          <p className="text-xl text-white/80 max-w-2xl mx-auto header-text">
          Voice-enabled expense tracking with smart insights.
          </p>
        </div>

        {/* Quick Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Income
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${summary.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      ${summary.totalExpenses.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Net Amount
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        summary.netAmount >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {summary.netAmount >= 0 ? "+" : ""}$
                      {summary.netAmount.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      summary.netAmount >= 0
                        ? "bg-green-500/20"
                        : "bg-red-500/20",
                    )}
                  >
                    <DollarSign
                      className={cn(
                        "h-6 w-6",
                        summary.netAmount >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      This Month
                    </p>
                    <p className="text-2xl font-bold">{expenses.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Transactions
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <Card className="expense-card">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-black/20 dark:bg-black/20 light:bg-white/20">
                    <TabsTrigger
                      value="overview"
                      className="text-white data-[state=active]:bg-white/20 dark:text-white dark:data-[state=active]:bg-white/20 light:text-black light:data-[state=active]:bg-black/20"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="add"
                      className="text-white data-[state=active]:bg-white/20 dark:text-white dark:data-[state=active]:bg-white/20 light:text-black light:data-[state=active]:bg-black/20"
                    >
                      Add Transaction
                    </TabsTrigger>
                    <TabsTrigger
                      value="list"
                      className="text-white data-[state=active]:bg-white/20 dark:text-white dark:data-[state=active]:bg-white/20 light:text-black light:data-[state=active]:bg-black/20"
                    >
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="text-white data-[state=active]:bg-white/20 dark:text-white dark:data-[state=active]:bg-white/20 light:text-black light:data-[state=active]:bg-black/20"
                    >
                      Analytics
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <CurrencySelector />
                    <UserSettings onSettingsChange={refreshData} />
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-data"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("import-data")?.click()
                      }
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 light:bg-black/10 light:border-black/20 light:text-black light:hover:bg-black/20"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportData}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 light:bg-black/10 light:border-black/20 light:text-black light:hover:bg-black/20"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="overview" className="space-y-6">
              {/* Smart Features Section */}
              {summary && (
                <SmartFeatures
                  expenseSummary={summary}
                  onRefresh={refreshData}
                />
              )}

              {/* Charts Section */}
              {summary && budgets.length > 0 ? (
                <Charts summary={summary} budgets={budgets} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Data Available
                    </h3>
                    <p className="text-muted-foreground text-center">
                      Start adding transactions to see your expense analytics
                      and charts
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="add">
              <ExpenseForm onExpenseAdded={refreshData} />
            </TabsContent>

            <TabsContent value="list">
              <ExpenseList
                expenses={expenses}
                onExpenseDeleted={refreshData}
                onExpenseUpdated={refreshData}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {summary && budgets.length > 0 ? (
                <Charts summary={summary} budgets={budgets} />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Analytics Coming Soon
                    </h3>
                    <p className="text-muted-foreground text-center">
                      Add more transactions to unlock detailed analytics and
                      insights
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <Card className="expense-card">
  <CardContent className="p-6 text-center">
    <p className="text-white/60 text-sm header-text">
      <span className="ml-2">Your Personal Finance Companion For Everything</span>
    </p>

    <footer className="text-xs text-white/30 mt-4">
      © {new Date().getFullYear()} Vishal Raman. All rights reserved.
    </footer>
  </CardContent>
</Card>


        {/* Floating Chatbot */}
        <FloatingChatbot expenseContext={expenseContext || undefined} />
      </div>
    </div>
  );
}
