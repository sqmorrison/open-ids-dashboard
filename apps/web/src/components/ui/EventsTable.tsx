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
              {/* Added safe check (data || []) to prevent crash if data is undefined */}
              {(data || []).map((event, i) => (
                <TableRow 
                  // If IDSEvent has a unique ID (e.g. event.id), use that instead of 'i'
                  key={i} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors" 
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
                </TableRow>
              ))}
              
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