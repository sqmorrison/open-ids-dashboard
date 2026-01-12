"use client"

import { useState } from "react"
import { Settings, Save } from "lucide-react"
import { useRiskProfile, RiskProfile } from "@/hooks/UseRiskProfile"

export function RiskSettingsDialog() {
  const { profile, updateProfile } = useRiskProfile()
  const [isOpen, setIsOpen] = useState(false)
  const [tempProfile, setTempProfile] = useState<RiskProfile>(profile)

  const handleSave = () => {
    updateProfile(tempProfile)
    setIsOpen(false)
  }

  // Sync temp state when opening
  const openModal = () => {
    setTempProfile(profile)
    setIsOpen(true)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={openModal}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        title="Configure ROI Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">ROI Configuration</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Analyst Hourly Rate ($)</label>
            <input 
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={tempProfile.analystHourlyRate}
              onChange={(e) => setTempProfile({...tempProfile, analystHourlyRate: Number(e.target.value)})}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Avg. Remediation Time (Hours)</label>
            <input 
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={tempProfile.avgRemediationTime}
              onChange={(e) => setTempProfile({...tempProfile, avgRemediationTime: Number(e.target.value)})}
            />
            <p className="text-xs text-muted-foreground">Average time to investigate and fix a threat manually.</p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Downtime Cost per Hour ($)</label>
            <input 
              type="number" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={tempProfile.downtimeCostPerHour}
              onChange={(e) => setTempProfile({...tempProfile, downtimeCostPerHour: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}