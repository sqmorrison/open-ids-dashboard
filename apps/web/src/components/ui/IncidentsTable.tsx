"use client"

import { IDSIncident } from "@/types/events"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import Flag from "react-world-flags"
import { Activity, Clock, ShieldAlert } from "lucide-react"
import { formatToLocal } from "@/lib/formatDate";

interface IncidentsTableProps {
  data: IDSIncident[];
  isLoading: boolean;
}

export default function IncidentsTable({ data, isLoading }: IncidentsTableProps) {
  
  // Robust duration calculator
  const getDuration = (start: string | number, end: string | number) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    
    if (isNaN(s) || isNaN(e)) return "--";

    const diffMs = e - s;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return "< 1m";
    if (diffMins > 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    }
    return `${diffMins}m`;
  }

  if (isLoading) {
    return (
      <Card className="w-full bg-zinc-950 border-zinc-800">
         <CardHeader><CardTitle className="text-zinc-100">Aggregated Incidents</CardTitle></CardHeader>
         <CardContent>
           <div className="p-10 text-center text-muted-foreground animate-pulse">
             Aggregating Attack Patterns...
           </div>
         </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <ShieldAlert className="h-5 w-5 text-red-500" />
           Top Talkers (Last 24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="w-24 text-zinc-400">Severity</TableHead>
              <TableHead className="w-48 text-zinc-400">Attacker</TableHead>
              <TableHead className="text-zinc-400">Signature</TableHead>
              <TableHead className="text-right text-zinc-400">Count</TableHead>
              <TableHead className="text-right text-zinc-400">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {(data || []).map((incident) => (
                <motion.tr
                  key={`${incident.src_ip}-${incident.alert_signature}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-zinc-900/50 border-zinc-800 transition-colors"
                >
                  <TableCell>
                    <Badge variant="outline" className={
                        incident.alert_severity === 1 
                        ? "border-red-500 text-red-500 bg-red-500/10" 
                        : "border-orange-500 text-orange-500 bg-orange-500/10"
                    }>
                      Sev {incident.alert_severity}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-zinc-200">{incident.src_ip}</span>
                      <div className="flex items-center gap-1.5 mt-1 opacity-70">
                        {incident.src_country_code && incident.src_country_code !== 'XX' && (
                            <Flag 
                                code={incident.src_country_code} 
                                height="10" 
                                width="16" 
                                className="object-contain rounded-[1px]" 
                            />
                        )}
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                            {incident.src_country}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-sm text-zinc-300">
                    {incident.alert_signature}
                    <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      Duration: {getDuration(incident.first_seen, incident.last_seen)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-center bg-zinc-800 text-zinc-200 rounded px-2 py-0.5 text-xs font-bold min-w-[30px]">
                      {incident.count}
                    </span>
                  </TableCell>

                  <TableCell className="text-right text-xs text-zinc-500 font-mono">
                    {formatToLocal(incident.last_seen)}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
            
            {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No active incidents detected.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}