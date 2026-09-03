import { NextResponse } from "next/server";
import { getHistory } from "@/lib/icp/service";

export async function GET() {
  const history = await getHistory();
  return NextResponse.json(history);
}
