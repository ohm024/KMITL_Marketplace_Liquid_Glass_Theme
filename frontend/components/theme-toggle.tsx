"use client";
import { LiquidToggle, NimbusToggleIcons } from "@/components/ui/liquid-glass-toggle";
import { useMarketplaceTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme } = useMarketplaceTheme();
  const dark = theme === "dark";
  return <div className="flex items-center gap-2" title={dark ? "โหมดกลางคืน" : "โหมดกลางวัน"}>
    <LiquidToggle size={35} tone={dark ? "dark" : "light"} checked={dark}
      onCheckedChange={(checked)=>setTheme(checked ? "dark" : "light")}
      icons={{off:NimbusToggleIcons.sun,on:NimbusToggleIcons.moon}}
      label="สลับโหมดกลางวันและกลางคืน" />
  </div>;
}
