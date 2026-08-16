import { provinceCenters, provinces } from "@/lib/format";

export const locationSuggestions = [
  { label: "Parque Lefevre, Panama", province: "Panama", district: "Parque Lefevre" },
  { label: "Rio Abajo, Panama", province: "Panama", district: "Rio Abajo" },
  { label: "Pueblo Nuevo, Panama", province: "Panama", district: "Pueblo Nuevo" },
  { label: "Betania, Panama", province: "Panama", district: "Betania" },
  { label: "El Dorado, Panama", province: "Panama", district: "El Dorado" },
  { label: "Condado del Rey, Panama", province: "Panama", district: "Condado del Rey" },
  { label: "12 de Octubre, Panama", province: "Panama", district: "12 de Octubre" },
  { label: "Hato Pintado, Panama", province: "Panama", district: "Hato Pintado" },
  { label: "Via Argentina, Panama", province: "Panama", district: "Via Argentina" },
  { label: "Coronado, Panama Oeste", province: "Panama Oeste", district: "Coronado" },
  { label: "San Francisco, Panama", province: "Panama", district: "San Francisco" },
  { label: "El Cangrejo, Panama", province: "Panama", district: "El Cangrejo" },
  { label: "Obarrio, Panama", province: "Panama", district: "Obarrio" },
  { label: "Costa del Este, Panama", province: "Panama", district: "Costa del Este" },
  { label: "Punta Pacifica, Panama", province: "Panama", district: "Punta Pacifica" },
  { label: "Paitilla, Panama", province: "Panama", district: "Paitilla" },
  { label: "Marbella, Panama", province: "Panama", district: "Marbella" },
  { label: "Bella Vista, Panama", province: "Panama", district: "Bella Vista" },
  { label: "Via Espana, Panama", province: "Panama", district: "Via Espana" },
  { label: "Tumba Muerto, Panama", province: "Panama", district: "Tumba Muerto" },
  { label: "Brisas del Golf, Panama", province: "Panama", district: "Brisas del Golf" },
  { label: "Juan Diaz, Panama", province: "Panama", district: "Juan Diaz" },
  { label: "Los Pueblos, Panama", province: "Panama", district: "Los Pueblos" },
  { label: "Don Bosco, Panama", province: "Panama", district: "Don Bosco" },
  { label: "Pedregal, Panama", province: "Panama", district: "Pedregal" },
  { label: "Las Cumbres, Panama", province: "Panama", district: "Las Cumbres" },
  { label: "Las Mananitas, Panama", province: "Panama", district: "Las Mananitas" },
  { label: "24 de Diciembre, Panama", province: "Panama", district: "24 de Diciembre" },
  { label: "Tocumen, Panama", province: "Panama", district: "Tocumen" },
  { label: "Panama Pacifico, Panama Oeste", province: "Panama Oeste", district: "Panama Pacifico" },
  { label: "Veracruz, Panama Oeste", province: "Panama Oeste", district: "Veracruz" },
  { label: "Arraijan, Panama Oeste", province: "Panama Oeste", district: "Arraijan" },
  { label: "La Chorrera, Panama Oeste", province: "Panama Oeste", district: "La Chorrera" },
  { label: "Nuevo Arraijan, Panama Oeste", province: "Panama Oeste", district: "Nuevo Arraijan" },
  { label: "Vista Alegre, Panama Oeste", province: "Panama Oeste", district: "Vista Alegre" },
  { label: "Chorrera Centro, Panama Oeste", province: "Panama Oeste", district: "Chorrera Centro" },
  { label: "San Carlos, Panama Oeste", province: "Panama Oeste", district: "San Carlos" },
  { label: "Boquete, Chiriqui", province: "Chiriqui", district: "Boquete" },
  { label: "David, Chiriqui", province: "Chiriqui", district: "David" },
  { label: "Santiago, Veraguas", province: "Veraguas", district: "Santiago" },
  { label: "Penonome, Cocle", province: "Cocle", district: "Penonome" },
  { label: "Chitre, Herrera", province: "Herrera", district: "Chitre" },
  { label: "Las Tablas, Los Santos", province: "Los Santos", district: "Las Tablas" }
];

const districtCenters = {
  "Parque Lefevre": [9.004, -79.489],
  "Rio Abajo": [9.008, -79.497],
  "Pueblo Nuevo": [9.016, -79.52],
  Betania: [9.014, -79.535],
  "El Dorado": [9.003, -79.539],
  "Condado del Rey": [9.034, -79.532],
  "12 de Octubre": [9.031, -79.503],
  "Hato Pintado": [9.013, -79.514],
  "Via Argentina": [8.989, -79.522],
  Coronado: [8.535, -79.89],
  "San Francisco": [8.991, -79.507],
  "El Cangrejo": [8.992, -79.53],
  Obarrio: [8.982, -79.52],
  "Costa del Este": [9.01, -79.476],
  "Punta Pacifica": [8.979, -79.51],
  Paitilla: [8.975, -79.515],
  Marbella: [8.981, -79.52],
  "Bella Vista": [8.982, -79.526],
  "Via Espana": [9.0, -79.516],
  "Tumba Muerto": [9.024, -79.535],
  "Brisas del Golf": [9.052, -79.463],
  "Juan Diaz": [9.037, -79.441],
  "Los Pueblos": [9.047, -79.452],
  "Don Bosco": [9.047, -79.426],
  Pedregal: [9.071, -79.438],
  "Las Cumbres": [9.092, -79.533],
  "Las Mananitas": [9.082, -79.453],
  "24 de Diciembre": [9.094, -79.364],
  Tocumen: [9.071, -79.383],
  "Panama Pacifico": [8.914, -79.599],
  Veracruz: [8.887, -79.626],
  Arraijan: [8.951, -79.66],
  "La Chorrera": [8.879, -79.783],
  "Nuevo Arraijan": [8.924, -79.721],
  "Vista Alegre": [8.929, -79.699],
  "Chorrera Centro": [8.879, -79.783],
  "San Carlos": [8.473, -79.96],
  Boquete: [8.78, -82.441],
  David: [8.433, -82.433],
  Santiago: [8.101, -80.983],
  Penonome: [8.519, -80.36],
  Chitre: [7.961, -80.429],
  "Las Tablas": [7.765, -80.28]
};

export function locationCoordinates(location) {
  const center = districtCenters[location?.district] || provinceCenters[location?.province];
  return center ? { lat: center[0], lng: center[1] } : { lat: null, lng: null };
}

export const searchAreaOptions = [
  ...locationSuggestions.map((location) => ({
    ...location,
    ...locationCoordinates(location),
    key: `district:${location.province}:${location.district}`
  })),
  ...provinces.map((province) => ({
    key: `province:${province}`,
    label: `Provincia de ${province}`,
    province,
    district: "",
    lat: provinceCenters[province]?.[0] ?? null,
    lng: provinceCenters[province]?.[1] ?? null
  }))
];

export function distanceInKm(firstLat, firstLng, secondLat, secondLng) {
  if ([firstLat, firstLng, secondLat, secondLng].some((value) => value === null || value === undefined || value === "")) {
    return null;
  }

  const values = [firstLat, firstLng, secondLat, secondLng].map(Number);
  if (!values.every(Number.isFinite)) return null;

  const [lat1, lng1, lat2, lng2] = values.map((value) => (value * Math.PI) / 180);
  const deltaLat = lat2 - lat1;
  const deltaLng = lng2 - lng1;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
