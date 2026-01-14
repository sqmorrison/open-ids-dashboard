"use client";

import { useState } from "react";
import { ShieldAlert, Terminal, Skull, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"; // Using Sonner directly

export function RedTeamControl() {
  const [loading, setLoading] = useState<string | null>(null);

  const runSimulation = async (type: string) => {
    setLoading(type);
    
    // Immediate feedback for the user
    const toastId = toast.loading(`Initializing ${type} attack vectors...`);

    try {
      const res = await fetch("/api/simulation", {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      
      if (!res.ok) throw new Error("Simulation failed");
      
      const data = await res.json();

      // Success Notification
      toast.success("Attack Launched Successfully", {
        id: toastId, // Updates the loading toast
        description: data.message || `Injected ${type} traffic into the network.`,
        duration: 4000,
        // Style it red to match the vibe
        style: { borderColor: "#ef4444", color: "#ef4444" }
      });

    } catch (error) {
      console.error(error);
      toast.error("Simulation Failed", {
        id: toastId,
        description: "Could not connect to the attack server.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-red-900/50 bg-red-950/10 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-500 text-sm font-mono uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          Red Team Simulations
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Scenario 1: Ransomware */}
        <Button 
          variant="outline" 
          className="border-red-900 text-red-400 hover:bg-red-950/50 hover:text-red-200 justify-start"
          onClick={() => runSimulation("ransomware")}
          disabled={!!loading}
        >
          {loading === "ransomware" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Skull className="w-4 h-4 mr-2" />}
          Ransomware
        </Button>

        {/* Scenario 2: China APT */}
        <Button 
          variant="outline" 
          className="border-orange-900 text-orange-400 hover:bg-orange-950/50 hover:text-orange-200 justify-start"
          onClick={() => runSimulation("china_apt")}
          disabled={!!loading}
        >
          {loading === "china_apt" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
          China APT
        </Button>

        {/* Scenario 3: SQL Injection */}
        <Button 
          variant="outline" 
          className="border-yellow-900 text-yellow-400 hover:bg-yellow-950/50 hover:text-yellow-200 justify-start"
          onClick={() => runSimulation("sql_injection")}
          disabled={!!loading}
        >
          {loading === "sql_injection" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Terminal className="w-4 h-4 mr-2" />}
          SQL Injection
        </Button>

      </CardContent>
    </Card>
  );
}