"use client";
import { type ReactNode, useEffect } from "react";

const THEME_STORAGE_KEY = "spectres:theme";

export type Theme = "light" | "dark";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function readCurrentTheme(): Theme {
  const applied = document.documentElement.dataset.theme;
  if (isTheme(applied)) return applied;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(saved) ? saved : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(saved)) document.documentElement.dataset.theme = saved;
  }, []);

  return children;
}
