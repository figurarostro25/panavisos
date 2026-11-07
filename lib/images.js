export function optimizeImageUrl(value, width = 640) {
  const url = String(value || "").trim();
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const safeWidth = Math.max(120, Math.min(Number(width) || 640, 1600));
  return url.replace(/\/upload\//, (uploadPath, offset, fullUrl) => {
    const afterUpload = fullUrl.slice(offset + uploadPath.length);
    const firstSegment = afterUpload.split("/")[0];
    const hasTransform = /(?:^|,)(?:f_|q_|w_|h_|c_|e_|dpr_)/.test(firstSegment);
    const suffix = hasTransform ? afterUpload.slice(firstSegment.length + 1) : afterUpload;
    return `/upload/f_auto,q_auto,w_${safeWidth},c_limit/${suffix}`;
  });
}
