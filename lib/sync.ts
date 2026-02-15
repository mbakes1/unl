import { sql } from "@/lib/db"
import type { OCDSRelease, OCDSResponse } from "@/lib/types"

const API_BASE = "https://ocds-api.etenders.gov.za/api/OCDSReleases"
const BATCH_SIZE = 1000 // max per page for external API
const TARGET_TOTAL = 10000

function extractFields(release: OCDSRelease) {
  const t = release.tender || ({} as OCDSRelease["tender"])
  const buyer = release.buyer || { id: "", name: "" }
  const pe = t.procuringEntity || { id: "", name: "" }
  const cp = t.contactPerson || { name: "", email: "", telephoneNumber: "" }
  const bs = t.briefingSession || {
    isSession: false,
    compulsory: false,
    date: "",
    venue: "",
  }
  const docs = t.documents || []
  const awards = release.awards || []
  const totalAwardValue = awards.reduce(
    (sum, a) => sum + (a.value?.amount || 0),
    0
  )

  return {
    ocid: release.ocid,
    release_id: release.id,
    release_date: release.date || null,
    tender_id: t.id || null,
    title: t.title || null,
    status: t.status || null,
    category: t.category || null,
    province: t.province || null,
    delivery_location: t.deliveryLocation || null,
    special_conditions: t.specialConditions || null,
    main_procurement_category: t.mainProcurementCategory || null,
    description: t.description || null,
    procurement_method: t.procurementMethod || null,
    procurement_method_details: t.procurementMethodDetails || null,
    estimated_value: t.value?.amount || 0,
    currency: t.value?.currency || "ZAR",
    tender_period_start: t.tenderPeriod?.startDate || null,
    tender_period_end: t.tenderPeriod?.endDate || null,
    buyer_id: buyer.id || null,
    buyer_name: buyer.name || null,
    procuring_entity_id: pe.id || null,
    procuring_entity_name: pe.name || null,
    contact_name: cp.name || null,
    contact_email: cp.email || null,
    contact_phone: cp.telephoneNumber || null,
    briefing_is_session: bs.isSession || false,
    briefing_compulsory: bs.compulsory || false,
    briefing_date:
      bs.date && !bs.date.startsWith("0001") ? bs.date : null,
    briefing_venue: bs.venue || null,
    document_count: docs.length,
    award_count: awards.length,
    total_award_value: totalAwardValue,
    raw_release: JSON.stringify(release),
  }
}

async function fetchPage(
  pageNumber: number,
  pageSize: number,
  dateFrom: string,
  dateTo: string
): Promise<OCDSResponse> {
  const url = `${API_BASE}?PageNumber=${pageNumber}&PageSize=${pageSize}&dateFrom=${dateFrom}&dateTo=${dateTo}`
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  })
  if (!response.ok) {
    throw new Error(
      `API returned ${response.status}: ${await response.text()}`
    )
  }
  return response.json()
}

async function upsertBatch(releases: OCDSRelease[]): Promise<number> {
  let upserted = 0
  // Process in smaller chunks to avoid query size limits
  const CHUNK_SIZE = 50
  for (let i = 0; i < releases.length; i += CHUNK_SIZE) {
    const chunk = releases.slice(i, i + CHUNK_SIZE)
    const promises = chunk.map((release) => {
      const f = extractFields(release)
      return sql`
        INSERT INTO tenders (
          ocid, release_id, release_date, tender_id, title, status, category,
          province, delivery_location, special_conditions, main_procurement_category,
          description, procurement_method, procurement_method_details,
          estimated_value, currency, tender_period_start, tender_period_end,
          buyer_id, buyer_name, procuring_entity_id, procuring_entity_name,
          contact_name, contact_email, contact_phone,
          briefing_is_session, briefing_compulsory, briefing_date, briefing_venue,
          document_count, award_count, total_award_value, raw_release, synced_at
        ) VALUES (
          ${f.ocid}, ${f.release_id}, ${f.release_date}, ${f.tender_id},
          ${f.title}, ${f.status}, ${f.category}, ${f.province},
          ${f.delivery_location}, ${f.special_conditions},
          ${f.main_procurement_category}, ${f.description},
          ${f.procurement_method}, ${f.procurement_method_details},
          ${f.estimated_value}, ${f.currency},
          ${f.tender_period_start}, ${f.tender_period_end},
          ${f.buyer_id}, ${f.buyer_name},
          ${f.procuring_entity_id}, ${f.procuring_entity_name},
          ${f.contact_name}, ${f.contact_email}, ${f.contact_phone},
          ${f.briefing_is_session}, ${f.briefing_compulsory},
          ${f.briefing_date}, ${f.briefing_venue},
          ${f.document_count}, ${f.award_count}, ${f.total_award_value},
          ${f.raw_release}::jsonb, NOW()
        )
        ON CONFLICT (ocid) DO UPDATE SET
          release_id = EXCLUDED.release_id,
          release_date = EXCLUDED.release_date,
          tender_id = EXCLUDED.tender_id,
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          category = EXCLUDED.category,
          province = EXCLUDED.province,
          delivery_location = EXCLUDED.delivery_location,
          special_conditions = EXCLUDED.special_conditions,
          main_procurement_category = EXCLUDED.main_procurement_category,
          description = EXCLUDED.description,
          procurement_method = EXCLUDED.procurement_method,
          procurement_method_details = EXCLUDED.procurement_method_details,
          estimated_value = EXCLUDED.estimated_value,
          currency = EXCLUDED.currency,
          tender_period_start = EXCLUDED.tender_period_start,
          tender_period_end = EXCLUDED.tender_period_end,
          buyer_id = EXCLUDED.buyer_id,
          buyer_name = EXCLUDED.buyer_name,
          procuring_entity_id = EXCLUDED.procuring_entity_id,
          procuring_entity_name = EXCLUDED.procuring_entity_name,
          contact_name = EXCLUDED.contact_name,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          briefing_is_session = EXCLUDED.briefing_is_session,
          briefing_compulsory = EXCLUDED.briefing_compulsory,
          briefing_date = EXCLUDED.briefing_date,
          briefing_venue = EXCLUDED.briefing_venue,
          document_count = EXCLUDED.document_count,
          award_count = EXCLUDED.award_count,
          total_award_value = EXCLUDED.total_award_value,
          raw_release = EXCLUDED.raw_release,
          synced_at = NOW()
      `
    })
    await Promise.all(promises)
    upserted += chunk.length
  }
  return upserted
}

