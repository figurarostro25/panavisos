"use client";

import { useState } from "react";

export function MasterAccountSetup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const response = await fetch("/api/account/master-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible activar la cuenta.");
      window.location.assign("/admin");
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  }
  return <main className="internal-access-page"><form className="internal-access-card" onSubmit={submit}><img src="/brand/cevenpro-logo.svg" alt="Cevenpro" /><span className="eyebrow">Configuración inicial</span><h1>Activa tu cuenta master</h1><p>Esta cuenta personal sustituye la clave compartida y habilita la recuperación de contraseña.</p><label>Nombre<input required name="name" value={form.name} onChange={update} autoComplete="name" /></label><label>Correo de administración<input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" /></label><label>Nueva contraseña<input required type="password" minLength="10" name="password" value={form.password} onChange={update} autoComplete="new-password" /></label>{error ? <p className="form-status error">{error}</p> : null}<button className="button teal" disabled={saving} type="submit">{saving ? "Activando..." : "Activar cuenta master"}</button></form></main>;
}
