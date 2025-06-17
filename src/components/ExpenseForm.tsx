import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Calculator } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { VoiceInput } from "./VoiceInput";
import {
  Expense,
  ExpenseCategory,
  VoiceRecognitionResult,
} from "../types/expense";
import { expenseManager, categoryIcons } from "../lib/expenses";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "food",
    "transportation",
    "entertainment",
    "utilities",
    "healthcare",
    "shopping",
    "education",
    "travel",
    "housing",
    "insurance",
    "savings",
    "investment",
    "income",
    "other",
  ]),
  type: z.enum(["expense", "income"]),
  date: z.string(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onExpenseAdded: () => void;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Dining" },
  { value: "transportation", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
  { value: "utilities", label: "Utilities" },
  { value: "healthcare", label: "Healthcare" },
  { value: "shopping", label: "Shopping" },
  { value: "education", label: "Education" },
  { value: "travel", label: "Travel" },
  { value: "housing", label: "Housing" },
  { value: "insurance", label: "Insurance" },
  { value: "savings", label: "Savings" },
  { value: "investment", label: "Investment" },
  { value: "income", label: "Income" },
  { value: "other", label: "Other" },
];

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceRecognitionResult | null>(
    null,
  );
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      type: "expense",
    },
  });

  const watchedType = watch("type");

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);

    try {
      const expense: Omit<Expense, "id" | "createdAt" | "updatedAt"> = {
        amount: data.amount,
        description: data.description,
        category: data.category,
        type: data.type,
        date: new Date(data.date),
      };

      expenseManager.addExpense(expense);

      toast({
        title: "Success!",
        description: `${data.type === "expense" ? "Expense" : "Income"} of $${data.amount.toFixed(2)} added successfully.`,
      });

      reset({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: undefined,
        description: "",
        category: undefined,
      });

      setVoiceResult(null);
      onExpenseAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceResult = (result: VoiceRecognitionResult) => {
    setVoiceResult(result);

    if (result.amount) {
      setValue("amount", result.amount);
    }

    if (result.description) {
      setValue("description", result.description);
    }

    if (result.category) {
      setValue("category", result.category);
    }

    // Auto-detect if this is income based on keywords
    const incomeKeywords = [
      "salary",
      "income",
      "paycheck",
      "earned",
      "bonus",
      "freelance",
    ];
    if (
      incomeKeywords.some((keyword) =>
        result.rawText.toLowerCase().includes(keyword),
      )
    ) {
      setValue("type", "income");
    }
  };

  const handleVoiceError = (error: string) => {
    toast({
      title: "Voice Recognition Error",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Transaction
        </CardTitle>
        <CardDescription>
          Track your expenses and income with voice recognition or manual entry
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="voice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice">Voice Input</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4">
            <VoiceInput
              onResult={handleVoiceResult}
              onError={handleVoiceError}
              disabled={isSubmitting}
            />

            {voiceResult && (
              <div className="text-center">
                <Button
                  onClick={() => {
                    if (voiceResult.amount && voiceResult.description) {
                      setValue("amount", voiceResult.amount);
                      setValue("description", voiceResult.description);
                      if (voiceResult.category) {
                        setValue("category", voiceResult.category);
                      }
                    }
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Use Voice Data in Form
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("type", value as "expense" | "income")
                    }
                    defaultValue="expense"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">💸 Expense</SelectItem>
                      <SelectItem value="income">💰 Income</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("amount", { valueAsNumber: true })}
                    className={cn(errors.amount && "border-red-500")}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this transaction for?"
                  {...register("description")}
                  className={cn(errors.description && "border-red-500")}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("category", value as ExpenseCategory)
                    }
                  >
                    <SelectTrigger
                      className={cn(errors.category && "border-red-500")}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat) =>
                          watchedType === "income"
                            ? cat.value === "income"
                            : cat.value !== "income",
                        )
                        .map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <span className="flex items-center gap-2">
                              <span>{categoryIcons[category.value]}</span>
                              {category.label}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    className={cn(errors.date && "border-red-500")}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500">
                      {errors.date.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {watchedType === "expense" ? "Expense" : "Income"}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
