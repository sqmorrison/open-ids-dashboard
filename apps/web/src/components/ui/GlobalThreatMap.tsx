'use client';

import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Globe } from "lucide-react";

// This is the most reliable TopoJSON source for ISO_A2 codes
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  src_country_code: string;
  src_country: string;
  count: number;
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

  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#18181b", "#ef4444"]); 

  return (
    <Card className="col-span-4 bg-zinc-950 border-zinc-800 h-[500px] flex flex-col overflow-hidden">
      <CardHeader className="border-b border-zinc-800/50 bg-zinc-900/20 py-3">
        <CardTitle className="flex justify-between items-center text-zinc-100 text-sm font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Global Threat Origins
          </div>
          {loading && <Loader2 className="animate-spin w-4 h-4 text-zinc-500" />}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 w-full relative p-0 bg-black">
        <ComposableMap 
          // geoEqualEarth looks more professional and centers the map better than Mercator
          projection="geoEqualEarth"
          projectionConfig={{ scale: 140 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[0, 0]} zoom={1} maxZoom={5}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // Standard world-atlas uses numeric IDs. 
                  // We need to map those to the ISO_A2 codes from your database.
                  const countryName = geo.properties.name;
                  
                  // For the heatmap to work with world-atlas, we match by name 
                  // OR you can use an ISO mapping table. Since your mock uses 'China',
                  // we'll match on the country name.
                  const countryData = data.find(d => 
                    d.src_country === countryName || 
                    d.src_country_code === geo.id // Some maps use numeric IDs as strings
                  );

                  const fill = countryData ? colorScale(countryData.count) : "#27272a";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#09090b"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none", transition: "fill 0.3s" },
                        hover: { fill: "#f87171", cursor: "pointer", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => {
                        const label = countryData 
                          ? `${countryData.src_country}: ${countryData.count} Attacks`
                          : `${countryName}: No Activity`;
                        setHoveredCountry(label);
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* HUD Style Overlay Tooltip */}
        {hoveredCountry && (
          <div className="absolute top-4 right-4 bg-zinc-900/90 border border-zinc-700 p-3 rounded shadow-2xl backdrop-blur-md pointer-events-none z-50">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Intelligence Feed</div>
            <span className="text-zinc-100 text-xs font-mono font-bold">
              {hoveredCountry}
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-zinc-900/60 p-3 rounded border border-zinc-800 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-[10px] text-zinc-300 uppercase font-bold tracking-widest">Infiltration Source</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-zinc-800 rounded-full" />
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Baseline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}