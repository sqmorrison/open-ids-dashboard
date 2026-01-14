'use client';

import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// 1. Define the Database Data Shape
interface CountryData {
  src_country_code: string;
  src_country: string;
  count: number;
}

// 2. Define the Map Feature Shape (The "geo" object)
interface GeoProperties {
  ISO_A2?: string; // The 2-letter code (e.g., "US")
  name?: string;   // The Country Name (e.g., "United States")
}

interface GeoFeature {
  rsmKey: string;
  properties: GeoProperties;
}

export default function GlobalThreatMap() {
  const [data, setData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stats/map');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxCount = Math.max(...data.map(d => d.count), 10);
  
  // Create color scale
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#27272a", "#ef4444"]); 

  // 3. Strictly Typed Helper Functions
  const getCountryColor = (geo: GeoFeature): string => {
    const countryCode = geo.properties.ISO_A2; 
    if (!countryCode) return "#27272a";

    const countryData = data.find(d => d.src_country_code === countryCode);
    return countryData ? colorScale(countryData.count) : "#27272a";
  };
  
  const getTooltip = (geo: GeoFeature): string => {
    const countryCode = geo.properties.ISO_A2; 
    const countryName = geo.properties.name || "Unknown Region";

    if (!countryCode) return countryName;

    const countryData = data.find(d => d.src_country_code === countryCode);
    
    if (!countryData) return `${countryName}: No Threats`;
    return `${countryData.src_country}: ${countryData.count} Attacks`;
  };

  return (
    <Card className="col-span-4 bg-zinc-950 border-zinc-800 h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-zinc-100">
          <span>Global Threat Origins (24H)</span>
          {loading && <Loader2 className="animate-spin w-4 h-4 text-zinc-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 w-full h-full relative overflow-hidden bg-zinc-900/20 rounded-b-lg">
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }}>
            <ZoomableGroup center={[0, 20]} zoom={1}>
            <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                geographies.map((geo) => {
                    // Force cast the map object to our defined interface
                    const feature = geo as unknown as GeoFeature;
                    const color = getCountryColor(feature);
                    
                    return (
                    <Geography
                        key={feature.rsmKey}
                        geography={geo}
                        fill={color}
                        stroke="#09090b"
                        strokeWidth={0.5}
                        style={{
                            default: { outline: "none" },
                            hover: { fill: "#f87171", outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" },
                        }}
                        onMouseEnter={() => setHoveredCountry(getTooltip(feature))}
                        onMouseLeave={() => setHoveredCountry(null)}
                    />
                    );
                })
                }
            </Geographies>
            </ZoomableGroup>
        </ComposableMap>
        
        {hoveredCountry && (
                <div className="absolute top-4 right-4 bg-zinc-950/90 border border-zinc-800 p-2 rounded shadow-xl pointer-events-none">
                    <span className="text-zinc-100 text-xs font-mono font-bold tracking-wider">
                        {hoveredCountry}
                    </span>
                </div>
            )}
        
        <div className="absolute bottom-4 left-4 bg-black/80 p-3 rounded text-xs text-zinc-400 border border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span>High Activity</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-zinc-800 rounded-sm"></div>
                <span>No Activity</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}