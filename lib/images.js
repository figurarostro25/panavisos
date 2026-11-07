export function optimizeImageUrl(value, width = 640) {
  const url = String(value || "").trim();
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const safeWidth = Math.max(120, Math.min(Number(width) || 640, 1600));
  const [beforeUpload, afterUpload] = url.split("/upload/");
  const pathSegments = afterUpload.split("/");
  const firstSegment = pathSegments[0];
  const hasTransform = /(?:^|,)(?:f_|q_|w_|h_|c_|e_|dpr_)/.test(firstSegment);
  if (hasTransform) pathSegments.shift();
  return `${beforeUpload}/upload/f_auto,q_auto,w_${safeWidth},c_limit/${pathSegments.join("/")}`;
}
