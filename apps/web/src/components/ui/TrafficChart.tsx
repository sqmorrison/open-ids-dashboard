'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrafficData {
  time: string;
  count: number;
}

export default function TrafficChart({ data }: { data: TrafficData[] }) {

  // Helper 1: Format for the X-Axis (e.g. "10:45")
  const formatAxis = (timeStr: string) => {
    if (!timeStr) return "";
    // Safety: Treat missing offsets as UTC
    const safeTime = timeStr.endsWith("Z") || timeStr.includes("+") ? timeStr : `${timeStr}Z`;
    
    return new Date(safeTime).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Set to true if you want "10:45 PM"
    });
  };

  // Helper 2: Format for the Tooltip (e.g. "Jan 14, 10:45:00 AM")
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
      <CardHeader>
        <CardTitle className="text-zinc-100">Network Traffic (Last Hour)</CardTitle>
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
              
              {/* UPDATED XAxis */}
              <XAxis 
                dataKey="time" 
                tickFormatter={formatAxis} 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              
              <YAxis 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              
              {/* UPDATED Tooltip */}
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}