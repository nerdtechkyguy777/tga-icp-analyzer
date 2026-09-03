import { NextRequest, NextResponse } from "next/server";
import { getICP, publishICP } from "@/lib/icp/service";
import { getAuthContext, requireAdmin } from "@/lib/auth";

export async function GET() {
  const icp = await getICP();
  return NextResponse.json(icp);
}

export async function PUT(request: NextRequest) {
  const auth = getAuthContext(request);
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const result = await publishICP({
      ...body,
      updatedBy: body.updatedBy ?? auth.email,
    });

    if (!result.success) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({
      message: `ICP Version ${result.version} published successfully`,
      version: result.version,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
