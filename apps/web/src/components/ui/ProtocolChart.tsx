"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Network } from "lucide-react"

// Interface to satisfy Recharts and ESLint
interface ProtocolData {
  name: string;
  value: number;
  [key: string]: string | number | undefined; 
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

export default function ProtocolChart({ data }: { data: ProtocolData[] }) {
  
  const totalEvents = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className="w-full bg-zinc-950 border-zinc-800 text-zinc-100 flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
                <Network className="h-4 w-4 text-violet-500" />
                Top Protocols
            </CardTitle>
            
            {/* MOVED: Total Count is now a clean metric in the top right */}
            <div className="text-right">
                <span className="text-2xl font-bold text-zinc-100 block leading-none">
                    {totalEvents.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Total Events
                </span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-[200px]">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}  // Slightly thinner ring
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px' }}
                itemStyle={{ color: '#e4e4e7' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}