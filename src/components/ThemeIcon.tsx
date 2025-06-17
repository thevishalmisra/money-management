import React, { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { themeManager, Theme } from "../lib/theme";

export function ThemeIcon() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(themeManager.getTheme());
  }, []);

  const handleThemeToggle = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    themeManager.setTheme(newTheme);
    setTheme(newTheme);
  };

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getThemeLabel = (currentTheme: Theme) => {
    switch (currentTheme) {
      case "light":
        return "Light Mode";
      case "dark":
        return "Dark Mode";
      default:
        return "System Mode";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleThemeToggle}
      className="h-10 w-10 p-0 text-white hover:bg-white/10 dark:text-white dark:hover:bg-white/10 light:text-black light:hover:bg-black/10 rounded-full transition-all duration-200"
      title={`Current: ${getThemeLabel(theme)} - Click to switch`}
    >
      {getThemeIcon(theme)}
    </Button>
  );
}
