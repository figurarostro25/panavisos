export function optimizeImageUrl(value, width = 640) {
  const url = String(value || "").trim();
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("f_auto") || url.includes("q_auto")) return url;

  const safeWidth = Math.max(120, Math.min(Number(width) || 640, 1600));
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${safeWidth},c_limit/`);
}
