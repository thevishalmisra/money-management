import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ExpenseSummary, MonthlyBudget } from "../types/expense";
import { categoryColors, categoryIcons } from "../lib/expenses";

interface ChartsProps {
  summary: ExpenseSummary;
  budgets: MonthlyBudget[];
}

export function Charts({ summary, budgets }: ChartsProps) {
  // Prepare data for category pie chart
  const categoryData = Object.entries(summary.expensesByCategory)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
      color: categoryColors[category as keyof typeof categoryColors],
      icon: categoryIcons[category as keyof typeof categoryIcons],
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare data for monthly trend
  const trendData = summary.monthlyTrend.map((item) => ({
    ...item,
    net: item.income - item.expenses,
  }));

  // Prepare budget data
  const budgetData = budgets
    .filter((budget) => budget.spent > 0 || budget.limit > 0)
    .map((budget) => ({
      category: budget.category,
      spent: budget.spent,
      limit: budget.limit,
      remaining: Math.max(0, budget.limit - budget.spent),
      percentage: Math.round(budget.percentage),
      color: categoryColors[budget.category],
      icon: categoryIcons[budget.category],
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span>{data.icon}</span>
            <span className="font-medium capitalize">{data.name}</span>
          </div>
          <p className="text-sm">
            Amount: ${data.value.toFixed(2)} (
            {((data.value / summary.totalExpenses) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>Income vs Expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="2"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Net Income Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Net Income</CardTitle>
                <CardDescription>Income minus expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="net" name="Net Income">
                      {trendData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.net >= 0 ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Distribution of your spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Amount spent per category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Amount">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {categoryData.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <span>{category.icon}</span>
                      </div>
                      <span className="font-medium capitalize">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${category.value.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(
                          (category.value / summary.totalExpenses) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Trend Analysis</CardTitle>
              <CardDescription>
                Track your financial patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                    name="Net Income"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>
                Track your spending against budget limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetData.map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{budget.icon}</span>
                        <span className="font-medium capitalize">
                          {budget.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          ${budget.spent.toFixed(2)} / $
                          {budget.limit.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs ${
                            budget.percentage > 100
                              ? "text-red-600"
                              : budget.percentage > 80
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {budget.percentage}% used
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budget.percentage > 100
                            ? "bg-red-500"
                            : budget.percentage > 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(budget.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
