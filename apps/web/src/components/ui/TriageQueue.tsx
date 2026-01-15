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
import { Input } from "@/components/ui/input" // Import Input
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Filter, ArrowUpDown, Search } from "lucide-react" // Import Search Icon
import { formatToLocal } from "@/lib/formatDate"
import { TriageActions } from "./TriageActions"

interface TriageQueueProps {
  data: IDSEvent[];
  onRefresh: () => void;
  isRefreshing: boolean;
  // NEW: Callback to trigger server-side search
  onSignatureSearch: (query: string) => void;
}

export default function TriageQueue({ data, onRefresh, isRefreshing, onSignatureSearch }: TriageQueueProps) {
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [sortBy, setSortBy] = useState<string>("severity")
  
  // Local state for the input box
  const [searchTerm, setSearchTerm] = useState("")

  // Trigger server fetch on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSignatureSearch(searchTerm)
    }
  }

  // client-side filtering and sorting (Runs on the returned data)
  const processedData = useMemo(() => {
    let filtered = [...(data || [])];

    // 1. FILTER
    if (statusFilter === "active") {
      filtered = filtered.filter(e => ["New", "Investigating"].includes(e.current_status));
    } else if (statusFilter === "resolved") {
      filtered = filtered.filter(e => ["Resolved", "False Positive"].includes(e.current_status));
    }

    // 2. SORT
    filtered.sort((a, b) => {
      if (sortBy === "severity") {
        return (a.alert_severity || 3) - (b.alert_severity || 3);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return filtered;
  }, [data, statusFilter, sortBy]);

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

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row items-center gap-4 mt-4 p-2 bg-zinc-900/30 rounded-md border border-zinc-800/50">
          
          {/* NEW: Server-Side Signature Search */}
          <div className="relative w-full md:w-auto md:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Filter by Signature (Press Enter)..."
              className="pl-9 h-8 bg-zinc-950 border-zinc-800 text-xs w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-zinc-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="active">Active (New/Inv)</SelectItem>
                <SelectItem value="resolved">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-4 h-4 text-zinc-500" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-8 bg-zinc-950 border-zinc-800 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">Severity (High-Low)</SelectItem>
                <SelectItem value="time">Time (Newest)</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No events match current filters.
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