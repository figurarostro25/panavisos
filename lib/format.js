export const provinces = [
  "Bocas del Toro",
  "Chiriqui",
  "Cocle",
  "Colon",
  "Darien",
  "Herrera",
  "Los Santos",
  "Panama",
  "Panama Oeste",
  "Veraguas",
  "Guna Yala",
  "Ngabe-Bugle",
  "Embera-Wounaan"
];

export const provinceCenters = {
  "Bocas del Toro": [9.3403, -82.242],
  Chiriqui: [8.4273, -82.4308],
  Cocle: [8.508, -80.359],
  Colon: [9.3592, -79.9014],
  Darien: [8.3989, -77.7187],
  Herrera: [7.7704, -80.7214],
  "Los Santos": [7.5909, -80.3659],
  Panama: [8.9824, -79.5199],
  "Panama Oeste": [8.8796, -79.7836],
  Veraguas: [8.1006, -80.9831],
  "Guna Yala": [9.57, -78.95],
  "Ngabe-Bugle": [8.744, -81.744],
  "Embera-Wounaan": [8.376, -78.139]
};

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function money(value) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function whatsappDialNumber(value, defaultCountryCode = "507") {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (raw.startsWith("+") || raw.startsWith("00")) {
    return raw.startsWith("00") ? digits.replace(/^00/, "") : digits;
  }

  if (digits.startsWith(defaultCountryCode)) return digits;
  if (digits.length === 7 || digits.length === 8) return `${defaultCountryCode}${digits}`;
  return digits;
}
