'use client';

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Assuming standard shadcn button

interface TrafficData {
  time: string;
  count: number;
}

interface TrafficChartProps {
  data: TrafficData[];
  onTimeRangeChange?: (range: '1H' | '12H' | '24H') => void;
}

export default function TrafficChart({ data, onTimeRangeChange }: TrafficChartProps) {
  const [range, setRange] = useState<'1H' | '12H' | '24H'>('1H');

  const handleRangeChange = (newRange: '1H' | '12H' | '24H') => {
    setRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
  };

  // Helper 1: Format for the X-Axis
  const formatAxis = (timeStr: string) => {
    if (!timeStr) return "";
    const safeTime = timeStr.endsWith("Z") || timeStr.includes("+") ? timeStr : `${timeStr}Z`;
    
    return new Date(safeTime).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Helper 2: Format for the Tooltip
  const formatTooltip = (timeStr: string) => {
    if (!timeStr) return "";
    const safeTime = timeStr.endsWith("Z") || timeStr.includes("+") ? timeStr : `${timeStr}Z`;

    return new Date(safeTime).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className="col-span-4 lg:col-span-3 bg-zinc-950 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-zinc-100 text-base font-medium">
          Network Traffic ({range})
        </CardTitle>
        
        {/* Time Interval Toggles */}
        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-md border border-zinc-800">
          {(['1H', '12H', '24H'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`
                px-3 py-1 text-xs font-medium rounded transition-all
                ${range === r 
                  ? "bg-zinc-800 text-zinc-100 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pl-2">
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              
              <XAxis 
                dataKey="time" 
                tickFormatter={formatAxis} 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                // Increase gap for 24H view so labels don't overlap
                minTickGap={range === '24H' ? 50 : 30} 
              />
              
              <YAxis 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
                labelFormatter={formatTooltip}
                itemStyle={{ color: '#ef4444' }}
              />
              
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                // Smooth out the curve slightly less if looking at 24H of data
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}