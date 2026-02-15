import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
  const keyword = searchParams.get("keyword") || ""
  const province = searchParams.get("province") || ""
  const status = searchParams.get("status") || ""
  const sortBy = searchParams.get("sortBy") || "release_date"
  const sortOrder = searchParams.get("sortOrder") || "desc"

  const offset = (page - 1) * limit

  try {
    // Build WHERE conditions dynamically
    const conditions: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(
        `search_vector @@ plainto_tsquery('english', $${paramIndex})`
      )
      values.push(keyword)
      paramIndex++
    }

    if (province && province !== "All Provinces") {
      conditions.push(`province ILIKE $${paramIndex}`)
      values.push(province)
      paramIndex++
    }

    if (status && status !== "All Statuses") {
      conditions.push(`status ILIKE $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Validate sort column to prevent injection
    const allowedSortCols = [
      "release_date",
      "title",
      "tender_period_end",
      "tender_period_start",
      "buyer_name",
      "total_award_value",
      "status",
      "province",
      "synced_at",
    ]
    const safeSortBy = allowedSortCols.includes(sortBy)
      ? sortBy
      : "release_date"
    const safeSortOrder = sortOrder === "asc" ? "ASC" : "DESC"

    // Count total matching
    const countQuery = `SELECT COUNT(*) as total FROM tenders ${whereClause}`
    const countResult = await sql(countQuery, values)
    const total = Number(countResult[0].total)

    // Fetch page of results (return key fields, not full raw_release for list view)
    const dataQuery = `
      SELECT
        ocid, release_id, release_date, tender_id, title, status, category,
        province, delivery_location, main_procurement_category, description,
        procurement_method, procurement_method_details,
        estimated_value, currency, tender_period_start, tender_period_end,
        buyer_id, buyer_name, procuring_entity_id, procuring_entity_name,
        contact_name, contact_email, contact_phone,
        briefing_is_session, briefing_compulsory, briefing_date, briefing_venue,
        document_count, award_count, total_award_value, synced_at
      FROM tenders
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder} NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const dataResult = await sql(dataQuery, [...values, limit, offset])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        tenders: dataResult,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Failed to query tenders:", error)
    return NextResponse.json(
      { error: "Failed to query tenders from database" },
      { status: 500 }
    )
  }
}
