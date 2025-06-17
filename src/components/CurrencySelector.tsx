import React, { useState, useEffect } from "react";
import { DollarSign, Check } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { SUPPORTED_CURRENCIES, Currency } from "../types/settings";
import { settingsService } from "../lib/settings";
import { cn } from "../lib/utils";

export function CurrencySelector() {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(
    SUPPORTED_CURRENCIES[0],
  );

  useEffect(() => {
    const settings = settingsService.getSettings();
    if (settings?.currency) {
      setCurrentCurrency(settings.currency);
    }
  }, []);

  const handleCurrencyChange = (currency: Currency) => {
    settingsService.updateSetting("currency", currency);
    setCurrentCurrency(currency);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 min-w-[100px] transition-all duration-200",
            "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white",
            "dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 dark:hover:text-white",
            "light:bg-black/10 light:border-black/20 light:text-black light:hover:bg-black/20 light:hover:text-black",
          )}
        >
          <span className="text-lg font-bold">{currentCurrency.symbol}</span>
          <span className="hidden sm:inline">{currentCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[250px]">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_CURRENCIES.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleCurrencyChange(currency)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currentCurrency.code === currency.code && "bg-accent",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold w-8">{currency.symbol}</span>
              <div>
                <div className="font-medium">{currency.code}</div>
                <div className="text-sm text-muted-foreground">
                  {currency.name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currency.rate !== 1 && (
                <Badge variant="secondary" className="text-xs">
                  {currency.rate}
                </Badge>
              )}
              {currentCurrency.code === currency.code && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Current: {currentCurrency.name} ({currentCurrency.symbol})
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
