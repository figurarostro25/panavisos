import { NextResponse } from "next/server";
import { INTERNAL_COOKIE } from "@/lib/internalAccess";
import { clearAccountSession } from "@/lib/accountAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAccountSession(response);
  response.cookies.delete(INTERNAL_COOKIE);
  response.cookies.delete("cevenpro_internal_access");
  return response;
}
