"use client";

import { useEffect, useState } from "react";

const decemberIcons = [
  <>
    <path d="M3 14h18l-2-6H8l-3 3H3z" />
    <circle cx="7" cy="16" r="2" />
    <circle cx="17" cy="16" r="2" />
  </>,
  <>
    <path d="M4 10h4l9-5v14l-9-5H4z" />
    <path d="m8 14 2 6h4l-3-7M20 9l2-2M20 15l2 2" />
  </>,
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M16 8.5c-.8-.7-1.8-1-3.1-1-1.8 0-3 .9-3 2.2 0 3.3 6.2 1.3 6.2 4.7 0 1.4-1.3 2.3-3.2 2.3-1.4 0-2.6-.5-3.6-1.4M12 5.5v13" />
  </>,
  <>
    <path d="m3 10 9-7 9 7v10H3z" />
    <path d="M9 20v-6h6v6M3 10h18" />
  </>,
  <>
    <path d="M3 7h12l6 6-8 8-10-10z" />
    <circle cx="8" cy="11" r="1.2" />
    <path d="m10 16 2 2 4-4" />
  </>,
  <>
    <path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10M7.5 5l9 4" />
  </>
];

function currentSeason() {
  const month = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Panama",
      month: "numeric"
    })
      .formatToParts(new Date())
      .find((part) => part.type === "month")?.value
  );

  if (month === 11) return "patria";
  if (month === 12) return "navidad";
  return "";
}

export default function SeasonalDecor() {
  const [season, setSeason] = useState("");

  useEffect(() => {
    function updateSeason() {
      const nextSeason = currentSeason();
      setSeason(nextSeason);
      if (nextSeason) {
        document.documentElement.dataset.season = nextSeason;
      } else {
        delete document.documentElement.dataset.season;
      }
    }

    updateSeason();
    const interval = window.setInterval(updateSeason, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (season !== "navidad") return null;

  return (
    <div className="seasonal-decor seasonal-decor-christmas" aria-hidden="true">
      {decemberIcons.map((icon, index) => (
        <span className={`seasonal-icon seasonal-icon-${index + 1}`} key={index}>
          <svg viewBox="0 0 24 24" focusable="false">
            {icon}
          </svg>
        </span>
      ))}
    </div>
  );
}
