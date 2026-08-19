"use client";

import { useState } from "react";

export function InternalLogoutButton({ redirectTo }) {
  const [sending, setSending] = useState(false);

  async function logout() {
    setSending(true);
    try {
      await fetch("/api/internal-logout", { method: "POST" });
    } finally {
      window.location.assign(redirectTo);
    }
  }

  return (
    <button className="button outline small" disabled={sending} onClick={logout} type="button">
      {sending ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
