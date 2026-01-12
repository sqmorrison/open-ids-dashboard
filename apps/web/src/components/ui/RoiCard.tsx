"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShieldCheck, DollarSign } from "lucide-react";
import { useRiskProfile } from "@/hooks/UseRiskProfile";
import { RiskSettingsDialog } from "@/components/ui/RiskSettings";

interface RoiCardProps {
  criticalCount: number; // Raw count of Critical alerts (e.g. 12)
  highCount: number;     // Raw count of High alerts (e.g. 45)
}

export default function RoiCard({ criticalCount, highCount }: RoiCardProps) {
  const { calculateROI, isLoaded } = useRiskProfile();

  // Show a skeleton loader while we fetch settings from LocalStorage
  if (!isLoaded) {
    return <div className="animate-pulse h-40 bg-muted rounded-xl" />;
  }

  // Calculate live values based on user settings
  const { totalValue, laborSavings, downtimeSavings } = calculateROI(criticalCount, highCount);

  // Format currency: "$12,500"
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="flex flex-col justify-between shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          ESTIMATED VALUE (24H)
        </CardTitle>
        {/* The Configuration Modal */}
        <RiskSettingsDialog />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">
            {formatMoney(totalValue)}
          </span>
          <span className="text-sm text-emerald-500 flex items-center font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />
            Active
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-2 mb-4">
          Projected savings based on your risk configuration.
        </p>
        
        {/* Breakdown Section */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Risk Avoidance
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(downtimeSavings)}
            </span>
          </div>
          
          <div className="flex flex-col gap-1 border-l border-border pl-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Labor Saved
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatMoney(laborSavings)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}