"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import type { SyncStatusResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
  Loader2,
} from "lucide-react"

const fetcher = async (url: string): Promise<SyncStatusResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch sync status")
  return res.json()
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}m ${remaining}s`
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false)

  const { data, error, mutate } = useSWR<SyncStatusResponse>(
    "/api/sync",
    fetcher,
    {
      refreshInterval: isSyncing ? 5000 : 30000,
      revalidateOnFocus: true,
    }
  )

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Sync failed")
      }
      await mutate()
    } catch (err) {
      console.error("[v0] Sync trigger failed:", err)
    } finally {
      setIsSyncing(false)
      mutate()
    }
  }, [mutate])

  const isRunning = isSyncing || data?.isRunning
  const isEmpty = data?.tenderCount === 0
  const lastSync = data?.lastSync

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-card-foreground">
                Tender Database
              </span>
              {!error && data && (
                <Badge
                  variant="outline"
                  className={
                    isEmpty
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {data.tenderCount.toLocaleString()} tenders
                </Badge>
              )}
              {error && (
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRunning && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Syncing tenders from eTenders API... This may take a few
                  minutes.
                </span>
              )}
              {!isRunning && lastSync?.status === "success" && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Last synced {timeAgo(lastSync.completedAt)} --{" "}
                  {lastSync.tendersUpserted.toLocaleString()} tenders in{" "}
                  {formatDuration(lastSync.durationMs)}
                </span>
              )}
              {!isRunning && lastSync?.status === "error" && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  Last sync failed: {lastSync.error}
                </span>
              )}
              {!isRunning && !lastSync && !error && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  No sync has been run yet. Click Sync Now to populate the
                  database.
                </span>
              )}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleSync}
          disabled={isRunning}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Sync Now
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
