import { NextRequest, NextResponse } from "next/server";
import { getVersion, restoreVersion } from "@/lib/icp/service";
import { getAuthContext, requireAdmin } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const { version } = await params;
  const record = await getVersion(version);

  if (!record) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const auth = getAuthContext(request);
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const { version } = await params;
  const result = await restoreVersion(version, auth.email);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({
    message: `Restored from version ${version}. New version: ${result.version}`,
    version: result.version,
  });
}
