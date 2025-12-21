'use client';

import { useState, useEffect, useCallback } from 'react';
// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import EventsTable from '@/components/ui/EventsTable';
import IncidentsTable from '@/components/ui/IncidentsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrafficChart from '@/components/ui/TrafficChart';
import RoiCard from '@/components/ui/RoiCard';
// types used
import { IDSEvent, IDSIncident } from '@/types/events';

// Main controller
// This component only handles data fetching, state management, and arranging the components
export default function Dashboard() {
  // State for data
  const [events, setEvents] = useState<IDSEvent[]>([]);
  const [incidents, setIncidents] = useState<IDSIncident[]>([]);
  const [traffic, setTraffic] = useState([])
  const [roi, setROI] = useState(null)

  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Unified Fetch Function
  const fetchData = useCallback(async (isBackground = false) => {
    // Only show spinner on initial load or manual search, not background polling
    if (!isBackground) setIsLoading(true);

    try {
      // Build URLs
      const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const eventsUrl = `/api/events${queryParam}`;
      const incidentsUrl = `/api/incidents`;
      const chartsUrl = `/api/stats/traffic`;
      const roiUrl = `/api/stats/roi`;

      // Fetch all urls in parallel
      const [eventsRes, incidentsRes, trafficRes, roiRes] = await Promise.all([
        fetch(eventsUrl),
        fetch(incidentsUrl),
        fetch(chartsUrl),
        fetch(roiUrl)
      ]);

      //if the data is okay from each fetch request, give it to the UI
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        setIncidents(incidentsData);
      }
      
      if (trafficRes.ok) {
        const trafficData = await trafficRes.json();
        setTraffic(trafficData);
      }
      
      if (roiRes.ok) {
        const roiData = await roiRes.json();
        setROI(roiData);
      }

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [searchQuery]);

  // Runs immediately on mount
  // 5 second polling interval (for real time updates)
  useEffect(() => {
    // Initial Load
    fetchData(false);

    // Background polling
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  // Render Layer
  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">SOC-in-a-Box Dashboard</h1>
          <p className="text-muted-foreground">Real-time Network Threat Monitoring & Intelligence</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by IP..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Tabs for various components */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents (Aggregated)</TabsTrigger>
          <TabsTrigger value="live">Live Feed (Raw)</TabsTrigger>
          <TabsTrigger value="chart">Traffic Chart</TabsTrigger>
          <TabsTrigger value="ROI">Money Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents">
          <IncidentsTable data={incidents} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="live">
          <EventsTable data={events} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="chart">
          <TrafficChart data={traffic} />        
        </TabsContent>
        
        <TabsContent value="ROI">
          <RoiCard data={roi} />        
        </TabsContent>
      </Tabs>
    </div>
  );
}