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
import { Activity, Clock } from "lucide-react"

interface IncidentsTableProps {
  data: IDSIncident[];
  isLoading: boolean;
}

export default function IncidentsTable({ data, isLoading }: IncidentsTableProps) {
  
  // Helper to calculate duration (e.g., "5m 20s")
  const getDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins === 0) return "< 1m";
    return `${diffMins}m`;
  }

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Analyzing Incidents...</div>
  }

  return (
    <Card className="w-full border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Activity className="h-5 w-5 text-red-500" />
           Active Incidents (Last 24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Attacker</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {(data || []).map((incident, i) => (
                <motion.tr
                  key={`${incident.src_ip}-${incident.alert_signature}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <Badge variant={incident.alert_severity === 1 ? "destructive" : "outline"}>
                      Sev {incident.alert_severity}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold">{incident.src_ip}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {incident.src_country_code !== 'XX' && (
                            <Flag code={incident.src_country_code} height="10" width="16" />
                        )}
                        <span className="text-xs text-muted-foreground">{incident.src_country}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-sm">
                    {incident.alert_signature}
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Duration: {getDuration(incident.first_seen, incident.last_seen)}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-center bg-accent text-accent-foreground rounded-full px-2.5 py-0.5 text-xs font-bold">
                      {incident.count}
                    </div>
                  </TableCell>

                  <TableCell className="text-right text-xs text-muted-foreground font-mono">
                    {new Date(incident.last_seen).toLocaleTimeString([], { hour12: false })}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
            {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No active incidents.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}