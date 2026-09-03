import { NextRequest, NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/analysis/pipeline";
import { getAnalyses, getAnalysis } from "@/lib/icp/storage";
import { normalizeCompanyUrl, isValidCompanyUrl } from "@/lib/utils";
import { z } from "zod";

const AnalyzeSchema = z.object({
  url: z
    .string()
    .min(1, "Company URL is required")
    .refine((v) => isValidCompanyUrl(v), "Enter a valid domain or URL (e.g. konecranes.com)"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AnalyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const url = normalizeCompanyUrl(parsed.data.url);
    const result = await analyzeCompany(url);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const analysis = await getAnalysis(id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    return NextResponse.json(analysis);
  }

  const analyses = await getAnalyses();
  return NextResponse.json(analyses);
}
