"use client"

import { useEffect, useState } from "react"
import { IDSEvent } from "@/types/events"
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

export function EventsTable() {
  const [events, setEvents] = useState<IDSEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Function to fetch data
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error("Failed to fetch events", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and set up a 5-second auto-refresh
  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 5000) // Live polling
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="p-10">Loading Intelligence...</div>

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Live Traffic Feed ({events.length} Events)</CardTitle>
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
            {events.map((event, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {/* Dynamic coloring based on severity */}
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
                <TableCell className="text-xs">{event.proto}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}