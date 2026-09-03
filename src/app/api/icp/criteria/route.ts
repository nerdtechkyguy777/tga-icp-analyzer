import { NextRequest, NextResponse } from "next/server";
import { addCriterion } from "@/lib/icp/service";
import { ICPCriterionSchema } from "@/lib/icp/validation";
import { getAuthContext, requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request);
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const parsed = ICPCriterionSchema.safeParse(body.criterion ?? body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const result = await addCriterion(
      parsed.data,
      body.updatedBy ?? auth.email,
      body.changeSummary
    );

    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json(
      { message: `Criterion added. ICP Version ${result.version} published.`, version: result.version },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
