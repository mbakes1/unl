"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal, X } from "lucide-react"

const PROVINCES = [
  "All Provinces",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
  "National",
]

const STATUSES = ["All Statuses", "active", "complete", "closed", "planned"]

const SORT_OPTIONS = [
  { value: "release_date:desc", label: "Newest First" },
  { value: "release_date:asc", label: "Oldest First" },
  { value: "tender_period_end:asc", label: "Closing Soonest" },
  { value: "total_award_value:desc", label: "Highest Value" },
  { value: "title:asc", label: "Title A-Z" },
]

export interface SearchFiltersState {
  keyword: string
  province: string
  status: string
  sortBy: string
  sortOrder: string
}

interface SearchFiltersProps {
  onSearch: (params: SearchFiltersState) => void
  isLoading: boolean
}

export function TenderSearchFilters({
  onSearch,
  isLoading,
}: SearchFiltersProps) {
  const [keyword, setKeyword] = useState("")
  const [province, setProvince] = useState("All Provinces")
  const [status, setStatus] = useState("All Statuses")
  const [sortOption, setSortOption] = useState("release_date:desc")

  const handleSearch = () => {
    const [sortBy, sortOrder] = sortOption.split(":")
    onSearch({ keyword, province, status, sortBy, sortOrder })
  }

  const handleClear = () => {
    setKeyword("")
    setProvince("All Provinces")
    setStatus("All Statuses")
    setSortOption("release_date:desc")
    onSearch({
      keyword: "",
      province: "All Provinces",
      status: "All Statuses",
      sortBy: "release_date",
      sortOrder: "desc",
    })
  }

  const hasFilters =
    keyword !== "" ||
    province !== "All Provinces" ||
    status !== "All Statuses"

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">
            Search Filters
          </h2>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Province */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Province
          </Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Sort By
          </Label>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keyword + Search Button */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label
            htmlFor="keyword"
            className="text-xs font-medium text-muted-foreground"
          >
            Keyword Search (uses full-text search)
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder="Search by title, description, entity, category..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-background pl-9"
            />
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Tenders
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
