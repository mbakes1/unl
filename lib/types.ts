// OCDS Release types based on SA eTenders API

export interface TenderDocument {
  id: string
  documentType: string
  title: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  format: string
  language: string
}

export interface TenderValue {
  amount: number
  currency: string
}

export interface BriefingSession {
  isSession: boolean
  compulsory: boolean
  date: string
  venue: string
}

export interface ContactPerson {
  name: string
  email: string
  telephoneNumber: string
  faxNumber?: string
}

export interface TenderPeriod {
  startDate: string
  endDate: string
}

export interface Tender {
  id: string
  title: string
  status: string
  category: string
  province: string
  deliveryLocation: string
  specialConditions: string
  mainProcurementCategory: string
  additionalProcurementCategories: string[]
  description: string
  value: TenderValue
  documents: TenderDocument[]
  tenderPeriod: TenderPeriod
  tenderers: { name: string; id: string }[]
  procuringEntity: { id: string; name: string }
  procurementMethod: string
  procurementMethodDetails: string
  briefingSession: BriefingSession
  contactPerson: ContactPerson
}

export interface Award {
  id: string
  title: string
  status: string
  description: string
  value: TenderValue
  suppliers: { id: string; name: string }[]
}

export interface Party {
  name: string
  id: string
  identifier: { legalName: string }
  address: {
    streetAddress?: string
    locality?: string
    region?: string
    postalCode?: string
    countryName: string
  }
  contactPoint: {
    name: string
    telephone: string
    email: string
    faxNumber: string
    url: string
  }
  roles: string[]
}

export interface OCDSRelease {
  ocid: string
  id: string
  date: string
  tag: string[]
  initiationType: string
  tender: Tender
  planning: {
    rationale: string
    budget: { description: string }
    documents: TenderDocument[]
  }
  parties: Party[]
  buyer: { id: string; name: string }
  language: string
  awards: Award[]
  contracts: unknown[]
}

export interface OCDSResponse {
  uri: string
  version: string
  publishedDate: string
  publisher: {
    name: string
    uri: string
  }
  license: string
  publicationPolicy: string
  releases: OCDSRelease[]
  links: {
    next?: string
    prev?: string
  }
}

// DB-backed types
export interface TenderRow {
  ocid: string
  release_id: string
  release_date: string
  tender_id: string
  title: string
  status: string
  category: string
  province: string
  delivery_location: string
  main_procurement_category: string
  description: string
  procurement_method: string
  procurement_method_details: string
  estimated_value: number
  currency: string
  tender_period_start: string
  tender_period_end: string
  buyer_id: string
  buyer_name: string
  procuring_entity_id: string
  procuring_entity_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  briefing_is_session: boolean
  briefing_compulsory: boolean
  briefing_date: string
  briefing_venue: string
  document_count: number
  award_count: number
  total_award_value: number
  synced_at: string
}

export interface TenderListResponse {
  tenders: TenderRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface TenderStatsResponse {
  total: number
  byStatus: { status: string; count: number }[]
  byProvince: { province: string; count: number }[]
  byCategory: { category: string; count: number }[]
  uniqueEntities: number
}

export interface SyncStatusResponse {
  tenderCount: number
  isRunning: boolean
  lastSync: {
    id: number
    status: string
    startedAt: string
    completedAt: string
    tendersFetched: number
    tendersUpserted: number
    dateFrom: string
    dateTo: string
    durationMs: number
    error?: string
  } | null
}
