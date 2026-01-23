"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

interface SignalData {
  time_label: string;
  signal: number;
  noise: number;
}

interface SignalChartProps {
  data: SignalData[];
}

export default function SignalChart({ data }: SignalChartProps) {
  
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr.endsWith('Z') ? timeStr : timeStr + 'Z');
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    };
  
  return (
    <Card className="w-full bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-500" />
            Signal vs. Noise (Max Last 4h)
        </CardTitle>
        <CardDescription className="text-zinc-500">
            Comparing critical threats (Red) against background chatter (Grey)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              
              <XAxis 
                dataKey="raw_time" 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30} 
                tickFormatter={formatTime}
              />
              
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false} 
                width={40}
              />
              
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                itemStyle={{ fontSize: '12px' }}
                cursor={{ fill: '#27272a', opacity: 0.4 }}
              />
              
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {/* STACK 1: NOISE (Bottom Layer) */}
              <Bar 
                dataKey="noise" 
                name="Noise (Info/Low)" 
                stackId="a" 
                fill="#3f3f46" // zinc-700
                radius={[0, 0, 4, 4]}
              />

              {/* STACK 2: SIGNAL (Top Layer) */}
              <Bar 
                dataKey="signal" 
                name="Signal (Critical/High)" 
                stackId="a" 
                fill="#ef4444" // red-500
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}