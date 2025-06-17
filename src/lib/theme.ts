export type Theme = "light" | "dark" | "system";

export class ThemeManager {
  private storageKey = "expense-tracker-theme";
  private currentTheme: Theme = "system";

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.storageKey) as Theme;
    this.currentTheme = savedTheme || "system";
    this.applyTheme(this.currentTheme);
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme;
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public applyTheme(theme: Theme) {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (this.currentTheme === "system") {
          root.classList.remove("light", "dark");
          root.classList.add(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
    }
  }

  public toggleTheme() {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  public isDarkMode(): boolean {
    if (this.currentTheme === "dark") return true;
    if (this.currentTheme === "light") return false;

    // System mode - check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}

export const themeManager = new ThemeManager();
