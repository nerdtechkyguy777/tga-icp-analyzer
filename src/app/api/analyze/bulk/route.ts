import { NextRequest, NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/analysis/pipeline";
import { parseUrlsFromCsv } from "@/lib/analysis/csv";
import { MAX_BULK_URLS } from "@/lib/analysis/constants";
import { z } from "zod";

const BulkSchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(MAX_BULK_URLS),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let urls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
      }

      const csvText = await file.text();
      const parsed = parseUrlsFromCsv(csvText);
      urls = parsed.map((r) => r.url);

      if (urls.length === 0) {
        return NextResponse.json(
          { error: "No valid URLs found. CSV must have a header row with required column: url" },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      const parsed = BulkSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { errors: parsed.error.errors.map((e) => e.message) },
          { status: 400 }
        );
      }
      urls = parsed.data.urls;
    }

    if (urls.length > MAX_BULK_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BULK_URLS} URLs per batch` },
        { status: 400 }
      );
    }

    const results = [];
    const errors: { url: string; error: string }[] = [];

    for (const url of urls) {
      try {
        const result = await analyzeCompany(url);
        results.push(result);
      } catch (err) {
        errors.push({
          url,
          error: err instanceof Error ? err.message : "Analysis failed",
        });
      }
    }

    return NextResponse.json(
      {
        total: urls.length,
        completed: results.length,
        failed: errors.length,
        results,
        errors,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk analysis failed" },
      { status: 500 }
    );
  }
}
