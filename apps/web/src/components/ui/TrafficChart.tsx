'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns'; // Make sure to install date-fns if you haven't: npm i date-fns

interface TrafficData {
  time: string;
  count: number;
}

export default function TrafficChart({ data }: { data: TrafficData[] }) {
  return (
    <Card className="col-span-4 lg:col-span-3 bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Network Traffic (Last Hour)</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
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
                tickFormatter={(time) => format(new Date(time), 'HH:mm')}
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
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
                labelFormatter={(label) => format(new Date(label), 'MMM d, HH:mm:ss')}
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