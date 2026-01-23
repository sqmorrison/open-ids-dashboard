import { IDSEvent } from "@/types/events"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EventDetailsProps {
  event: IDSEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetails({ event, open, onOpenChange }: EventDetailsProps) {
  if (!event) return null

  // Parse the raw JSON if it exists, otherwise just show the event object
  let rawData = {}
  try {
    rawData = event.raw_json ? JSON.parse(event.raw_json) : event
  } catch (e) {
    rawData = event
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-100 sm:w-135"> 
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            Alert Details
            <Badge variant={event.alert_severity === 1 ? "destructive" : "outline"}>
              Sev {event.alert_severity}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Occurred at {new Date(event.timestamp).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
            {/* Quick Summary Section */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span className="font-semibold text-muted-foreground">Source</span>
                    <p className="font-mono">{event.src_ip}:{event.src_port}</p>
                </div>
                <div>
                    <span className="font-semibold text-muted-foreground">Destination</span>
                    <p className="font-mono">{event.dest_ip}:{event.dest_port}</p>
                </div>
                <div className="col-span-2">
                    <span className="font-semibold text-muted-foreground">Signature</span>
                    <p className="font-medium">{event.alert_signature}</p>
                </div>
            </div>

            {/* The Raw Evidence */}
            <div>
                <h3 className="mb-2 font-semibold text-muted-foreground">Raw Evidence</h3>
                <ScrollArea className="h-100 w-full rounded-md border p-4 bg-slate-950 text-slate-50 font-mono text-xs">
                    <pre>{JSON.stringify(rawData, null, 2)}</pre>
                </ScrollArea>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}