'use client';

import { useState, useEffect, useCallback } from 'react';
// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";
import EventsTable from '@/components/ui/EventsTable';
import IncidentsTable from '@/components/ui/IncidentsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrafficChart from '@/components/ui/TrafficChart';
import RoiCard from '@/components/ui/RoiCard';
// types used
import { IDSEvent, IDSIncident } from '@/types/events';
import { ModeToggle } from '@/components/ui/ToggleModeButton';
import { QueryBuilder } from '@/components/ui/QueryBuilder';
import { RedTeamControl } from '@/components/ui/RedTeamControl';

// Types for API responses
interface TrafficData {
  time: string;
  count: number;
}

interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
}

// Constants
const POLLING_INTERVAL_MS = 5000;
const FETCH_TIMEOUT_MS = 10000;

// Helper function to create fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Main controller
// This component only handles data fetching, state management, and arranging the components
export default function Dashboard() {
  // State for data
  const [events, setEvents] = useState<IDSEvent[]>([]);
  const [incidents, setIncidents] = useState<IDSIncident[]>([]);
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [stats, setStats] = useState<SeverityStats>({ critical: 0, high: 0, medium: 0 });  
  // State for error handling
  const [error, setError] = useState<string | null>(null);

  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Unified Fetch Function
  const fetchData = useCallback(async (isBackground = false) => {
    // Only show spinner on initial load or manual search, not background polling
    if (!isBackground) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Build URLs
      const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const eventsUrl = `/api/events${queryParam}`;
      const incidentsUrl = `/api/incidents`;
      const chartsUrl = `/api/stats/traffic`;
      const roiUrl = `/api/stats/roi`;

      // Fetch all urls in parallel with timeout
      const [eventsRes, incidentsRes, trafficRes, statsRes] = await Promise.all([
        fetchWithTimeout(eventsUrl, FETCH_TIMEOUT_MS),
        fetchWithTimeout(incidentsUrl, FETCH_TIMEOUT_MS),
        fetchWithTimeout(chartsUrl, FETCH_TIMEOUT_MS),
        fetchWithTimeout(roiUrl, FETCH_TIMEOUT_MS)
      ]);

      // Handle each response with error checking
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      } else {
        const errorData = await eventsRes.json().catch(() => ({}));
        console.error('Events fetch failed:', errorData);
      }

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        setIncidents(incidentsData);
      } else {
        const errorData = await incidentsRes.json().catch(() => ({}));
        console.error('Incidents fetch failed:', errorData);
      }
      
      if (trafficRes.ok) {
        const trafficData = await trafficRes.json();
        setTraffic(trafficData);
      } else {
        const errorData = await trafficRes.json().catch(() => ({}));
        console.error('Traffic fetch failed:', errorData);
      }
      
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error("Dashboard Fetch Error:", err);
      if (!isBackground) {
        setError(errorMessage);
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [searchQuery]);

  // Runs immediately on mount
  // Polling interval for real-time updates
  useEffect(() => {
    // Initial Load
    fetchData(false);

    // Background polling
    const interval = setInterval(() => {
      fetchData(true);
    }, POLLING_INTERVAL_MS);

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
          <RedTeamControl />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full md:w-auto flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
                fetchData(false);
              }}
              className="ml-auto h-auto py-1 px-2"
            >
              Retry
            </Button>
          </div>
        )}
        <div className='flex flex-row justify-around'>
          <ModeToggle />
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
      </div>

      {/* Tabs for various components */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents (Aggregated)</TabsTrigger>
          <TabsTrigger value="live">Live Feed (Raw)</TabsTrigger>
          <TabsTrigger value="chart">Traffic Chart</TabsTrigger>
          <TabsTrigger value="ROI">Money Saved</TabsTrigger>
          <TabsTrigger value="AI">AI Features</TabsTrigger>
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
          <RoiCard 
            criticalCount={stats.critical} 
            highCount={stats.high} 
          />
        </TabsContent>
        
        <TabsContent value="AI">
          <QueryBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}