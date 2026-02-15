import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ocid: string }> }
) {
  const { ocid } = await params

  if (!ocid) {
    return NextResponse.json({ error: "ocid is required" }, { status: 400 })
  }

  try {
    const result = await sql`
      SELECT raw_release FROM tenders WHERE ocid = ${ocid} LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Tender not found" }, { status: 404 })
    }

    return NextResponse.json(result[0].raw_release, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch tender detail:", error)
    return NextResponse.json(
      { error: "Failed to fetch tender from database" },
      { status: 500 }
    )
  }
}
