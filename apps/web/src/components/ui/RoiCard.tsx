'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShieldCheck } from "lucide-react";

interface RoiData {
  totalSaved: number;
  breakdown: Array<{
    category: string;
    count: number;
    saved: number;
  }>;
}

export default function RoiCard({ data }: { data: RoiData | null }) {
  // Format currency: "$12,500"
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!data) return <div className="animate-pulse h-40 bg-zinc-900 rounded-xl" />;

  return (
    <Card className="bg-zinc-950 border-zinc-800 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          ESTIMATED COST AVOIDANCE (24H)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {formatMoney(data.totalSaved)}
          </span>
          <span className="text-sm text-emerald-500 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            +12% vs yesterday
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Calculated based on industry average incident response costs.
        </p>
        
        {/* Optional: Mini Breakdown of Top Saver */}
        {data.breakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-900">
                <div className="flex justify-between text-xs text-zinc-300">
                    <span>Top Threat Blocked:</span>
                    <span className="text-white">{data.breakdown[0].category}</span>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}