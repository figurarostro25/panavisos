import { NextResponse } from "next/server";
import { requireInternalUser } from "@/lib/apiAuth";

export const runtime = "nodejs";

function getCloudName() {
  const configuredCloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (configuredCloudName) return configuredCloudName;

  const connectionString = String(process.env.CLOUDINARY_URL || "")
    .trim()
    .replace(/^CLOUDINARY_URL=/i, "")
    .replace(/^["']|["']$/g, "");

  if (connectionString) {
    try {
      const parsed = new URL(connectionString);
      if (parsed.protocol === "cloudinary:") return parsed.hostname;
    } catch {
      return "";
    }
  }

  return "";
}

export async function POST() {
  const user = await requireInternalUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para cargar fotografías." }, { status: 401 });
  const cloudName = getCloudName();
  const uploadPreset = String(process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();
  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: "La carga de fotos aún no está conectada." }, { status: 503 });
  }

  return NextResponse.json({ cloudName, uploadPreset });
}
