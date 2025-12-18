'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"; // Shadcn component
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react"; // If you have lucide icons installed
import EventsTable from '@/components/ui/EventsTable'; // Your existing table

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async (query = '') => {
    setIsLoading(true);
    try {
      // append query param if it exists
      const url = query 
        ? `/api/events?search=${encodeURIComponent(query)}` 
        : '/api/events';
      
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  // Poll for updates
    useEffect(() => {
      // 1. Fetch immediately when the search query changes
      fetchEvents(searchQuery);
  
      // 2. Set up the interval with the CURRENT query
      const interval = setInterval(() => {
        fetchEvents(searchQuery);
      }, 5000);
  
      // 3. Cleanup: Clear the interval when the component unmounts OR when searchQuery changes
      return () => clearInterval(interval);
      
    }, [searchQuery]);
    
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(searchQuery);
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Intrusion Detection Logs</h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-sm">
          <Input 
            placeholder="Search IP or Signature..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      <EventsTable data={events} isLoading={isLoading} />
    </div>
  );
}