"use client";

import { useState } from "react";
import { Search, Code, Play, Loader2, AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea"; // Add this

// Define a generic type for dynamic SQL results
type QueryResultRow = Record<string, unknown>;

export function QueryBuilder() {
  const [prompt, setPrompt] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Execution State
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [results, setResults] = useState<QueryResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Generate SQL via AI
  const handleGenerate = async () => {
    if (!prompt) return;
    setLoadingAi(true);
    setError(null);
    setResults([]);
    
    try {
      const res = await fetch("/api/ai/sql", {
        method: "POST",
        body: JSON.stringify({ userQuery: prompt }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setGeneratedSql(data.sql);
    } catch (err) {
      setError("Failed to generate SQL. Ensure AI service is running.");
    } finally {
      setLoadingAi(false);
    }
  };

  // 2. Execute SQL via Database
  const handleExecute = async () => {
    if (!generatedSql) return;
    setLoadingQuery(true);
    setError(null);

    try {
      const res = await fetch("/api/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: generatedSql }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Query failed");
      }

      setResults(data.data);
      if (data.data.length === 0) {
        setError("Query executed successfully but returned no results.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Query Execution Failed";
      setError(msg);
    } finally {
      setLoadingQuery(false);
    }
  };

  // Helper to safely render unknown cell values
  const renderCell = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">Ask the Database</label>
        <div className="flex gap-2">
          <Input 
            placeholder="e.g. Show me the last 5 critical alerts from China..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="font-mono text-sm"
          />
          <Button onClick={handleGenerate} disabled={loadingAi}>
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2 hidden sm:block">Generate</span>
          </Button>
        </div>
      </div>

      {/* SQL Review Card */}
      {generatedSql && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <Code className="w-3 h-3" />
                <span>Generated SQL (Editable)</span>
              </div>
              <Button 
                size="sm" 
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none" 
                onClick={handleExecute}
                disabled={loadingQuery}
              >
                {loadingQuery ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Run Query
              </Button>
            </div>
            
            {/* CHANGED: Textarea instead of Code block */}
            <Textarea 
              className="font-mono text-sm bg-background min-h-25"
              value={generatedSql}
              onChange={(e) => setGeneratedSql(e.target.value)}
            />
      
            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                <AlertTriangle className="w-3 h-3" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="rounded-md border overflow-hidden">
            <div className="bg-muted/50 p-2 border-b flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Database className="w-3 h-3" />
                Query Results ({results.length} rows)
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(results[0]).map((key) => (
                      <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} className="font-mono text-xs whitespace-nowrap">
                          {renderCell(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        </div>
      )}
    </div>
  );
}