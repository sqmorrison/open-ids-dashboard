'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner'; // Or your preferred toast library

interface StatusSelectProps {
  uuid: string;
  initialStatus: string;
}

const statusColors: Record<string, string> = {
  New: 'text-blue-500',
  Investigating: 'text-orange-500',
  'False Positive': 'text-gray-500',
  Resolved: 'text-green-500',
};

export function StatusSelect({ uuid, initialStatus }: StatusSelectProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const previousStatus = status;
    setStatus(newStatus); // Optimistic update

    try {
      const res = await fetch('/api/events/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_uuid: uuid,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      toast.success(`Case updated to ${newStatus}`);
    } catch (error) {
      setStatus(previousStatus); // Revert on error
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
      <SelectTrigger className={`w-35 h-8 ${statusColors[status] || ''}`}>
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="New">New</SelectItem>
        <SelectItem value="Investigating">Investigating</SelectItem>
        <SelectItem value="False Positive">False Positive</SelectItem>
        <SelectItem value="Resolved">Resolved</SelectItem>
      </SelectContent>
    </Select>
  );
}