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
    updated_at: new Date().toISOString()
  };
}
