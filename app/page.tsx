"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import type { TenderListResponse, TenderRow } from "@/lib/types"
import {
  TenderSearchFilters,
  type SearchFiltersState,
} from "@/components/tender-search-filters"
import { TenderCard } from "@/components/tender-card"
import { TenderDetail } from "@/components/tender-detail"
import { TenderStats } from "@/components/tender-stats"
import { SyncStatus } from "@/components/sync-status"
import { TenderCardSkeleton } from "@/components/tender-skeleton"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Landmark,
  AlertCircle,
  SearchX,
} from "lucide-react"

interface SearchState extends SearchFiltersState {
  page: number
}

const fetcher = async (url: string): Promise<TenderListResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || `Failed to fetch: ${res.status}`)
  }
  return res.json()
}

function buildApiUrl(params: SearchState) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: "20",
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })

  if (params.keyword) searchParams.set("keyword", params.keyword)
  if (params.province && params.province !== "All Provinces")
    searchParams.set("province", params.province)
  if (params.status && params.status !== "All Statuses")
    searchParams.set("status", params.status)

  return `/api/tenders?${searchParams.toString()}`
}

export default function TenderExplorer() {
  const [searchState, setSearchState] = useState<SearchState>({
    keyword: "",
    province: "All Provinces",
    status: "All Statuses",
    sortBy: "release_date",
    sortOrder: "desc",
    page: 1,
  })
  const [selectedOcid, setSelectedOcid] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const apiUrl = buildApiUrl(searchState)

  const { data, error, isLoading } = useSWR<TenderListResponse>(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  const handleSearch = useCallback((params: SearchFiltersState) => {
    setSearchState({
      ...params,
      page: 1,
    })
  }, [])

  const handlePageChange = useCallback(
    (direction: "next" | "prev") => {
      setSearchState((prev) => ({
        ...prev,
        page:
          direction === "next"
            ? prev.page + 1
            : Math.max(1, prev.page - 1),
      }))
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    []
  )

  const handleSelectTender = useCallback((tender: TenderRow) => {
    setSelectedOcid(tender.ocid)
    setDetailOpen(true)
  }, [])

  const pagination = data?.pagination
  const tenders = data?.tenders || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Landmark className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-card-foreground">
              SA Tender Explorer
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover government procurement opportunities from the South
              African National Treasury eTenders Portal
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Sync Status */}
          <SyncStatus />

          {/* Stats */}
          <TenderStats />

          {/* Filters */}
          <TenderSearchFilters onSearch={handleSearch} isLoading={isLoading} />

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
              <h2 className="mb-1 text-lg font-semibold text-card-foreground">
                Something went wrong
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && !data && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <TenderCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && data && tenders.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <SearchX className="mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="mb-1 text-lg font-semibold text-card-foreground">
                No tenders found
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {pagination?.total === 0
                  ? "No tenders in the database yet. Click 'Sync Now' above to fetch tenders from the eTenders API."
                  : "Try adjusting your filters or search keywords to find more results."}
              </p>
            </div>
          )}

          {/* Results */}
          {tenders.length > 0 && (
            <>
              {/* Pagination header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-card-foreground">
                    {((pagination?.page || 1) - 1) * (pagination?.limit || 20) + 1}
                  </span>
                  {" - "}
                  <span className="font-medium text-card-foreground">
                    {Math.min(
                      (pagination?.page || 1) * (pagination?.limit || 20),
                      pagination?.total || 0
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-card-foreground">
                    {(pagination?.total || 0).toLocaleString()}
                  </span>{" "}
                  tenders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination?.hasPrev}
                    onClick={() => handlePageChange("prev")}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination?.page} of {pagination?.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination?.hasNext}
                    onClick={() => handlePageChange("next")}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tender cards */}
              <div className="flex flex-col gap-3">
                {tenders.map((tender) => (
                  <TenderCard
                    key={tender.ocid}
                    tender={tender}
                    onSelect={handleSelectTender}
                  />
                ))}
              </div>

              {/* Bottom pagination */}
              <div className="flex items-center justify-center gap-2 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination?.hasPrev}
                  onClick={() => handlePageChange("prev")}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="mx-3 text-sm text-muted-foreground">
                  Page {pagination?.page} of {pagination?.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination?.hasNext}
                  onClick={() => handlePageChange("next")}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Tender Detail Modal */}
      <TenderDetail
        ocid={selectedOcid}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Data sourced from the{" "}
            <a
              href="https://data.etenders.gov.za/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              South African National Treasury eTenders Portal
            </a>{" "}
            via the OCDS API. Published under the{" "}
            <a
              href="https://opendatacommons.org/licenses/pddl/1-0/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Open Data Commons PDDL
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
