"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", age: "" });
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingAuth, setSavingAuth] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const cameFromEmail =
      urlParams.has("code") ||
      urlParams.get("type") === "signup" ||
      hashParams.has("access_token") ||
      hashParams.get("type") === "signup";

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session);
      await loadMyListings(data.session);
      if (cameFromEmail && data.session?.user) {
        setMessage("Correo confirmado. Tu cuenta ya esta lista.");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession);
      loadMyListings(nextSession);
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
      password: "",
      confirmPassword: "",
      phone: nextProfile.phone || "",
      age: nextProfile.age || ""
    });
  }

  async function loadMyListings(nextSession) {
    if (!nextSession?.access_token) {
      setListings([]);
      return;
    }

    setLoadingListings(true);
    const response = await fetch("/api/account/listings", {
      headers: {
        Authorization: `Bearer ${nextSession.access_token}`
      }
    });
    const payload = await response.json().catch(() => ({}));
    setListings(payload.listings || []);
    setLoadingListings(false);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (authMode === "register" && !form.name.trim()) {
      setError("Escribe tu nombre completo para crear la cuenta.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (authMode === "register" && form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    try {
      setSavingAuth(true);
      const supabase = getSupabaseBrowser();
      const result =
        authMode === "register"
          ? await supabase.auth.signUp({
              email: form.email,
              password: form.password,
              options: {
                emailRedirectTo: window.location.origin + "/cuenta",
                data: { full_name: form.name.trim() }
              }
            })
          : await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password
            });

      if (result.error) {
        setError(authErrorMessage(result.error.message));
        return;
      }

      setMessage(
        authMode === "register"
          ? "Cuenta creada. Si se requiere confirmacion, revisa tu correo antes de entrar."
          : "Sesion iniciada."
      );
    } catch {
      setError("No pudimos completar el acceso ahora. Revisa tus datos e intenta nuevamente.");
    } finally {
      setSavingAuth(false);
    }
  }

  async function sendRecoveryLink() {
    setMessage("");
    setError("");

    if (!form.email) {
      setError("Escribe tu correo para enviarte la recuperacion.");
      return;
    }

    try {
      setSavingAuth(true);
      const { error: recoveryError } = await getSupabaseBrowser().auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin + "/cuenta"
      });

      if (recoveryError) {
        setError(authErrorMessage(recoveryError.message));
        return;
      }

      setMessage("Te enviamos un enlace para recuperar tu contrasena.");
    } catch {
      setError("No pudimos enviar la recuperacion ahora.");
    } finally {
      setSavingAuth(false);
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
    setListings([]);
  }

  const listingStats = {
    total: listings.length,
    active: listings.filter((listing) => listing.status === "active").length,
    pending: listings.filter((listing) => listing.status === "pending").length,
    inactive: listings.filter((listing) => listing.status === "inactive").length
  };

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
        <section className={`account-card ${profile ? "account-dashboard-card" : ""}`}>
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
              <div className="account-stats">
                <span><strong>{listingStats.total}</strong> anuncios</span>
                <span><strong>{listingStats.active}</strong> activos</span>
                <span><strong>{listingStats.pending}</strong> pendientes</span>
                <span><strong>{listingStats.inactive}</strong> pausados</span>
              </div>
              <div className="account-actions">
                <Link className="primary" href="/publicar">
                  Publicar anuncio
                </Link>
                <Link className="secondary" href="/">
                  Ver catalogo
                </Link>
              </div>
              <section className="my-listings-section">
                <div className="section-head compact-head">
                  <div>
                    <h2>Mis anuncios</h2>
                    <p className="muted">{loadingListings ? "Cargando..." : "Edita, revisa estado o publica mas."}</p>
                  </div>
                </div>
                {listings.length ? (
                  <div className="my-listings-grid">
                    {listings.map((listing) => (
                      <AccountListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-account-state">
                    <h3>Aun no tienes anuncios</h3>
                    <p className="muted">Cuando publiques, apareceran aqui como tarjetas pequenas para editarlos rapido.</p>
                    <Link className="primary" href="/publicar">
                      Crear primer anuncio
                    </Link>
                  </div>
                )}
              </section>
              <button className="secondary" type="button" onClick={() => setShowProfileEditor((value) => !value)}>
                {showProfileEditor ? "Ocultar datos de contacto" : "Completar datos de contacto"}
              </button>
              {showProfileEditor ? (
                <form className="email-login profile-editor" onSubmit={saveProfile}>
                  <label className="field">
                    <span>Nombre completo</span>
                    <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>WhatsApp</span>
                    <input placeholder="Ej: 6000-0000" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                  </label>
                  <button className="primary" type="submit">
                    Guardar datos
                  </button>
                </form>
              ) : null}
              <button className="text-button" type="button" onClick={logout}>
                Salir de la cuenta
              </button>
            </>
          ) : (
            <>
              <h1>{authMode === "register" ? "Crea tu cuenta" : "Inicia sesion"}</h1>
              <p className="muted">
                {authMode === "register"
                  ? "Crea tu perfil con nombre, correo y contrasena."
                  : "Entra con tu correo y contrasena."}
              </p>

              <div className="login-options">
                <form className="email-login" onSubmit={submitAuth}>
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
                  <label className="field">
                    <span>Contrasena</span>
                    <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                  </label>
                  {authMode === "register" ? (
                    <label className="field">
                      <span>Confirmar contrasena</span>
                      <input required type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                    </label>
                  ) : null}
                  <button className="primary" type="submit" disabled={savingAuth}>
                    {savingAuth ? (authMode === "register" ? "Creando cuenta..." : "Entrando...") : authMode === "register" ? "Crear cuenta" : "Iniciar sesion"}
                  </button>
                  {authMode === "login" ? (
                    <button className="text-button" type="button" onClick={sendRecoveryLink} disabled={savingAuth}>
                      Olvidaste tu contrasena?
                    </button>
                  ) : null}
                  {message ? <p className="notice inline-auth-message">{message}</p> : null}
                  {error ? <p className="error inline-auth-message">{error}</p> : null}
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
          {profile && message ? <p className="notice">{message}</p> : null}
          {profile && error ? <p className="error">{error}</p> : null}
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

function AccountListingCard({ listing }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
  return (
    <article className="account-listing-card">
      {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">PA</span>}
      <div className="account-listing-body">
        <div>
          <span className={`status-pill ${listing.status || "pending"}`}>{statusLabel(listing.status)}</span>
          <h3>{listing.title}</h3>
          <p className="muted">{listing.district || "Sin ubicacion"}, {listing.province}</p>
        </div>
        <strong>{money(listing.price)}</strong>
        <div className="account-listing-actions">
          <Link className="secondary" href={`/publicar?edit=${listing.id}`}>
            Editar
          </Link>
        </div>
      </div>
    </article>
  );
}

function statusLabel(status) {
  const labels = {
    active: "Activo",
    pending: "Pendiente",
    inactive: "Pausado",
    rejected: "Rechazado"
  };
  return labels[status] || "Pendiente";
}

function authErrorMessage(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("already registered") || text.includes("already exists")) {
    return "Ese correo ya tiene cuenta. Prueba iniciar sesion.";
  }
  if (text.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos.";
  }
  if (text.includes("email not confirmed")) {
    return "Falta confirmar tu correo. Revisa tu email.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "No pudimos conectar con Supabase. Revisa en Vercel que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY esten completas en Production, y redeploya.";
  }
  if (text.includes("password")) {
    return "Revisa la contrasena. Debe tener al menos 6 caracteres.";
  }
  return value || "No pudimos completar la accion.";
}
