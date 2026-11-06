"use client";
import { LiquidAccordion, type LiquidAccordionItem } from "@/components/ui/liquid-glass-accordion";
import { useMarketplaceTheme } from "@/components/theme-provider";
export default function MarketplaceFAQ({items}:{items:LiquidAccordionItem[]}) {
  const {theme}=useMarketplaceTheme();
  return <LiquidAccordion items={items} defaultOpen={0} tone={theme} sound={false} className="!max-w-[650px]" />;
}
