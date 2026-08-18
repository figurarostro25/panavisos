import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const role = await getAdminRole();
  return NextResponse.json({ authenticated: Boolean(role), role });
}
