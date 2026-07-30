"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", age: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(nextSession) {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    const supabase = getSupabaseBrowser();
    const { data } = await supabase.from("profiles").select("*").eq("id", nextSession.user.id).maybeSingle();
    const metadata = nextSession.user.user_metadata || {};
    const nextProfile = {
      id: nextSession.user.id,
      name: data?.full_name || metadata.full_name || metadata.name || nextSession.user.email,
      email: nextSession.user.email,
      phone: data?.phone || "",
      age: data?.age || metadata.age || "",
      avatar: data?.avatar_url || metadata.avatar_url || metadata.picture || "",
      provider: nextSession.user.app_metadata?.provider || "email"
    };

    setProfile(nextProfile);
    setForm({
      name: nextProfile.name || "",
      email: nextProfile.email || "",
      phone: nextProfile.phone || "",
      age: nextProfile.age || ""
    });
  }

  async function sendEmailLink(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (authMode === "register" && !form.name.trim()) {
      setError("Escribe tu nombre completo para crear la cuenta.");
      return;
    }

    try {
      const { error: otpError } = await getSupabaseBrowser().auth.signInWithOtp({
        email: form.email,
        options: {
          emailRedirectTo: window.location.origin + "/cuenta",
          data: form.name.trim() ? { full_name: form.name.trim() } : undefined
        }
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setMessage(
        authMode === "register"
          ? "Te enviamos un enlace para confirmar tu cuenta."
          : "Te enviamos un enlace para entrar a tu correo."
      );
    } catch {
      setError("No pudimos enviar el enlace ahora. Revisa el correo e intenta nuevamente.");
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!session?.user) return;
    setMessage("");
    setError("");

    const { error: profileError } = await getSupabaseBrowser()
      .from("profiles")
      .upsert(
        {
          id: session.user.id,
          full_name: form.name,
          phone: form.phone || null,
          age: form.age ? Number(form.age) : null,
          avatar_url: profile?.avatar || null,
          provider: profile?.provider || "email",
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setMessage("Perfil actualizado.");
    await loadProfile(session);
  }

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    setSession(null);
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
                {profile.avatar ? (
                  <img className="profile-photo" src={profile.avatar} alt="" />
                ) : (
                  <span className="avatar large-avatar">{initials(profile.name || profile.email)}</span>
                )}
                <div>
                  <h1>{profile.name}</h1>
                  <p className="muted">{profile.email}</p>
                </div>
              </div>
              <form className="email-login" onSubmit={saveProfile}>
                <label className="field">
                  <span>Nombre completo</span>
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="field">
                  <span>WhatsApp</span>
                  <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label className="field">
                  <span>Edad</span>
                  <input type="number" min="18" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                </label>
                <button className="primary" type="submit">
                  Guardar perfil
                </button>
              </form>
              <button className="secondary" type="button" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <h1>{authMode === "register" ? "Crea tu cuenta" : "Inicia sesion"}</h1>
              <p className="muted">
                {authMode === "register"
                  ? "Crea tu perfil con nombre y correo. Te enviaremos un enlace seguro para confirmar."
                  : "Escribe tu correo y te enviaremos un enlace seguro para entrar."}
              </p>

              <div className="login-options">
                <form className="email-login" onSubmit={sendEmailLink}>
                  {authMode === "register" ? (
                    <label className="field">
                      <span>Nombre completo</span>
                      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </label>
                  ) : null}
                  <label className="field">
                    <span>Correo electronico</span>
                    <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                  </label>
                  <button className="primary" type="submit">
                    {authMode === "register" ? "Crear cuenta por correo" : "Enviar enlace de acceso"}
                  </button>
                </form>
                <div className="auth-switch">
                  {authMode === "register" ? (
                    <>
                      <span>Ya tienes cuenta?</span>
                      <button type="button" onClick={() => setAuthMode("login")}>
                        Inicia sesion
                      </button>
                    </>
                  ) : (
                    <>
                      <span>Aun no tienes cuenta?</span>
                      <button type="button" onClick={() => setAuthMode("register")}>
                        Crear cuenta
                      </button>
                    </>
                  )}
                </div>
                <div className="social-disabled-group" aria-label="Opciones disponibles proximamente">
                  <p className="muted center-text">Google y Facebook se conectan despues.</p>
                  <button className="facebook-button" type="button" disabled>
                    Facebook proximamente
                  </button>
                  <button className="google-button-solid" type="button" disabled>
                    Google proximamente
                  </button>
                </div>
              </div>
            </>
          )}
          {message ? <p className="notice">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </section>

        <aside className="account-side">
          <h2>Que tendra tu cuenta</h2>
          <ul>
            <li>Responder anuncios despues de registrarte.</li>
            <li>Publicar con tus datos basicos completos.</li>
            <li>Relacionar tus anuncios a tu usuario real.</li>
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
