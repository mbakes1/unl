"use client"

import type { TenderRow } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  Clock,
  ChevronRight,
  Banknote,
} from "lucide-react"

interface TenderCardProps {
  tender: TenderRow
  onSelect: (tender: TenderRow) => void
}

function formatDate(dateStr: string | null) {
  if (!dateStr || dateStr.startsWith("0001")) return "N/A"
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatCurrency(amount: number, currency: string) {
  if (!amount || amount === 0) return null
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "complete":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "closed":
      return "bg-slate-100 text-slate-700 border-slate-200"
    case "planned":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

function isClosingSoon(endDate: string | null) {
  if (!endDate || endDate.startsWith("0001")) return false
  const end = new Date(endDate)
  const now = new Date()
  const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 0 && diffDays <= 7
}

function getDaysRemaining(endDate: string | null) {
  if (!endDate || endDate.startsWith("0001")) return null
  const end = new Date(endDate)
  const now = new Date()
  const diffDays = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0) return "Closed"
  if (diffDays === 0) return "Closes today"
  if (diffDays === 1) return "1 day left"
  return `${diffDays} days left`
}

export function TenderCard({ tender, onSelect }: TenderCardProps) {
  const closingSoon = isClosingSoon(tender.tender_period_end)
  const daysRemaining = getDaysRemaining(tender.tender_period_end)
  const awardValue = formatCurrency(tender.total_award_value, tender.currency)

  return (
    <button
      type="button"
      onClick={() => onSelect(tender)}
      className="group w-full cursor-pointer rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              className={`${getStatusColor(tender.status)} border text-xs`}
            >
              {tender.status?.charAt(0).toUpperCase() +
                tender.status?.slice(1) || "Unknown"}
            </Badge>
            {tender.category && (
              <Badge variant="outline" className="text-xs">
                {tender.category}
              </Badge>
            )}
            {closingSoon && daysRemaining && (
              <Badge className="border border-amber-200 bg-amber-50 text-xs text-amber-700">
                <Clock className="mr-1 h-3 w-3" />
                {daysRemaining}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1.5 line-clamp-1 text-base font-semibold text-card-foreground group-hover:text-primary">
            {tender.title || "Untitled Tender"}
          </h3>

          {/* Description */}
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {tender.description || "No description available"}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {tender.buyer_name ||
                tender.procuring_entity_name ||
                "Unknown Entity"}
            </span>
            {tender.province && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {tender.province}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(tender.tender_period_start)} -{" "}
              {formatDate(tender.tender_period_end)}
            </span>
            {tender.document_count > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {tender.document_count} doc
                {tender.document_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right side: value + arrow */}
        <div className="flex flex-col items-end gap-2">
          {awardValue && (
            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary">
              <Banknote className="h-4 w-4" />
              {awardValue}
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </button>
  )
}
