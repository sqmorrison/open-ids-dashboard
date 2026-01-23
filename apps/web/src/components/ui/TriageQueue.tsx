"use client"

import { useState, useMemo } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Filter, Search, Calendar, Clock, X } from "lucide-react" 
import { formatToLocal } from "@/lib/formatDate"
import { TriageActions } from "./TriageActions"

interface TriageQueueProps {
  data: IDSEvent[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onSignatureSearch: (query: string) => void;
  onDateChange: (date: string) => void;
}

export default function TriageQueue({ 
  data, 
  onRefresh, 
  isRefreshing, 
  onSignatureSearch, 
  onDateChange 
}: TriageQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [sortBy, setSortBy] = useState<string>("severity")
  
  const [dateFilter, setDateFilter] = useState<string>("") 
  const [hourFilter, setHourFilter] = useState<string>("all") 
  
  const [searchTerm, setSearchTerm] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSignatureSearch(searchTerm)
    }
  }

  const clearDateFilters = () => {
    setDateFilter("")
    setHourFilter("all")
    // Reset server fetch to default (24h)
    onDateChange("") 
  }

  // Client-side filtering and sorting
    const processedData = useMemo(() => {
      let filtered = [...(data || [])];
  
      const getEventDate = (timestamp: string | number) => {
          // Safely convert to string first
          const tsStr = String(timestamp);
          // Append Z if missing to force UTC parsing
          const timeStr = tsStr.endsWith('Z') ? tsStr : tsStr + 'Z';
          return new Date(timeStr);
      };
  
      if (statusFilter === "active") {
        filtered = filtered.filter(e => ["New", "Investigating"].includes(e.current_status));
      } else if (statusFilter === "resolved") {
        filtered = filtered.filter(e => ["Resolved", "False Positive"].includes(e.current_status));
      }
  
      if (dateFilter) {
        filtered = filtered.filter(e => {
          const eventDate = getEventDate(e.timestamp);
          // Compare YYYY-MM-DD in local time
          const localYMD = eventDate.toLocaleDateString('en-CA'); 
          return localYMD === dateFilter;
        });
      }
  
      if (hourFilter !== "all") {
        const targetHour = parseInt(hourFilter);
        filtered = filtered.filter(e => {
          const eventDate = getEventDate(e.timestamp);
          // Now .getHours() will correctly return 7 for a 13:00 UTC event in CST
          return eventDate.getHours() === targetHour;
        });
      }
  
      filtered.sort((a, b) => {
        if (sortBy === "severity") {
          return (a.alert_severity || 3) - (b.alert_severity || 3);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  
      return filtered;
    }, [data, statusFilter, sortBy, dateFilter, hourFilter]);

  return (
    <Card className="w-full bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Incident Response Queue</CardTitle>
            <CardDescription className="text-zinc-500">Manage and resolve security alerts</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-3 mt-4 p-3 bg-zinc-900/30 rounded-md border border-zinc-800/50">
          
          <div className="flex flex-col md:flex-row gap-3">
             <div className="relative w-full md:flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Filter by Signature..."
                  className="pl-9 h-8 bg-zinc-950 border-zinc-800 text-xs w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
             </div>
             
             <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Closed</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-center border-t border-zinc-800/50 pt-3">
             <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider mr-auto md:mr-0">Time Travel:</span>
             
             <div className="relative flex items-center">
               <input 
                 type="date"
                 className="h-9 w-[145px] pl-3 pr-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs text-zinc-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all duration-200 [color-scheme:dark]"
                 value={dateFilter}
                 onChange={(e) => {
                     const val = e.target.value;
                     setDateFilter(val);
                     onDateChange(val); 
                 }}
               />
             </div>

             <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <Select value={hourFilter} onValueChange={setHourFilter} disabled={!dateFilter}>
                  <SelectTrigger className="w-[100px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    <SelectItem value="all">All Day</SelectItem>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                            {/* Display e.g. "07:00" */}
                            {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {(dateFilter || hourFilter !== 'all') && (
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearDateFilters}
                    className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 ml-auto md:ml-0"
                 >
                    <X className="w-3 h-3 mr-1" />
                    Clear Time
                 </Button>
             )}
          </div>

        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="w-24 text-zinc-400">Severity</TableHead>
              <TableHead className="w-32 text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Signature</TableHead>
              <TableHead className="w-48 text-zinc-400">Source</TableHead>
              <TableHead className="w-40 text-right text-zinc-400">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.map((event) => (
              <TableRow key={event.event_uuid} className="hover:bg-zinc-900/50 border-zinc-800">
                <TableCell>
                   <SeverityBadge severity={event.alert_severity} />
                </TableCell>
                <TableCell>
                   <TriageActions 
                        uuid={event.event_uuid} 
                        initialStatus={event.current_status}
                        initialNotes={event.analyst_notes}
                     />
                </TableCell>
                <TableCell className="font-medium text-sm text-zinc-300">
                   {event.alert_signature}
                </TableCell>
                <TableCell className="text-xs font-mono text-zinc-400">
                   {event.src_ip}
                </TableCell>
                <TableCell className="text-right text-xs font-mono text-zinc-500">
                   {formatToLocal(event.timestamp)}
                </TableCell>
              </TableRow>
            ))}
            {processedData.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {dateFilter 
                          ? "No events found for this specific time range." 
                          : "No events match current filters."}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SeverityBadge({ severity }: { severity?: number }) {
  if (severity === 1) return <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10 text-[10px]">CRITICAL</Badge>;
  if (severity === 2) return <Badge variant="outline" className="border-orange-500 text-orange-500 bg-orange-500/10 text-[10px]">HIGH</Badge>;
  return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10 text-[10px]">INFO</Badge>;
}