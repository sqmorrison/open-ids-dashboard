"use client";

import { useState } from "react";
import { Search, Code, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function QueryBuilder() {
  const [prompt, setPrompt] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/sql", {
        method: "POST",
        body: JSON.stringify({ userQuery: prompt }),
      });
      const data = await res.json();
      setGeneratedSql(data.sql);
    } finally {
      setLoading(false);
    }
  };

  // Execute SQL (Reusing your existing generic query endpoint if you have one, 
  // or we'd need to make a quick one that accepts raw SQL - strictly controlled!)
  const handleExecute = async () => {
    // Implementation depends on if you want to allow arbitrary SQL execution 
    // for the MVP, you might just display the SQL for now.
    alert(`Executing: ${generatedSql}`); 
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="e.g. Show me all Critical alerts from the last 2 hours..." 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-2 hidden sm:block">Generate</span>
        </Button>
      </div>

      {generatedSql && (
        <Card className="p-4 bg-muted/50 border-dashed animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Code className="w-3 h-3" />
              <span>Generated SQL</span>
            </div>
            <Button size="sm" variant="ghost" className="h-6 text-xs hover:text-emerald-500" onClick={handleExecute}>
              <Play className="w-3 h-3 mr-1" /> Run Query
            </Button>
          </div>
          <code className="text-sm font-mono text-foreground break-all">
            {generatedSql}
          </code>
        </Card>
      )}
    </div>
  );
}