"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", age: "" });

  useEffect(() => {
    const stored = localStorage.getItem("panavisos_profile");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  function saveProfile(nextProfile) {
    localStorage.setItem("panavisos_profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
  }

  function submit(event) {
    event.preventDefault();
    saveProfile({
      name: form.name,
      email: form.email,
      age: form.age
    });
  }

  function social(provider) {
    saveProfile({
      name: provider === "Facebook" ? "Usuario Facebook" : "Usuario Google",
      email: "",
      age: "",
      provider
    });
  }

  function logout() {
    localStorage.removeItem("panavisos_profile");
    setProfile(null);
  }

  return (
    <>
      <header className="topbar marketplace-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">PA</span>
          <span>
            <strong>PanAvisos</strong>
            <small>Cuenta</small>
          </span>
        </Link>
        <nav className="top-actions">
          <Link href="/">Catalogo</Link>
          <Link className="primary" href="/publicar">
            Publicar
          </Link>
        </nav>
      </header>

      <main className="account-page">
        <section className="account-card">
          <span className="eyebrow">Anunciantes</span>
          {profile ? (
            <>
              <div className="profile-summary">
                <span className="avatar large-avatar">{initials(profile.name || profile.email)}</span>
                <div>
                  <h1>{profile.name}</h1>
                  <p className="muted">{profile.email || "Completa tu correo al publicar"}</p>
                </div>
              </div>
              <p className="notice">Cuenta lista para responder y publicar. La conexion real con Google/correo se activa en Supabase Auth.</p>
              <button className="secondary" type="button" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <h1>Entra o crea tu cuenta</h1>
              <p className="muted">
                Registrate rapido para responder anuncios y publicar sin perder tus datos.
              </p>

              <div className="login-options">
                <button className="facebook-button" type="button" onClick={() => social("Facebook")}>
                  Continuar con Facebook
                </button>
                <button className="google-button-solid" type="button" onClick={() => social("Google")}>
                  Conectar con Google
                </button>
                <form className="email-login" onSubmit={submit}>
                  <label className="field">
                    <span>Nombre completo</span>
                    <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Correo electronico</span>
                    <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Edad</span>
                    <input required type="number" min="18" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                  </label>
                  <button className="primary" type="submit">
                    Crear cuenta con correo
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        <aside className="account-side">
          <h2>Que tendra tu cuenta</h2>
          <ul>
            <li>Responder anuncios despues de registrarte.</li>
            <li>Publicar con tus datos basicos completos.</li>
            <li>Ver estado de tus anuncios cuando conectemos Supabase Auth.</li>
            <li>Separar usuarios normales del dashboard administrador.</li>
          </ul>
        </aside>
      </main>
    </>
  );
}

function initials(value) {
  const text = String(value || "PA").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
