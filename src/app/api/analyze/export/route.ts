import { NextRequest, NextResponse } from "next/server";
import { getAnalyses, getAnalysis } from "@/lib/icp/storage";
import { analysesToCsv } from "@/lib/analysis/csv";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const batchId = request.nextUrl.searchParams.get("batch");

  let analyses = await getAnalyses();

  if (idsParam) {
    const ids = idsParam.split(",").map((id) => id.trim());
    const resolved = await Promise.all(ids.map((id) => getAnalysis(id)));
    analyses = resolved.filter((a): a is NonNullable<typeof a> => a !== null);
  }

  if (analyses.length === 0) {
    return NextResponse.json({ error: "No analyses to export" }, { status: 404 });
  }

  const csv = analysesToCsv(analyses);
  const filename = batchId
    ? `tga-icp-analysis-${batchId}.csv`
    : `tga-icp-analysis-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
