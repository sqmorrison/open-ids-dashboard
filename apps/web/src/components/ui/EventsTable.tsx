"use client"

import { useState } from "react"
import { IDSEvent } from "@/types/events"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Removed DialogTrigger
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import Flag from "react-world-flags"
import { AiAnalysis } from "@/components/ui/AiAnalysis";
import { Button } from "@/components/ui/button";
import { Eye, ShieldAlert } from "lucide-react";
import { formatToLocal } from "@/lib/formatDate";

interface ExtendedIDSEvent extends IDSEvent {
  payload_printable?: string; 
}

interface EventsTableProps {
  data: ExtendedIDSEvent[];
  isLoading: boolean;
}

export default function EventsTable({ data, isLoading }: EventsTableProps) {
  // 1. STATE LIFTED UP: This holds the event the user is looking at.
  // It survives re-renders of the 'data' prop.
  const [selectedEvent, setSelectedEvent] = useState<ExtendedIDSEvent | null>(null);

  if (isLoading) {
    return (
      <Card className="w-full">
         <CardHeader><CardTitle>Live Traffic Feed</CardTitle></CardHeader>
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
            <Badge variant="outline" className="animate-pulse text-green-500 border-green-500">
              ● Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Time</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead>Signature</TableHead>
                <TableHead className="w-48">Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead className="w-16 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false} mode="popLayout">
                {(data || []).map((event, i) => (
                  <motion.tr
                    layout
                    key={event.timestamp + i} // Unique key
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {formatToLocal(event.timestamp)}
                    </TableCell>
                    
                    <TableCell>
                      <SeverityBadge severity={event.alert_severity} />
                    </TableCell>
                    
                    <TableCell className="font-medium text-sm truncate max-w-[300px]" title={event.alert_signature}>
                       {event.alert_signature}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-foreground font-semibold">
                          {event.src_ip}:{event.src_port}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {event.src_country_code && event.src_country_code !== 'XX' ? (
                                <>
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
                                </>
                            ) : (
                                <span className="text-[10px] text-muted-foreground italic">Internal</span>
                            )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {event.dest_ip}:{event.dest_port}
                    </TableCell>
                    
                    <TableCell className="text-right">
                       {/* 2. THE BUTTON: Only updates state now */}
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 w-8 p-0 hover:bg-muted"
                         onClick={() => setSelectedEvent(event)}
                       >
                         <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                       </Button>
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

      {/* 3. THE DIALOG: Lives outside the loop. Controlled by selectedEvent state. */}
      <Dialog 
        open={!!selectedEvent} 
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Event Analysis
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* AI SECTION */}
              <div className="bg-muted/30 p-4 rounded-lg border border-indigo-500/20">
                 <h4 className="text-sm font-semibold mb-2 text-indigo-400 flex items-center gap-2">
                    AI Co-Pilot 
                    <span className="text-[10px] font-normal text-muted-foreground">(Local Model)</span>
                 </h4>
                 {/* Pass the static event data. It won't change even if the background table updates. */}
                 <AiAnalysis event={selectedEvent} />
              </div>

              {/* Standard Raw Data */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-card border rounded-md p-4">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Source</span>
                  <span className="font-mono text-foreground font-semibold">{selectedEvent.src_ip}:{selectedEvent.src_port}</span>
                  <div className="text-xs text-muted-foreground mt-1">{selectedEvent.src_country} ({selectedEvent.src_country_code})</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Destination</span>
                  <span className="font-mono text-foreground font-semibold">{selectedEvent.dest_ip}:{selectedEvent.dest_port}</span>
                </div>
                <div className="col-span-2 pt-2 border-t mt-2">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Signature</span>
                  <span className="font-medium text-destructive">{selectedEvent.alert_signature}</span>
                </div>
              </div>

              {/* Payload Dump */}
              {selectedEvent.payload_printable ? (
                <div>
                   <span className="text-muted-foreground block text-xs mb-1 uppercase tracking-wider">Payload / Packet Dump</span>
                   <pre className="bg-zinc-950 border border-zinc-800 p-3 rounded-md text-[10px] font-mono overflow-x-auto text-green-500/90 whitespace-pre-wrap">
                     {selectedEvent.payload_printable}
                   </pre>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">No payload data captured for this event.</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SeverityBadge({ severity }: { severity?: number }) {
  if (severity === 1) return <Badge variant="destructive" className="text-[10px]">CRITICAL</Badge>;
  if (severity === 2) return <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px]">HIGH</Badge>;
  return <Badge variant="secondary" className="text-[10px]">INFO</Badge>;
}