/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{theme: Theme; setTheme: (value: Theme) => void}>({theme:"light",setTheme:()=>{}});
export const useMarketplaceTheme = () => useContext(ThemeContext);

export default function ThemeProvider({children}:{children:React.ReactNode}) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    let next: Theme = "light";
    try {
      const stored = localStorage.getItem("kmitl-theme");
      next = stored === "dark" || stored === "light" ? stored : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch { /* storage can be blocked */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(next);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem("kmitl-theme",theme); } catch { /* optional */ }
  },[theme]);
  return <ThemeContext.Provider value={{theme,setTheme}}>{children}</ThemeContext.Provider>;
}
