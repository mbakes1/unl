"use client"

import React from "react"
import useSWR from "swr"

import type { OCDSRelease } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  Download,
  Mail,
  Phone,
  Clock,
  User,
  ExternalLink,
  Banknote,
  Gavel,
  Info,
} from "lucide-react"

interface TenderDetailProps {
  ocid: string | null
  open: boolean
  onClose: () => void
}

const fetcher = async (url: string): Promise<OCDSRelease> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch tender details")
  return res.json()
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr.startsWith("0001")) return "N/A"
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string) {
  if (!dateStr || dateStr.startsWith("0001")) return "N/A"
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCurrency(amount: number, currency: string) {
  if (!amount || amount === 0) return "Not specified"
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

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </h3>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  if (!value || value === "N/A" || value === "") return null
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-card-foreground">{value}</span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-6 pb-6 pt-2">
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-1 h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
      <Separator />
      <div>
        <Skeleton className="mb-3 h-4 w-24" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TenderDetail({ ocid, open, onClose }: TenderDetailProps) {
  const { data: release, isLoading } = useSWR<OCDSRelease>(
    ocid && open ? `/api/tenders/${encodeURIComponent(ocid)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl p-0">
        {isLoading || !release ? (
          <>
            <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
              <div className="mb-2 flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <DialogTitle>
                <Skeleton className="h-6 w-3/4" />
              </DialogTitle>
              <DialogDescription>
                <Skeleton className="h-4 w-48" />
              </DialogDescription>
            </DialogHeader>
            <DetailSkeleton />
          </>
        ) : (
          <TenderDetailContent release={release} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TenderDetailContent({ release }: { release: OCDSRelease }) {
  const { tender, buyer, awards, parties, planning } = release

  return (
    <>
      <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge
            className={`${getStatusColor(tender.status)} border text-xs`}
          >
            {tender.status?.charAt(0).toUpperCase() + tender.status?.slice(1)}
          </Badge>
          {tender.category && (
            <Badge variant="outline" className="text-xs">
              {tender.category}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {tender.procurementMethodDetails || tender.procurementMethod}
          </Badge>
        </div>
        <DialogTitle className="text-balance text-xl font-bold text-card-foreground">
          {tender.title}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          OCID: {release.ocid}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[65vh] px-6 pb-6">
        <div className="flex flex-col gap-6 pt-2">
          {/* Description */}
          <div>
            <SectionTitle icon={Info}>Description</SectionTitle>
            <p className="text-sm leading-relaxed text-card-foreground">
              {tender.description || "No description provided."}
            </p>
          </div>

          <Separator />

          {/* Key Details */}
          <div>
            <SectionTitle icon={Building2}>Key Details</SectionTitle>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <DetailRow
                label="Procuring Entity"
                value={buyer?.name || tender.procuringEntity?.name}
              />
              <DetailRow label="Province" value={tender.province} />
              <DetailRow
                label="Delivery Location"
                value={tender.deliveryLocation}
              />
              <DetailRow
                label="Procurement Method"
                value={
                  tender.procurementMethodDetails || tender.procurementMethod
                }
              />
              <DetailRow
                label="Main Category"
                value={tender.mainProcurementCategory}
              />
              <DetailRow
                label="Estimated Value"
                value={formatCurrency(
                  tender.value?.amount,
                  tender.value?.currency
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <SectionTitle icon={Calendar}>Timeline</SectionTitle>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <DetailRow
                label="Tender Opens"
                value={formatDate(tender.tenderPeriod?.startDate)}
              />
              <DetailRow
                label="Tender Closes"
                value={formatDateTime(tender.tenderPeriod?.endDate)}
              />
            </div>
          </div>

          {/* Briefing Session */}
          {tender.briefingSession?.isSession && (
            <>
              <Separator />
              <div>
                <SectionTitle icon={Clock}>Briefing Session</SectionTitle>
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <DetailRow
                    label="Date"
                    value={formatDateTime(tender.briefingSession.date)}
                  />
                  <DetailRow
                    label="Venue"
                    value={tender.briefingSession.venue}
                  />
                  <DetailRow
                    label="Compulsory"
                    value={tender.briefingSession.compulsory ? "Yes" : "No"}
                  />
                </div>
              </div>
            </>
          )}

          {/* Contact Person */}
          {tender.contactPerson?.name && (
            <>
              <Separator />
              <div>
                <SectionTitle icon={User}>Contact Person</SectionTitle>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <p className="mb-2 font-medium text-card-foreground">
                    {tender.contactPerson.name}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {tender.contactPerson.email && (
                      <a
                        href={`mailto:${tender.contactPerson.email}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {tender.contactPerson.email}
                      </a>
                    )}
                    {tender.contactPerson.telephoneNumber && (
                      <a
                        href={`tel:${tender.contactPerson.telephoneNumber}`}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {tender.contactPerson.telephoneNumber}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Documents */}
          {tender.documents?.length > 0 && (
            <>
              <Separator />
              <div>
                <SectionTitle icon={FileText}>
                  Documents ({tender.documents.length})
                </SectionTitle>
                <div className="flex flex-col gap-2">
                  {tender.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Download className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {doc.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.format?.toUpperCase()} - Published{" "}
                            {formatDate(doc.datePublished)}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Awards */}
          {awards?.length > 0 && (
            <>
              <Separator />
              <div>
                <SectionTitle icon={Gavel}>
                  Awards ({awards.length})
                </SectionTitle>
                <div className="flex flex-col gap-2">
                  {awards.map((award) => (
                    <div
                      key={award.id}
                      className="rounded-lg border border-border bg-muted/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-card-foreground">
                            {award.title || "Unnamed Award"}
                          </p>
                          {award.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {award.description}
                            </p>
                          )}
                          {award.suppliers?.map((s) => (
                            <p
                              key={s.id}
                              className="mt-1 text-sm text-muted-foreground"
                            >
                              Supplier: {s.name}
                            </p>
                          ))}
                        </div>
                        {award.value?.amount > 0 && (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Banknote className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(
                                award.value.amount,
                                award.value.currency
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Special Conditions */}
          {tender.specialConditions &&
            tender.specialConditions !== "N/A" && (
              <>
                <Separator />
                <div>
                  <SectionTitle icon={Info}>Special Conditions</SectionTitle>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {tender.specialConditions}
                  </p>
                </div>
              </>
            )}

          {/* Parties / Suppliers */}
          {parties?.length > 0 && (
            <>
              <Separator />
              <div>
                <SectionTitle icon={Building2}>
                  Parties ({parties.length})
                </SectionTitle>
                <div className="flex flex-col gap-2">
                  {parties.map((party) => (
                    <div
                      key={party.id}
                      className="rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-card-foreground">
                          {party.name ||
                            party.identifier?.legalName ||
                            "Unknown"}
                        </p>
                        <div className="flex gap-1">
                          {party.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {party.address?.countryName && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[
                            party.address.streetAddress,
                            party.address.locality,
                            party.address.region,
                            party.address.countryName,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Budget / Planning */}
          {planning?.budget?.description &&
            planning.budget.description.trim() !== "-" &&
            planning.budget.description.trim() !== "" && (
              <>
                <Separator />
                <div>
                  <SectionTitle icon={Banknote}>Budget</SectionTitle>
                  <p className="text-sm text-muted-foreground">
                    {planning.budget.description}
                  </p>
                </div>
              </>
            )}
        </div>
      </ScrollArea>
    </>
  )
}
