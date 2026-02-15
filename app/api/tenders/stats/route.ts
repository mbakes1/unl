import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const [totalResult, statusResult, provinceResult, categoryResult] =
      await Promise.all([
        sql`SELECT COUNT(*) as total FROM tenders`,
        sql`
        SELECT status, COUNT(*) as count
        FROM tenders
        WHERE status IS NOT NULL AND status != ''
        GROUP BY status
        ORDER BY count DESC
      `,
        sql`
        SELECT province, COUNT(*) as count
        FROM tenders
        WHERE province IS NOT NULL AND province != ''
        GROUP BY province
        ORDER BY count DESC
      `,
        sql`
        SELECT category, COUNT(*) as count
        FROM tenders
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `,
      ])

    const uniqueEntities = await sql`
      SELECT COUNT(DISTINCT buyer_name) as count
      FROM tenders
      WHERE buyer_name IS NOT NULL AND buyer_name != ''
    `

    return NextResponse.json(
      {
        total: Number(totalResult[0].total),
        byStatus: statusResult.map((r) => ({
          status: r.status,
          count: Number(r.count),
        })),
        byProvince: provinceResult.map((r) => ({
          province: r.province,
          count: Number(r.count),
        })),
        byCategory: categoryResult.map((r) => ({
          category: r.category,
          count: Number(r.count),
        })),
        uniqueEntities: Number(uniqueEntities[0].count),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Failed to get tender stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
