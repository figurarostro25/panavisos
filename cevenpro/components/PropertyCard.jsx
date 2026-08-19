import Link from "next/link";

export function PropertyCard({ property }) {
  return (
    <article className="property-card">
      <Link className="property-media" href={`/propiedades/${property.slug}`}>
        <img src={property.image} alt={property.title} />
        <span className="property-tag">{property.zone}</span>
      </Link>
      <div className="property-content">
        <span className="property-type">{property.operation} · {property.type}</span>
        <h3><Link href={`/propiedades/${property.slug}`}>{property.title}</Link></h3>
        <p>{property.location}</p>
        <div className="property-facts">
          <strong>{property.priceLabel}</strong>
          <span>{property.area}{property.beds ? ` · ${property.beds} hab.` : ""}</span>
        </div>
        <Link className="property-message-link" href={`/propiedades/${property.slug}#consulta`}>Enviar mensaje</Link>
      </div>
    </article>
  );
}
