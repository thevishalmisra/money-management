import React, { useState } from "react";
import { format } from "date-fns";
import {
  Trash2,
  Edit3,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Expense, ExpenseCategory } from "../types/expense";
import { expenseManager, categoryIcons, categoryColors } from "../lib/expenses";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseDeleted: () => void;
  onExpenseUpdated: () => void;
}

export function ExpenseList({
  expenses,
  onExpenseDeleted,
  onExpenseUpdated,
}: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  const filteredAndSortedExpenses = React.useMemo(() => {
    let filtered = expenses.filter((expense) => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || expense.category === categoryFilter;
      const matchesType = typeFilter === "all" || expense.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    try {
      const success = expenseManager.deleteExpense(id);
      if (success) {
        toast({
          title: "Deleted",
          description: "Expense deleted successfully.",
        });
        onExpenseDeleted();
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(expenses.map((e) => e.category)));
    return categories.sort();
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="text-6xl opacity-20">💸</div>
            <h3 className="text-lg font-medium">No transactions yet</h3>
            <p className="text-muted-foreground">
              Start by adding your first expense or income using the form above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value: any) => setTypeFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value: any) => setCategoryFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    <span className="flex items-center gap-2">
                      <span>{categoryIcons[category]}</span>
                      <span className="capitalize">{category}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [sort, order] = value.split("-");
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="amount-desc">
                  Amount (High to Low)
                </SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                <SelectItem value="category-desc">Category (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedExpenses.length} of {expenses.length}{" "}
          transactions
        </p>

        {filteredAndSortedExpenses.length > 0 && (
          <div className="flex gap-2">
            <Badge variant="outline">
              Total: $
              {filteredAndSortedExpenses
                .reduce(
                  (sum, e) =>
                    e.type === "income" ? sum + e.amount : sum - e.amount,
                  0,
                )
                .toFixed(2)}
            </Badge>
          </div>
        )}
      </div>

      {/* Expense List */}
      <div className="grid gap-3">
        {filteredAndSortedExpenses.map((expense) => (
          <Card
            key={expense.id}
            className="transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: `${categoryColors[expense.category]}20`,
                      color: categoryColors[expense.category],
                    }}
                  >
                    {categoryIcons[expense.category]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {expense.description}
                      </h3>
                      <Badge
                        variant={
                          expense.type === "income" ? "default" : "secondary"
                        }
                        className={cn(
                          "text-xs",
                          expense.type === "income" &&
                            "bg-green-100 text-green-800",
                          expense.type === "expense" &&
                            "bg-red-100 text-red-800",
                        )}
                      >
                        {expense.type === "income" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {expense.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="capitalize">{expense.category}</span>
                      <span>{format(expense.date, "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        expense.type === "income"
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {expense.type === "income" ? "+" : "-"}$
                      {expense.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(expense.createdAt, "HH:mm")}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        toast({
                          title: "Edit Feature",
                          description: "Edit functionality coming soon!",
                        });
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Transaction
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div>
                              Are you sure you want to delete this transaction?
                              This action cannot be undone.
                              <div className="mt-2 p-3 bg-muted rounded-lg">
                                <div className="font-medium">
                                  {expense.description}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${expense.amount.toFixed(2)} •{" "}
                                  {expense.category} •{" "}
                                  {format(expense.date, "MMM dd, yyyy")}
                                </div>
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(expense.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
