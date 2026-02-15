"use client"

import useSWR from "swr"
import type { TenderStatsResponse } from "@/lib/types"
import { FileText, Building2, MapPin, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = async (url: string): Promise<TenderStatsResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

export function TenderStats() {
  const { data, isLoading } = useSWR<TenderStatsResponse>(
    "/api/tenders/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="mb-1 h-7 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const activeCount =
    data.byStatus.find((s) => s.status === "active")?.count || 0
  const uniqueProvinces = data.byProvince.length

  const stats = [
    {
      label: "Total Tenders",
      value: data.total.toLocaleString(),
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active",
      value: activeCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Entities",
      value: data.uniqueEntities.toLocaleString(),
      icon: Building2,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "Provinces",
      value: uniqueProvinces,
      icon: MapPin,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
