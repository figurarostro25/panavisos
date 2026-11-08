import { getListingContactLinks } from "@/lib/externalLinks";

function SocialIcon({ kind }) {
  if (kind === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
        <circle cx="12" cy="12" r="4.1" />
        <circle className="social-icon-dot" cx="17.7" cy="6.7" r="1" />
      </svg>
    );
  }

  if (kind === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M13.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.3 2.5 3.4 5.5 3.4 9s-1.1 6.5-3.4 9c-2.3-2.5-3.4-5.5-3.4-9S9.7 5.5 12 3z" />
    </svg>
  );
}

export default function ListingSocialLinks({ listing }) {
  const links = getListingContactLinks(listing);
  const items = [
    links.instagramUrl && { kind: "instagram", label: "Instagram", href: links.instagramUrl },
    links.facebookUrl && { kind: "facebook", label: "Facebook", href: links.facebookUrl },
    links.websiteUrl && { kind: "website", label: "Sitio web", href: links.websiteUrl }
  ].filter(Boolean);

  return items.map((item) => (
    <a
      className={`listing-social-link ${item.kind}`}
      href={item.href}
      key={item.kind}
      target="_blank"
      rel="ugc nofollow noreferrer"
      aria-label={`Abrir ${item.label} del anunciante en una pestaña nueva`}
    >
      <SocialIcon kind={item.kind} />
      <span>{item.label}</span>
    </a>
  ));
}
