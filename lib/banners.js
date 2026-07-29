export function bannerPayload(body) {
  return {
    title: body.title,
    subtitle: body.subtitle || null,
    cta_label: body.cta_label || null,
    cta_url: body.cta_url || null,
    image_url: body.image_url || null,
    placement: body.placement || "home",
    status: body.status || "active",
    sort_order: Number(body.sort_order || 0),
    starts_at: startOfDay(body.starts_at),
    ends_at: endOfDay(body.ends_at),
    updated_at: new Date().toISOString()
  };
}

function startOfDay(value) {
  if (!value) return null;
  if (String(value).includes("T")) return value;
  return `${value}T00:00:00.000Z`;
}

function endOfDay(value) {
  if (!value) return null;
  if (String(value).includes("T")) return value;
  return `${value}T23:59:59.999Z`;
}
