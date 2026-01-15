"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { MessageSquare, Save, Loader2 } from "lucide-react"

interface TriageActionsProps {
  uuid: string;
  initialStatus: string;
  initialNotes?: string;
  onUpdate?: () => void; // Callback to refresh parent if needed
}

const statusColors: Record<string, string> = {
  New: 'text-blue-500',
  Investigating: 'text-orange-500',
  'False Positive': 'text-gray-500',
  Resolved: 'text-green-500',
};

export function TriageActions({ uuid, initialStatus, initialNotes = "", onUpdate }: TriageActionsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (newStatus?: string, newNotes?: string) => {
    setIsSaving(true);
    const payloadStatus = newStatus || status;
    const payloadNotes = newNotes !== undefined ? newNotes : notes;

    try {
      const res = await fetch('/api/events/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_uuid: uuid,
          status: payloadStatus,
          notes: payloadNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // Update local state
      if (newStatus) setStatus(newStatus);
      if (newNotes !== undefined) setNotes(newNotes);
      
      toast.success("Case updated");
      if (onUpdate) onUpdate(); // Optional: Trigger refresh? usually better to stay stable
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to update case');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 1. STATUS DROPDOWN (Quick Action) */}
      <Select 
        value={status} 
        onValueChange={(val) => handleSave(val, undefined)}
        disabled={isSaving}
      >
        <SelectTrigger className={`w-[130px] h-8 text-xs ${statusColors[status] || ''}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="New">New</SelectItem>
          <SelectItem value="Investigating">Investigating</SelectItem>
          <SelectItem value="False Positive">False Positive</SelectItem>
          <SelectItem value="Resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {/* 2. NOTES POPOVER */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={notes ? "secondary" : "ghost"} 
            size="icon" 
            className={`h-8 w-8 ${notes ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-500"}`}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-zinc-950 border-zinc-800 p-3">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-zinc-300">Analyst Notes</h4>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Add investigation details..."
              className="min-h-25 text-xs bg-zinc-900 border-zinc-800 resize-none"
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={() => handleSave(undefined, notes)}
                disabled={isSaving}
                className="h-7 text-xs"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Save className="w-3 h-3 mr-1"/>}
                Save Note
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}