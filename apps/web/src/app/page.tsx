import { EventsTable } from "@/components/ui/EventsTable"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 tracking-tight text-slate-900 dark:text-slate-100">
          Open IDS <span className="text-blue-600">Dashboard</span>
        </h1>
        
        <EventsTable />
      </div>
    </main>
  )
}