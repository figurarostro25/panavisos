import { NextResponse } from "next/server";
import { getPublicProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export async function GET() {
  const properties = await getPublicProperties();
  return NextResponse.json({ properties, total: properties.length });
}
