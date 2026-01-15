'use client';

import { useState, useEffect, useCallback } from 'react';

// Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";
import EventsTable from '@/components/ui/EventsTable';
import IncidentsTable from '@/components/ui/IncidentsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrafficChart from '@/components/ui/TrafficChart';
import RoiCard from '@/components/ui/RoiCard';
import { ModeToggle } from '@/components/ui/ToggleModeButton';
import { QueryBuilder } from '@/components/ui/QueryBuilder';
import GlobalThreatMap from '@/components/ui/GlobalThreatMap';
import TriageQueue from '@/components/ui/TriageQueue';
import { TimeRange } from "@/types/events";
import SignalChart from '@/components/ui/SignalChart';
import ProtocolChart from '@/components/ui/ProtocolChart';

// Types
import { IDSEvent, IDSIncident } from '@/types/events';

// API Response Types
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

// Helper: Fetch with Timeout
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

export default function Dashboard() {
  // --- STATE ---
  const [liveEvents, setLiveEvents] = useState<IDSEvent[]>([]);
  const [triageEvents, setTriageEvents] = useState<IDSEvent[]>([]);
  const [incidents, setIncidents] = useState<IDSIncident[]>([]);
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [stats, setStats] = useState<SeverityStats>({ critical: 0, high: 0, medium: 0 });
  const [signalData, setSignalData] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1H');
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');  
  const [isLoading, setIsLoading] = useState(true); 
  const [isRefreshingTriage, setIsRefreshingTriage] = useState(false);

  // --- FETCHING LOGIC ---

  const fetchLiveStream = useCallback(async () => {
        try {
            const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const eventsRes = await fetchWithTimeout(`/api/events?limit=50${queryParam}`, 5000);
            
            if (eventsRes.ok) setLiveEvents(await eventsRes.json());
            
            const [incidentsRes, trafficRes, statsRes, signalRes, protoRes] = await Promise.all([
                 fetchWithTimeout(`/api/incidents`, 5000),
                 fetchWithTimeout(`/api/stats/traffic?range=${timeRange}`, 5000),
                 fetchWithTimeout(`/api/stats/roi`, 5000),
                 fetchWithTimeout(`/api/stats/signal-noise`, 5000),
                 fetchWithTimeout(`/api/stats/protocols`, 5000)
            ]);
  
            // Handle the new Incidents response
            if (incidentsRes.ok) setIncidents(await incidentsRes.json());
            if (trafficRes.ok) setTraffic(await trafficRes.json());
            if (statsRes.ok) setStats(await statsRes.json());
            if (signalRes.ok) {
                    const signalData = await signalRes.json();
                    setSignalData(signalData);
                }
            if (protoRes.ok) setProtocolData(await protoRes.json());
  
        } catch (e) { console.error("Poll error", e); }
      }, [timeRange, searchQuery]);
  
  const fetchTriageQueue = useCallback(async (showLoading = false) => {
      if (showLoading) setIsRefreshingTriage(true);
      try {
          const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
          const res = await fetchWithTimeout(`/api/events?limit=200${queryParam}`, 8000);
          
          if (res.ok) {
              const data = await res.json();
              setTriageEvents(data);
          }
      } catch (e) {
          console.error("Triage fetch error", e);
      } finally {
          if (showLoading) setIsRefreshingTriage(false);
      }
    }, [searchQuery]); // Dependency added

  // --- EFFECTS ---

  useEffect(() => {
      const init = async () => {
          setIsLoading(true);
          await Promise.all([fetchLiveStream(), fetchTriageQueue()]);
          setIsLoading(false);
      };
      init();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
      const interval = setInterval(() => {
          fetchLiveStream();
      }, POLLING_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [fetchLiveStream]);

  // Since Triage is "stable" (doesn't poll), we must manually trigger it when the user searches.
  useEffect(() => {
      if (searchQuery !== '') {
         fetchTriageQueue(true);
      }
  }, [searchQuery, fetchTriageQueue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    // The useEffect above ^ will detect this change and trigger the fetch
  };

  // --- RENDER ---
  return (
    <div className="container mx-auto py-10 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Aerial Eye</h1>
          <p className="text-muted-foreground">Real-time Network Threat Monitoring & Intelligence</p>
        </div>

        <div className='flex items-center gap-4'>            
            <ModeToggle />
            
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                <div className="relative w-64">
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

      {/* ERROR BANNER */}
      {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
      )}

      {/* MAIN CONTENT TABS */}
      <Tabs defaultValue="triage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Feed (Raw)</TabsTrigger>
          <TabsTrigger value="triage">Status View</TabsTrigger>
          <TabsTrigger value="incidents">Incidents (Aggregated)</TabsTrigger>
          <TabsTrigger value="AI">Ask The Database</TabsTrigger>
          <TabsTrigger value="chart">Traffic Chart</TabsTrigger>
          <TabsTrigger value="map">Heat Map</TabsTrigger>
          <TabsTrigger value="ROI">Money Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="triage">
          <TriageQueue 
            data={triageEvents} 
            onRefresh={() => fetchTriageQueue(true)} 
            isRefreshing={isRefreshingTriage} 
            onSignatureSearch={(query) => {
                    setSearchQuery(query); 
                }}
          />
        </TabsContent>

        <TabsContent value="live">
          <EventsTable data={liveEvents} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="incidents">
          <IncidentsTable data={incidents} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="chart">
          <TrafficChart 
            data={traffic} 
            onTimeRangeChange={setTimeRange}
          />        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="md:col-span-2">
                  <SignalChart data={signalData} />
              </div>
              <div className="md:col-span-1">
                  <ProtocolChart data={protocolData} />
              </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ROI">
          <RoiCard criticalCount={stats.critical} highCount={stats.high} />
        </TabsContent>
        
        <TabsContent value="AI">
          <QueryBuilder />
        </TabsContent>
        
        <TabsContent value="map">
          <GlobalThreatMap />
        </TabsContent>
      </Tabs>
    </div>
  );
}