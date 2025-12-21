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
import { motion, AnimatePresence } from "framer-motion"
import Flag from "react-world-flags"

interface EventsTableProps {
  data: IDSEvent[];
  isLoading: boolean;
}

export default function EventsTable({ data, isLoading }: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<IDSEvent | null>(null)
  
  if (isLoading) {
    return (
      <Card className="w-full">
         <CardHeader>
           <CardTitle>Live Traffic Feed</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="p-10 text-center text-muted-foreground animate-pulse">
             Initializing Intelligence Feed...
           </div>
         </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Traffic Feed ({data?.length || 0} Events)</CardTitle>
            {/* Optional: Add a little live indicator */}
            <Badge variant="outline" className="animate-pulse text-green-500 border-green-500">
              ● Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Signature</TableHead>
                <TableHead className="w-[200px]">Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="w-[80px]">Proto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false} mode="popLayout">
                {(data || []).map((event, i) => (
                  <motion.tr
                    layout // Smoothly adjust layout when items move
                    key={event.timestamp + i} // Unique key combination
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={event.alert_severity === 1 ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        Sev {event.alert_severity}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="font-medium text-sm">
                      <div className="flex flex-col">
                         <span>{event.event_type === 'alert' ? event.alert_signature : 'Network Flow'}</span>
                         {/* Optional: Show category if available in future */}
                      </div>
                    </TableCell>

                    {/* UPDATED SOURCE COLUMN */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-foreground font-semibold">
                          {event.src_ip}:{event.src_port}
                        </span>
                        
                        {/* Only render flag if we have a valid country code */}
                        {event.src_country_code && event.src_country_code !== 'XX' ? (
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Flag 
                              code={event.src_country_code} 
                              height="10" 
                              width="16" 
                              className="object-contain shadow-sm rounded-[1px]" 
                              fallback={null}
                            />
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {event.src_country}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            Internal / Local
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {event.dest_ip}:{event.dest_port}
                    </TableCell>
                    
                    <TableCell className="text-xs uppercase font-semibold text-muted-foreground">
                      {event.proto}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              
              {!isLoading && data?.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                     No threats detected. System is clean.
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