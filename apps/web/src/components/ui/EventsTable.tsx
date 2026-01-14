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
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import Flag from "react-world-flags"
import { AiAnalysis } from "@/components/ui/AiAnalysis"
import { Eye, ShieldAlert, FileJson, Copy, Check } from "lucide-react"
import { formatToLocal } from "@/lib/formatDate"

// Extend type to include the raw_json field we need
interface ExtendedIDSEvent extends IDSEvent {
  payload_printable?: string; 
  raw_json?: string; // <--- ADDED THIS
}

interface EventsTableProps {
  data: ExtendedIDSEvent[];
  isLoading: boolean;
}

export default function EventsTable({ data, isLoading }: EventsTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<ExtendedIDSEvent | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper to copy raw JSON
  const handleCopy = () => {
    if (!selectedEvent) return;
    const textToCopy = selectedEvent.raw_json 
      ? JSON.stringify(JSON.parse(selectedEvent.raw_json), null, 2) 
      : JSON.stringify(selectedEvent, null, 2);
      
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-zinc-950 border-zinc-800">
         <CardHeader><CardTitle className="text-zinc-100">Live Traffic Feed</CardTitle></CardHeader>
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
      <Card className="w-full bg-zinc-950 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Traffic Feed ({data?.length || 0} Events)</CardTitle>
            <Badge variant="outline" className="animate-pulse text-emerald-500 border-emerald-500">
              ● Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="hover:bg-transparent border-zinc-800">
                <TableHead className="w-32 text-zinc-400">Time</TableHead>
                <TableHead className="w-24 text-zinc-400">Severity</TableHead>
                <TableHead className="text-zinc-400">Signature</TableHead>
                <TableHead className="w-48 text-zinc-400">Source</TableHead>
                <TableHead className="text-zinc-400">Destination</TableHead>
                <TableHead className="w-16 text-right text-zinc-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false} mode="popLayout">
                {(data || []).map((event, i) => (
                  <motion.tr
                    layout
                    key={event.timestamp + i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-zinc-900/50 transition-colors group border-zinc-800"
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap text-zinc-500">
                      {formatToLocal(event.timestamp)}
                    </TableCell>
                    
                    <TableCell>
                      <SeverityBadge severity={event.alert_severity} />
                    </TableCell>
                    
                    <TableCell className="font-medium text-sm text-zinc-300 truncate max-w-[300px]" title={event.alert_signature}>
                       {event.alert_signature}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-zinc-200 font-semibold">
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
                                <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                                    {event.src_country}
                                </span>
                                </>
                            ) : (
                                <span className="text-[10px] text-zinc-600 italic">Internal</span>
                            )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-500 font-mono">
                      {event.dest_ip}:{event.dest_port}
                    </TableCell>
                    
                    <TableCell className="text-right">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 w-8 p-0 hover:bg-zinc-800 hover:text-white"
                         onClick={() => setSelectedEvent(event)}
                       >
                         <Eye className="h-4 w-4 text-zinc-500" />
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

      {/* EVENT DETAILS MODAL */}
      <Dialog 
        open={!!selectedEvent} 
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-lg">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    Threat Intelligence Detail
                </DialogTitle>
                <Button variant="outline" size="sm" onClick={handleCopy} className="mr-8 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                    {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                    {copied ? "Copied" : "Copy Raw JSON"}
                </Button>
            </div>
            <DialogDescription className="text-zinc-500">
                Analysis of captured event signature and raw payload.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              
              {/* 1. AI ANALYSIS SECTION */}
              <div className="bg-indigo-950/10 p-4 rounded-lg border border-indigo-500/20">
                 <h4 className="text-sm font-semibold mb-2 text-indigo-400 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                   AI Co-Pilot 
                 </h4>
                 <AiAnalysis event={selectedEvent} />
              </div>

              {/* 2. STANDARD DETAILS */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Source</span>
                  <span className="font-mono text-zinc-200 font-semibold">{selectedEvent.src_ip}:{selectedEvent.src_port}</span>
                  <div className="text-xs text-zinc-500 mt-1">{selectedEvent.src_country} ({selectedEvent.src_country_code})</div>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Destination</span>
                  <span className="font-mono text-zinc-200 font-semibold">{selectedEvent.dest_ip}:{selectedEvent.dest_port}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-800 mt-2">
                  <span className="text-zinc-500 block text-xs uppercase tracking-wider mb-1">Signature</span>
                  <span className="font-medium text-red-400">{selectedEvent.alert_signature}</span>
                </div>
              </div>

              {/* 3. RAW JSON EXPLORER */}
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <FileJson className="w-4 h-4 text-emerald-500" />
                    <span className="text-zinc-500 text-xs uppercase tracking-wider">Raw Payload / JSON</span>
                 </div>
                 
                 <ScrollArea className="h-62.5 w-full rounded-md border border-zinc-800 bg-zinc-950 p-4">
                   <pre className="text-[11px] font-mono leading-relaxed text-emerald-500/90 whitespace-pre-wrap break-all">
                     {selectedEvent.raw_json 
                        ? JSON.stringify(JSON.parse(selectedEvent.raw_json), null, 2) 
                        : JSON.stringify(selectedEvent, null, 2) // Fallback if raw_json missing
                     }
                   </pre>
                 </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SeverityBadge({ severity }: { severity?: number }) {
  if (severity === 1) return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10 text-[10px]">CRITICAL</Badge>;
  if (severity === 2) return <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10 text-[10px]">HIGH</Badge>;
  return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10 text-[10px]">INFO</Badge>;
}