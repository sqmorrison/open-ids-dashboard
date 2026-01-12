"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IDSEvent } from "@/types/events";

export function AiAnalysis({ event }: { event: IDSEvent }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        body: JSON.stringify({ event }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysis("Error connecting to local AI node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!analysis && !loading && (
        <Button 
            onClick={handleAnalyze} 
            variant="outline" 
            size="sm"
            className="gap-2 text-indigo-400 border-indigo-500/30 hover:bg-indigo-950/30"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI Analyst
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing threat patterns...
        </div>
      )}

      {analysis && (
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-indigo-100">AI Assessment</h4>
          </div>
          <p className="text-sm text-indigo-200/90 leading-relaxed">
            {analysis}
          </p>
        </div>
      )}
    </div>
  );
}