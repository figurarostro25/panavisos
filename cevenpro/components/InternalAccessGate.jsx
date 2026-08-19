"use client";

import { useState } from "react";

export function InternalAccessGate({ role, title }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/internal-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible validar el acceso.");
      window.location.reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="internal-access-page">
      <form className="internal-access-card" onSubmit={submit}>
        <img src="/brand/cevenpro-logo.svg" alt="Cevenpro" />
        <span className="eyebrow">Acceso interno</span>
        <h1>{title}</h1>
        <p>Ingresa con tu correo y contraseña. Si estás activando el panel por primera vez, usa temporalmente el usuario asignado.</p>
        <label>Correo o usuario<input required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
        <label>Clave de acceso<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error ? <p className="form-status error" role="alert">{error}</p> : null}
        <button className="button teal" disabled={sending} type="submit">{sending ? "Validando..." : "Entrar"}</button>
        <a href="/recuperar-acceso">¿Olvidaste tu contraseña?</a>
        <a href="/">Volver al sitio</a>
      </form>
    </main>
  );
}
