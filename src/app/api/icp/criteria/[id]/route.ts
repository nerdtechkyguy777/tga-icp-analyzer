import { NextRequest, NextResponse } from "next/server";
import { deleteCriterion, updateCriterion, toggleCriterion } from "@/lib/icp/service";
import { ICPCriterionSchema } from "@/lib/icp/validation";
import { getAuthContext, requireAdmin } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthContext(request);
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const { id } = await params;
  const result = await deleteCriterion(id, auth.email);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({
    message: `Criterion deleted. ICP Version ${result.version} published.`,
    version: result.version,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthContext(request);
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const { id } = await params;

  try {
    const body = await request.json();

    if (body.action === "toggle") {
      const result = await toggleCriterion(id, body.active, auth.email);
      if (!result.success) {
        return NextResponse.json({ errors: result.errors }, { status: 400 });
      }
      return NextResponse.json({ version: result.version });
    }

    const parsed = ICPCriterionSchema.safeParse(body.criterion ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.errors.map((e) => e.message) },
        { status: 400 }
      );
    }

    const result = await updateCriterion(id, parsed.data, auth.email, body.changeSummary);
    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ version: result.version });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