export async function syncTenders(): Promise<{
  status: "success" | "error"
  tendersFetched: number
  tendersUpserted: number
  durationMs: number
  error?: string
}> {
  const startTime = Date.now()

  // Create sync log entry
  const logResult = await sql`
    INSERT INTO sync_log (status, date_from, date_to)
    VALUES ('running', '', '')
    RETURNING id
  `
  const syncLogId = logResult[0].id

  try {
    // Date range: last 6 months to catch active + recent tenders
    const dateTo = new Date()
    const dateFrom = new Date()
    dateFrom.setMonth(dateFrom.getMonth() - 6)

    const dateFromStr = dateFrom.toISOString().split("T")[0]
    const dateToStr = dateTo.toISOString().split("T")[0]

    // Update sync log with date range
    await sql`
      UPDATE sync_log SET date_from = ${dateFromStr}, date_to = ${dateToStr}
      WHERE id = ${syncLogId}
    `

    let totalFetched = 0
    let totalUpserted = 0
    let pageNumber = 1
    let hasMore = true

    while (hasMore && totalFetched < TARGET_TOTAL) {
      const remaining = TARGET_TOTAL - totalFetched
      const pageSize = Math.min(BATCH_SIZE, remaining)

      console.log(
        `[sync] Fetching page ${pageNumber}, pageSize=${pageSize}, totalFetched=${totalFetched}`
      )

      const data = await fetchPage(
        pageNumber,
        pageSize,
        dateFromStr,
        dateToStr
      )

      const releases = data.releases || []
      totalFetched += releases.length

      if (releases.length > 0) {
        const upserted = await upsertBatch(releases)
        totalUpserted += upserted
        console.log(
          `[sync] Page ${pageNumber}: fetched=${releases.length}, upserted=${upserted}, total=${totalFetched}`
        )
      }

      // Check if there's a next page
      hasMore = !!data.links?.next && releases.length === pageSize
      pageNumber++
    }

    const durationMs = Date.now() - startTime

    // Update sync log
    await sql`
      UPDATE sync_log SET
        status = 'success',
        completed_at = NOW(),
        tenders_fetched = ${totalFetched},
        tenders_upserted = ${totalUpserted},
        duration_ms = ${durationMs}
      WHERE id = ${syncLogId}
    `

    return {
      status: "success",
      tendersFetched: totalFetched,
      tendersUpserted: totalUpserted,
      durationMs,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    await sql`
      UPDATE sync_log SET
        status = 'error',
        completed_at = NOW(),
        error_message = ${errorMessage},
        duration_ms = ${durationMs}
      WHERE id = ${syncLogId}
    `

    return {
      status: "error",
      tendersFetched: 0,
      tendersUpserted: 0,
      durationMs,
      error: errorMessage,
    }
  }
}

export async function getLastSyncStatus() {
  const result = await sql`
    SELECT id, started_at, completed_at, status, tenders_fetched,
           tenders_upserted, date_from, date_to, error_message, duration_ms
    FROM sync_log
    ORDER BY started_at DESC
    LIMIT 1
  `
  return result[0] || null
}

export async function isSyncRunning(): Promise<boolean> {
  const result = await sql`
    SELECT COUNT(*) as count FROM sync_log WHERE status = 'running'
  `
  return Number(result[0].count) > 0
}

export async function getTenderCount(): Promise<number> {
  const result = await sql`SELECT COUNT(*) as count FROM tenders`
  return Number(result[0].count)
}
