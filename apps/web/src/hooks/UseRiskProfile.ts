"use client"

import { useState, useEffect } from "react"

export interface RiskProfile {
  analystHourlyRate: number
  avgRemediationTime: number
  downtimeCostPerHour: number
  criticalAssetCount: number
}

const DEFAULT_PROFILE: RiskProfile = {
  analystHourlyRate: 65,
  avgRemediationTime: 4,
  downtimeCostPerHour: 2500,
  criticalAssetCount: 10,
}

export function useRiskProfile() {
  const [profile, setProfile] = useState<RiskProfile>(DEFAULT_PROFILE)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 1. Read from LocalStorage
    const saved = localStorage.getItem("soc-risk-profile")
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setProfile((prev) => ({ ...prev, ...parsed })) 
      } catch (e) {
        console.error("Failed to parse risk profile", e)
      }
    }
    
    //  Mark as loaded to show UI
    setIsLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures this only runs once on mount

  const updateProfile = (newProfile: Partial<RiskProfile>) => {
    const updated = { ...profile, ...newProfile }
    setProfile(updated)
    localStorage.setItem("soc-risk-profile", JSON.stringify(updated))
  }

  const calculateROI = (criticalAlerts: number, highAlerts: number) => {
    const manualHours = (criticalAlerts + highAlerts) * profile.avgRemediationTime
    // Tool is 90% faster than manual
    const toolHours = manualHours * 0.1 
    const laborSavings = (manualHours - toolHours) * profile.analystHourlyRate

    // Risk: We assume 1% of Critical alerts would have caused downtime if missed
    const preventedDowntimeHours = (criticalAlerts * 0.01) * profile.avgRemediationTime
    const downtimeSavings = preventedDowntimeHours * profile.downtimeCostPerHour

    return {
      totalValue: laborSavings + downtimeSavings,
      laborSavings,
      downtimeSavings,
    }
  }

  return { profile, updateProfile, calculateROI, isLoaded }
}