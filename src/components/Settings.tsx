import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Bell,
  Lightbulb,
  Repeat,
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  UserSettings,
  SUPPORTED_CURRENCIES,
  RecurringExpense,
  BudgetLimit,
} from "../types/settings";
import { settingsService } from "../lib/settings";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

interface SettingsProps {
  onSettingsChange?: () => void;
}

export function UserSettings({ onSettingsChange }: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [newRecurring, setNewRecurring] = useState({
    amount: "",
    description: "",
    category: "utilities",
    frequency: "monthly" as const,
  });
  const [newBudget, setNewBudget] = useState({
    category: "food",
    limit: "",
    period: "monthly" as const,
    threshold: "80",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const currentSettings = settingsService.getSettings();
      setSettings(currentSettings);
    }
  }, [isOpen]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    settingsService.updateSetting(key, value);
    onSettingsChange?.();

    toast({
      title: "Settings Updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} has been updated.`,
    });
  };

  const addRecurringExpense = () => {
    if (!newRecurring.amount || !newRecurring.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 30); // Default to 30 days from now

    const expense = settingsService.addRecurringExpense({
      amount: parseFloat(newRecurring.amount),
      description: newRecurring.description,
      category: newRecurring.category,
      frequency: newRecurring.frequency,
      nextDue,
      isActive: true,
    });

    const currentSettings = settingsService.getSettings();
    setSettings(currentSettings);
    setNewRecurring({
      amount: "",
      description: "",
      category: "utilities",
      frequency: "monthly",
    });

    toast({
      title: "Recurring Expense Added",
      description: `${expense.description} will remind you every ${expense.frequency}.`,
    });
  };

  const addBudgetLimit = () => {
    if (!newBudget.limit) {
      toast({
        title: "Error",
        description: "Please enter a budget limit.",
        variant: "destructive",
      });
      return;
    }

    const limit = settingsService.addBudgetLimit({
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      period: newBudget.period,
      notificationThreshold: parseInt(newBudget.threshold),
      isActive: true,
    });

    const currentSettings = settingsService.getSettings();
    setSettings(currentSettings);
    setNewBudget({
      category: "food",
      limit: "",
      period: "monthly",
      threshold: "80",
    });

    toast({
      title: "Budget Limit Added",
      description: `Budget limit for ${limit.category} has been set.`,
    });
  };

  const deleteRecurringExpense = (id: string) => {
    settingsService.deleteRecurringExpense(id);
    const currentSettings = settingsService.getSettings();
    setSettings(currentSettings);

    toast({
      title: "Deleted",
      description: "Recurring expense has been removed.",
    });
  };

  const deleteBudgetLimit = (id: string) => {
    settingsService.deleteBudgetLimit(id);
    const currentSettings = settingsService.getSettings();
    setSettings(currentSettings);

    toast({
      title: "Deleted",
      description: "Budget limit has been removed.",
    });
  };

  if (!settings) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 light:bg-black/10 light:border-black/20 light:text-black light:hover:bg-black/20"
          onClick={() => console.log("Settings button clicked")}
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings & Preferences
          </DialogTitle>
          <DialogDescription>
            Customize your expense tracking experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="smart">Smart Features</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Theme Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: any) =>
                      handleSettingChange("theme", value)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Date Format</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose how dates are displayed
                    </p>
                  </div>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value: any) =>
                      handleSettingChange("dateFormat", value)
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Currency Settings */}
          <TabsContent value="currency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Currency Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Primary Currency</Label>
                    <p className="text-sm text-muted-foreground">
                      All amounts will be displayed in this currency
                    </p>
                  </div>
                  <Select
                    value={settings.currency.code}
                    onValueChange={(value) => {
                      const currency = SUPPORTED_CURRENCIES.find(
                        (c) => c.code === value,
                      );
                      if (currency) {
                        handleSettingChange("currency", currency);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span>{currency.symbol}</span>
                            <span>{currency.code}</span>
                            <span className="text-muted-foreground">
                              - {currency.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Selection</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">
                      {settings.currency.symbol}
                    </div>
                    <div>
                      <div className="font-medium">
                        {settings.currency.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {settings.currency.code} • Rate:{" "}
                        {settings.currency.rate}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Features */}
          <TabsContent value="smart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Smart Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-orange-500" />
                    <div>
                      <Label className="text-base">Budget Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when approaching budget limits
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.budgetReminders}
                    onCheckedChange={(checked) =>
                      handleSettingChange("budgetReminders", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    <div>
                      <Label className="text-base">Savings Suggestions</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive AI-powered suggestions to save money
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.savingsSuggestions}
                    onCheckedChange={(checked) =>
                      handleSettingChange("savingsSuggestions", checked)
                    }
                  />
                </div>

                {/* Budget Limits */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Budget Limits</h4>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-3 w-3" />
                      Add Limit
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    <div className="grid grid-cols-4 gap-2">
                      <Select
                        value={newBudget.category}
                        onValueChange={(value) =>
                          setNewBudget({ ...newBudget, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="transportation">
                            Transport
                          </SelectItem>
                          <SelectItem value="entertainment">
                            Entertainment
                          </SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Limit amount"
                        value={newBudget.limit}
                        onChange={(e) =>
                          setNewBudget({ ...newBudget, limit: e.target.value })
                        }
                      />
                      <Select
                        value={newBudget.threshold}
                        onValueChange={(value) =>
                          setNewBudget({ ...newBudget, threshold: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="70">70% Alert</SelectItem>
                          <SelectItem value="80">80% Alert</SelectItem>
                          <SelectItem value="90">90% Alert</SelectItem>
                          <SelectItem value="100">100% Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={addBudgetLimit}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {settings.budgetLimits.map((limit) => (
                      <div
                        key={limit.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium capitalize">
                              {limit.category}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {settingsService.formatCurrency(limit.limit)}{" "}
                              {limit.period} • {limit.notificationThreshold}%
                              alert
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBudgetLimit(limit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recurring Expenses */}
          <TabsContent value="recurring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Recurring Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Add New Recurring Expense</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Description"
                      value={newRecurring.description}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          description: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Amount"
                      type="number"
                      value={newRecurring.amount}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          amount: e.target.value,
                        })
                      }
                    />
                    <Select
                      value={newRecurring.category}
                      onValueChange={(value) =>
                        setNewRecurring({ ...newRecurring, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="housing">Housing</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="subscriptions">
                          Subscriptions
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newRecurring.frequency}
                      onValueChange={(value: any) =>
                        setNewRecurring({ ...newRecurring, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addRecurringExpense} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recurring Expense
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Current Recurring Expenses</h4>
                  {settings.recurringExpenses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recurring expenses set up yet
                    </p>
                  ) : (
                    settings.recurringExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Repeat className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">
                              {expense.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {settingsService.formatCurrency(expense.amount)} •{" "}
                              {expense.frequency} • {expense.category}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={expense.isActive ? "default" : "secondary"}
                          >
                            {expense.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRecurringExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
