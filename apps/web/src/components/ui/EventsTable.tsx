"use client"

import { useState } from "react"
import { IDSEvent } from "@/types/events"
import { EventDetails } from "./EventDetails"
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
import { motion, AnimatePresence } from "framer-motion";

interface EventsTableProps {
  // changed from unknown to the specific type
  data: IDSEvent[];
  isLoading: boolean;
}

export default function EventsTable({ data, isLoading }: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<IDSEvent | null>(null)
  
  if (isLoading) {
    return <div className="p-10 text-muted-foreground animate-pulse">Loading Intelligence...</div>
  }

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          {/* Read length directly from props */}
          <CardTitle>Live Traffic Feed ({data?.length || 0} Events)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Signature</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Proto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
              {(data || []).map((event, i) => (
                <motion.tr
                  key={ i || event.timestamp} // Ensure you have a unique key!
                  initial={{ opacity: 0, y: -20 }} // Start slightly above and invisible
                  animate={{ opacity: 1, y: 0 }}   // Fade in and slide down
                  exit={{ opacity: 0 }}            // If removed, fade out
                  transition={{ duration: 0.3 }}
                  className="hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.alert_severity === 1 ? "destructive" : "secondary"}>
                      Sev {event.alert_severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {event.event_type === 'alert' ? event.alert_signature : 'Network Flow'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.src_ip}:{event.src_port}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {event.dest_ip}:{event.dest_port}
                  </TableCell>
                  <TableCell className="text-xs uppercase">{event.proto}</TableCell>
                </motion.tr>
              ))}
              </AnimatePresence>
              {/* Optional: Handle empty state */}
              {!isLoading && data?.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="h-24 text-center">
                     No events detected.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    
      <EventDetails 
        event={selectedEvent} 
        open={!!selectedEvent} 
        onOpenChange={(open) => !open && setSelectedEvent(null)} 
      />
    </div>
  )
}