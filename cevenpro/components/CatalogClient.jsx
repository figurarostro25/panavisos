"use client";

import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";

export function CatalogClient({ properties, initialFilters = {} }) {
  const [operation, setOperation] = useState(initialFilters.operation || "");
  const [type, setType] = useState(initialFilters.type || "");
  const [province, setProvince] = useState(initialFilters.province || "");
  const [zone, setZone] = useState(initialFilters.zone || "");
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || "");
  const [query, setQuery] = useState(initialFilters.query || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return properties.filter((property) => {
      if (operation && property.operation !== operation) return false;
      if (type && property.type !== type) return false;
      if (province && property.province !== province) return false;
      if (zone && property.zone !== zone) return false;
      if (maxPrice && Number(property.price || 0) > Number(maxPrice)) return false;
      if (search && !`${property.title} ${property.location} ${property.zone} ${property.province} ${property.type}`.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [maxPrice, operation, properties, province, query, type, zone]);

  function clear() {
    setOperation("");
    setType("");
    setProvince("");
    setZone("");
    setMaxPrice("");
    setQuery("");
  }

  const activeFilterCount = [operation, type, province, zone, maxPrice, query].filter(Boolean).length;

  return (
    <div className="catalog-layout">
      <aside className={`filters${filtersOpen ? " is-open" : ""}`}>
        <div className="filters-header"><h2>Buscar clasificados</h2><button className="filters-toggle" type="button" onClick={() => setFiltersOpen((current) => !current)} aria-controls="catalog-filter-controls" aria-expanded={filtersOpen}>Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""} <span aria-hidden="true">{filtersOpen ? "^" : "v"}</span></button></div>
        <div className="filters-content" id="catalog-filter-controls">
          <div className="filters-priority">
            <label>Provincia<select value={province} onChange={(event) => setProvince(event.target.value)}><option value="">Todo Panamá</option>{[...new Set(properties.map((item) => item.province).filter(Boolean))].sort().map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Presupuesto máximo<select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Cualquier precio</option><option value="100000">Hasta USD 100,000</option><option value="250000">Hasta USD 250,000</option><option value="500000">Hasta USD 500,000</option><option value="1000000">Hasta USD 1,000,000</option></select></label>
          </div>
          <div className="filters-secondary">
            <label>Palabra clave<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Apartamento, Costa del Este..." /></label>
            <label>Operación<select value={operation} onChange={(event) => setOperation(event.target.value)}><option value="">Todas</option><option>Venta</option><option>Alquiler</option></select></label>
            <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Todos</option>{[...new Set(properties.map((item) => item.type))].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Sector o zona<select value={zone} onChange={(event) => setZone(event.target.value)}><option value="">Todos</option>{[...new Set(properties.map((item) => item.zone).filter(Boolean))].sort().map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          {activeFilterCount ? <button className="filter-clear" type="button" onClick={clear}>Limpiar filtros</button> : null}
        </div>
      </aside>
      <div className="catalog-main">
        <div className="catalog-summary"><div><span className="eyebrow">Clasificados Cevenpro</span><h1>Propiedades en Panamá</h1><p>{filtered.length} {filtered.length === 1 ? "propiedad disponible" : "propiedades disponibles"} para explorar.</p></div></div>
        <div className="property-grid">{filtered.map((property) => <PropertyCard key={property.slug} property={property} />)}</div>
        {!filtered.length ? <div className="admin-placeholder"><div><strong>No encontramos coincidencias.</strong><p>Prueba una zona o tipo diferente.</p></div></div> : null}
      </div>
    </div>
  );
}
