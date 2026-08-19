"use client";

import { useState } from "react";

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState(""); const [status, setStatus] = useState(""); const [sending, setSending] = useState(false);
  async function submit(event) { event.preventDefault(); setSending(true); setStatus(""); try { const response = await fetch("/api/account/password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const data = await response.json(); setStatus(data.message || "Revisa tu correo."); } finally { setSending(false); } }
  return <main className="internal-access-page"><form className="internal-access-card" onSubmit={submit}><img src="/brand/cevenpro-logo.svg" alt="Cevenpro" /><span className="eyebrow">Acceso interno</span><h1>Recuperar contraseña</h1><p>Te enviaremos un enlace de recuperación si el correo pertenece a una cuenta activa.</p><label>Correo<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{status ? <p className="form-status">{status}</p> : null}<button className="button teal" disabled={sending}>{sending ? "Enviando..." : "Enviar enlace"}</button><a href="/admin">Volver al acceso</a></form></main>;
}

export function PasswordResetForm({ token }) {
  const [password, setPassword] = useState(""); const [status, setStatus] = useState(""); const [sending, setSending] = useState(false);
  async function submit(event) { event.preventDefault(); setSending(true); setStatus(""); try { const response = await fetch("/api/account/password-reset", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setStatus("Contraseña actualizada. Ya puedes iniciar sesión."); } catch (error) { setStatus(error.message); } finally { setSending(false); } }
  return <main className="internal-access-page"><form className="internal-access-card" onSubmit={submit}><img src="/brand/cevenpro-logo.svg" alt="Cevenpro" /><span className="eyebrow">Acceso interno</span><h1>Nueva contraseña</h1><p>Elige una contraseña de al menos 10 caracteres.</p><label>Nueva contraseña<input required minLength="10" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{status ? <p className={`form-status ${status.includes("puedes iniciar") ? "" : "error"}`}>{status}</p> : null}<button className="button teal" disabled={sending}>{sending ? "Actualizando..." : "Guardar contraseña"}</button><a href="/admin">Ir al acceso</a></form></main>;
}
