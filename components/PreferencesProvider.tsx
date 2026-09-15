"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface PreferencesContextType {
  darkMode: boolean;
  largeText: boolean;
  toggleDarkMode: () => void;
  toggleLargeText: () => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  darkMode: false,
  largeText: false,
  toggleDarkMode: () => {},
  toggleLargeText: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [largeText, setLargeText] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Load from local storage or session preferences
    const storedDark = localStorage.getItem("medtrack_dark_mode");
    const storedLarge = localStorage.getItem("medtrack_large_text");

    const isDark =
      storedDark !== null
        ? storedDark === "true"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : !!(session?.user as any)?.darkModePref;

    const isLarge =
      storedLarge !== null
        ? storedLarge === "true"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : !!(session?.user as any)?.largeTextPref;

    setDarkMode(isDark);
    setLargeText(isLarge);
    setMounted(true);
  }, [session]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("medtrack_dark_mode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("medtrack_dark_mode", "false");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (largeText) {
      root.classList.add("large-text");
      localStorage.setItem("medtrack_large_text", "true");
    } else {
      root.classList.remove("large-text");
      localStorage.setItem("medtrack_large_text", "false");
    }
  }, [largeText, mounted]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);

  return (
    <PreferencesContext.Provider
      value={{ darkMode, largeText, toggleDarkMode, toggleLargeText }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
