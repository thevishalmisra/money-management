import React from "react";
import { Link } from "react-router-dom";
import { Home, Wallet } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center px-4">
      <Card className="w-full max-w-md expense-card">
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="h-10 w-10 text-white" />
            </div>

            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-white">404</h1>
              <h2 className="text-xl font-semibold text-white">
                Page Not Found
              </h2>
              <p className="text-white/70">
                Oops! The page you're looking for doesn't exist. Let's get you
                back to tracking your expenses.
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
