import { NextResponse } from "next/server"
import {
  syncTenders,
  getLastSyncStatus,
  isSyncRunning,
  getTenderCount,
} from "@/lib/sync"

// GET: Check sync status
export async function GET() {
  try {
    const [lastSync, tenderCount, running] = await Promise.all([
      getLastSyncStatus(),
      getTenderCount(),
      isSyncRunning(),
    ])

    return NextResponse.json({
      tenderCount,
      isRunning: running,
      lastSync: lastSync
        ? {
            id: lastSync.id,
            status: lastSync.status,
            startedAt: lastSync.started_at,
            completedAt: lastSync.completed_at,
            tendersFetched: lastSync.tenders_fetched,
            tendersUpserted: lastSync.tenders_upserted,
            dateFrom: lastSync.date_from,
            dateTo: lastSync.date_to,
            durationMs: lastSync.duration_ms,
            error: lastSync.error_message,
          }
        : null,
    })
  } catch (error) {
    console.error("[v0] Failed to get sync status:", error)
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    )
  }
}

// POST: Trigger a sync
export async function POST() {
  try {
    const running = await isSyncRunning()
    if (running) {
      return NextResponse.json(
        { error: "A sync is already in progress" },
        { status: 409 }
      )
    }

    // Run sync (this will take a while for 10k records)
    const result = await syncTenders()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Sync failed:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Sync failed unexpectedly",
      },
      { status: 500 }
    )
  }
}
