"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminRecoveryPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    setSaving(true);
    const response = await fetch("/api/admin/recovery/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmation })
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || "No se pudo cambiar la clave.");
      return;
    }

    setStatus("Clave actualizada. Ya puedes entrar al panel con tu correo y la nueva clave.");
    setPassword("");
    setConfirmation("");
  }

  return (
    <main className="admin-shell">
      <form className="login panel" onSubmit={submit}>
        <span className="eyebrow">PanAvisos</span>
        <h1>Restablecer clave</h1>
        <p className="muted">Crea una nueva clave para el acceso propietario del panel.</p>
        <label className="field">
          <span>Nueva clave</span>
          <input type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className="field">
          <span>Repetir clave</span>
          <input type="password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}
        <button className="primary" type="submit" disabled={saving || !token}>
          {saving ? "Guardando..." : "Guardar nueva clave"}
        </button>
        <Link className="secondary" href="/admin">Volver al panel</Link>
      </form>
    </main>
  );
}
