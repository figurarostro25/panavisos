"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/format";
import { completeOAuthRedirect, getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { getAuthRedirectOrigin } from "@/lib/site";

export default function AccountPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    age: "",
    profession: "",
    website_url: "",
    bio: "",
    interests: ""
  });
  const [activeTab, setActiveTab] = useState("messages");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingAuth, setSavingAuth] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const nextPath = safeNextPath(urlParams.get("next"));
    const requestedTab = normalizeAccountTab(urlParams.get("tab"));
    if (urlParams.get("mode") === "register") setAuthMode("register");
    if (requestedTab) setActiveTab(requestedTab);
    const cameFromOAuth = urlParams.has("code") && !urlParams.get("type");
    const cameFromEmail =
      urlParams.get("type") === "signup" ||
      hashParams.has("access_token") ||
      hashParams.get("type") === "signup";
    const cameFromPublish = urlParams.get("published") === "1";
    const cameFromUpdate = urlParams.get("updated") === "1";

    async function loadSession() {
      await completeOAuthRedirect();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadProfile(data.session);
      await loadMyListings(data.session);
      await loadMyInquiries(data.session);
      if (nextPath && data.session?.user && !cameFromEmail && !cameFromPublish && !cameFromUpdate) {
        window.location.href = nextPath;
      } else if (cameFromOAuth && data.session?.user) {
        setMessage("Sesión iniciada con Google.");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (cameFromEmail && data.session?.user) {
        setMessage("Correo confirmado. Tu cuenta ya está lista.");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (cameFromPublish && data.session?.user) {
        setActiveTab("listings");
        setMessage("Anuncio publicado. Ya aparece activo en tus publicaciones.");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (cameFromUpdate && data.session?.user) {
        setActiveTab("listings");
        setMessage("Cambios guardados. Tu anuncio sigue disponible.");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession);
      loadMyListings(nextSession);
      loadMyInquiries(nextSession);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (new URLSearchParams(window.location.search).get("contacto") !== "1") return;
    setActiveTab("profile");
    window.setTimeout(() => {
      document.getElementById("perfil-contacto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [profile]);

  useEffect(() => {
    if (activeTab !== "messages" || !session?.access_token || loadingInquiries) return;
    const unread = inquiries.filter((inquiry) => inquiry.status === "unread");
    if (!unread.length) return;

    let cancelled = false;
    Promise.all(
      unread.map((inquiry) =>
        fetch(`/api/account/inquiries/${inquiry.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "read" })
        }).then((response) => response.ok)
      )
    ).then((results) => {
      if (cancelled) return;
      const readIds = new Set(unread.filter((_inquiry, index) => results[index]).map((inquiry) => inquiry.id));
      setInquiries((current) =>
        current.map((inquiry) => (readIds.has(inquiry.id) ? { ...inquiry, status: "read" } : inquiry))
      );
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, inquiries, loadingInquiries, session?.access_token]);

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
      profession: data?.profession || "",
      website_url: data?.website_url || "",
      bio: data?.bio || "",
      interests: data?.interests || "",
      points: data?.points || 0,
      referral_code: data?.referral_code || "",
      provider: nextSession.user.app_metadata?.provider || "email"
    };

    setProfile(nextProfile);
    setForm({
      name: nextProfile.name || "",
      email: nextProfile.email || "",
      password: "",
      confirmPassword: "",
      phone: nextProfile.phone || "",
      age: nextProfile.age || "",
      profession: nextProfile.profession || "",
      website_url: nextProfile.website_url || "",
      bio: nextProfile.bio || "",
      interests: nextProfile.interests || ""
    });
  }

  async function loadMyListings(nextSession) {
    if (!nextSession?.access_token) {
      setListings([]);
      setInquiries([]);
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

  async function loadMyInquiries(nextSession) {
    if (!nextSession?.access_token) {
      setInquiries([]);
      return;
    }

    setLoadingInquiries(true);
    const response = await fetch("/api/account/inquiries", {
      headers: {
        Authorization: `Bearer ${nextSession.access_token}`
      }
    });
    const payload = await response.json().catch(() => ({}));
    setInquiries(payload.inquiries || []);
    setLoadingInquiries(false);
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
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (authMode === "register" && form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setSavingAuth(true);
      const supabase = getSupabaseBrowser();
      const nextPath = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      const accountRedirect = `${getAuthRedirectOrigin()}/cuenta${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
      const result =
        authMode === "register"
          ? await supabase.auth.signUp({
              email: form.email,
              password: form.password,
              options: {
                emailRedirectTo: accountRedirect,
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

      if (nextPath && result.data?.session) {
        window.location.href = nextPath;
        return;
      }

      setMessage(
        authMode === "register"
          ? "Cuenta creada. Si se requiere confirmación, revisa tu correo antes de entrar."
          : "Sesión iniciada."
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
      setError("Escribe tu correo para enviarte la recuperación.");
      return;
    }

    try {
      setSavingAuth(true);
      const { error: recoveryError } = await getSupabaseBrowser().auth.resetPasswordForEmail(form.email, {
        redirectTo: `${getAuthRedirectOrigin()}/cuenta`
      });

      if (recoveryError) {
        setError(authErrorMessage(recoveryError.message));
        return;
      }

      setMessage("Te enviamos un enlace para recuperar tu contraseña.");
    } catch {
      setError("No pudimos enviar la recuperación ahora.");
    } finally {
      setSavingAuth(false);
    }
  }

  async function loginWithGoogle() {
    setMessage("");
    setError("");

    try {
      setSavingAuth(true);
      const nextPath = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      const wantsContact = new URLSearchParams(window.location.search).get("contacto") === "1";
      const params = new URLSearchParams();
      if (nextPath) params.set("next", nextPath);
      if (wantsContact) params.set("contacto", "1");
      params.set("tab", accountTabParam(activeTab));
      const accountRedirect = `${getAuthRedirectOrigin()}/cuenta${params.toString() ? `?${params.toString()}` : ""}`;
      const { error: googleError } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: accountRedirect
        }
      });

      if (googleError) {
        setError(authErrorMessage(googleError.message));
      }
    } catch {
      setError("Google todavía no está conectado en Supabase.");
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
          profession: form.profession || null,
          website_url: form.website_url || null,
          bio: form.bio || null,
          interests: form.interests || null,
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

  async function uploadProfilePhoto(files) {
    const file = Array.from(files || [])[0];
    if (!file || !session?.access_token) return;

    setMessage("");
    setError("");
    try {
      const signed = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }).then((response) => response.json());

      if (signed.error) throw new Error(signed.error);

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signed.apiKey);
      body.append("timestamp", signed.timestamp);
      body.append("signature", signed.signature);
      body.append("folder", signed.folder);

      const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
        method: "POST",
        body
      }).then((response) => response.json());

      if (uploaded.error) throw new Error(uploaded.error.message);

      setProfile((current) => ({ ...current, avatar: uploaded.secure_url }));
      setMessage("Foto de perfil cargada. Toca Guardar datos para conservarla.");
    } catch (photoError) {
      setError(photoError.message || "No pudimos subir la foto de perfil.");
    }
  }

  async function updateListingStatus(listing, status) {
    if (!session?.access_token) return;
    setMessage("");
    setError("");

    const response = await fetch(`/api/account/listings/${listing.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ action: "status", status })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "No pudimos actualizar el anuncio.");
      return;
    }

    setListings((current) => current.map((item) => (item.id === listing.id ? payload.listing : item)));
    setMessage(statusMessage(status));
  }

  async function logout() {
    await getSupabaseBrowser().auth.signOut();
    setSession(null);
    setProfile(null);
    setListings([]);
    setInquiries([]);
  }

  function selectAccountTab(tab) {
    const nextTab = normalizeAccountTab(tab) || "messages";
    setActiveTab(nextTab);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", accountTabParam(nextTab));
      window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
    }
  }

  const listingStats = {
    total: listings.length,
    active: listings.filter((listing) => listing.status === "active").length,
    pending: listings.filter((listing) => listing.status === "pending").length,
    sold: listings.filter((listing) => listing.status === "sold").length,
    rented: listings.filter((listing) => listing.status === "rented").length,
    archived: listings.filter((listing) => listing.status === "archived").length
  };
  const messageCount = inquiries.filter((inquiry) => inquiry.status === "unread").length;

  return (
    <>
      <header className="topbar marketplace-topbar">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav className="top-actions">
          <Link href="/">Catálogo</Link>
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
                  {profile.profession ? <p className="profile-profession">{profile.profession}</p> : null}
                  {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
                  {profile.website_url ? (
                    <a className="profile-website" href={profile.website_url} target="_blank" rel="noreferrer">
                      Sitio web
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="account-stats">
                <span><strong>{listingStats.total}</strong> anuncios</span>
                <span><strong>{listingStats.active}</strong> activos</span>
                <span><strong>{listingStats.sold + listingStats.rented}</strong> cerrados</span>
                <span><strong>{listingStats.archived}</strong> archivados</span>
              </div>
              <div className="account-actions">
                <Link className="primary" href="/publicar">
                  Publicar anuncio
                </Link>
                <Link className="secondary" href="/">
                  Ver catálogo
                </Link>
              </div>
              {messageCount ? (
                <a
                  className="account-message-alert"
                  href="/cuenta?tab=mensajes"
                  onClick={(event) => {
                    event.preventDefault();
                    selectAccountTab("messages");
                  }}
                >
                  <span className="notification-bell" aria-hidden="true" />
                  <strong>{messageCount} mensaje{messageCount === 1 ? "" : "s"} recibido{messageCount === 1 ? "" : "s"}</strong>
                  <span>Ver mensajes</span>
                </a>
              ) : null}
              <div className="account-tabs" role="tablist" aria-label="Panel de cuenta">
                <button className={activeTab === "messages" ? "active" : ""} type="button" onClick={() => selectAccountTab("messages")}>
                  Mensajes {messageCount ? <span className="pill">{messageCount}</span> : null}
                </button>
                <button className={activeTab === "listings" ? "active" : ""} type="button" onClick={() => selectAccountTab("listings")}>
                  Mis anuncios
                </button>
                <button className={activeTab === "profile" ? "active" : ""} type="button" onClick={() => selectAccountTab("profile")}>
                  Perfil
                </button>
              </div>
              {activeTab === "messages" ? (
                <section className="my-inquiries-section account-tab-panel" id="mensajes">
                  <div className="section-head compact-head">
                    <div>
                      <h2>Mensajes recibidos</h2>
                      <p className="muted">
                        {loadingInquiries
                          ? "Cargando mensajes..."
                          : "Consultas enviadas desde tus anuncios."}
                      </p>
                    </div>
                    {messageCount ? <span className="pill">{messageCount}</span> : null}
                  </div>
                  {inquiries.length ? (
                    <div className="inquiry-list">
                      {inquiries.map((inquiry) => (
                        <article className="inquiry-card" key={inquiry.id}>
                          <div className="inquiry-card-head">
                            <div>
                              <span className="eyebrow">{formatDate(inquiry.created_at)}</span>
                              <h3>{inquiry.listing?.title || inquiry.listing_title || "Consulta de anuncio"}</h3>
                            </div>
                            {inquiry.listing?.slug ? (
                              <Link className="secondary" href={`/anuncio/${inquiry.listing.slug}`}>
                                Ver anuncio
                              </Link>
                            ) : null}
                          </div>
                          <p className="inquiry-message">{cleanInquiryMessage(inquiry.message)}</p>
                          <div className="inquiry-contact-row">
                            <span>{inquiry.sender_name || "Sin nombre"}</span>
                            {inquiry.sender_email ? <a href={`mailto:${inquiry.sender_email}`}>{inquiry.sender_email}</a> : null}
                            {inquiry.sender_phone ? <a href={`tel:${inquiry.sender_phone}`}>{inquiry.sender_phone}</a> : null}
                            <span className={`message-status ${inquiry.status === "unread" ? "unread" : "read"}`}>
                              {inquiry.status === "unread" ? "Sin leer" : "Leido"}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-account-state compact-empty-state">
                      <h3>Todavía no tienes mensajes</h3>
                      <p className="muted">Cuando alguien escriba desde uno de tus anuncios, aparecerá aquí.</p>
                    </div>
                  )}
                </section>
              ) : null}
              {activeTab === "listings" ? (
                <section className="my-listings-section account-tab-panel" id="anuncios">
                  <div className="section-head compact-head">
                    <div>
                      <h2>Mis anuncios</h2>
                      <p className="muted">{loadingListings ? "Cargando..." : "Edita, marca vendido/alquilado o archiva sin borrar historial."}</p>
                    </div>
                  </div>
                  {listings.length ? (
                    <div className="my-listings-grid">
                      {listings.map((listing) => (
                        <AccountListingCard key={listing.id} listing={listing} onStatusChange={updateListingStatus} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-account-state">
                      <h3>Aún no tienes anuncios</h3>
                      <p className="muted">Cuando publiques, aparecerán aquí como tarjetas pequeñas para editarlos rápido.</p>
                      <Link className="primary" href="/publicar">
                        Crear primer anuncio
                      </Link>
                    </div>
                  )}
                </section>
              ) : null}
              {activeTab === "profile" ? (
                <section className="account-tab-panel" id="perfil-contacto">
                  <div className="section-head compact-head">
                    <div>
                      <h2>Perfil y contacto</h2>
                      <p className="muted">Datos que ayudan a los interesados a reconocer al anunciante.</p>
                    </div>
                  </div>
                  <form className="email-login profile-editor" onSubmit={saveProfile}>
                    <label className="field">
                      <span>Nombre completo</span>
                      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>WhatsApp</span>
                      <input placeholder="Ej: 6000-0000" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    </label>
                    <div className="field-row">
                      <label className="field">
                        <span>Profesión u oficio</span>
                        <input placeholder="Ej: vendedor de autos, asesora financiera, niñera" value={form.profession} onChange={(event) => setForm({ ...form, profession: event.target.value })} />
                      </label>
                      <label className="field">
                        <span>Edad opcional</span>
                        <input type="number" min="13" max="100" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                      </label>
                    </div>
                    <label className="field">
                      <span>Sitio web o redes</span>
                      <input type="url" placeholder="https://..." value={form.website_url} onChange={(event) => setForm({ ...form, website_url: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Descripción del anunciante</span>
                      <textarea rows={4} maxLength={700} placeholder="Cuenta qué ofreces, tu experiencia o qué tipo de negocios te interesa recibir." value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Intereses comerciales</span>
                      <input placeholder="Ej: vender autos, conseguir propiedades, asesorar clientes" value={form.interests} onChange={(event) => setForm({ ...form, interests: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Foto de perfil</span>
                      <input type="file" accept="image/*" onChange={(event) => uploadProfilePhoto(event.target.files)} />
                      <small>Opcional. Ayuda a que tu perfil se vea más confiable.</small>
                    </label>
                    <label className="field">
                      <span>URL de foto</span>
                      <input value={profile?.avatar || ""} onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} placeholder="https://..." />
                    </label>
                    <button className="primary" type="submit">
                      Guardar datos
                    </button>
                  </form>
                </section>
              ) : null}
              <button className="text-button" type="button" onClick={logout}>
                Salir de la cuenta
              </button>
            </>
          ) : (
            <>
              <h1>{authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h1>
              <p className="muted">
                {authMode === "register"
                  ? "Crea tu perfil con nombre, correo y contraseña."
                  : "Accede con Google o con tu correo y contraseña."}
              </p>

              <div className="login-options">
                <button className="google-button-solid active" type="button" onClick={loginWithGoogle} disabled={savingAuth}>
                  Continuar con Google
                </button>
                <div className="auth-divider"><span>O usa tu correo</span></div>
                <form className="email-login" onSubmit={submitAuth}>
                  {authMode === "register" ? (
                    <label className="field">
                      <span>Nombre completo</span>
                      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </label>
                  ) : null}
                  <label className="field">
                    <span>Correo electrónico</span>
                    <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Contraseña</span>
                    <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                  </label>
                  {authMode === "register" ? (
                    <label className="field">
                      <span>Confirmar contraseña</span>
                      <input required type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                    </label>
                  ) : null}
                  <button className="primary" type="submit" disabled={savingAuth}>
                    {savingAuth ? (authMode === "register" ? "Creando cuenta..." : "Iniciando...") : authMode === "register" ? "Crear cuenta" : "Iniciar sesión"}
                  </button>
                  {authMode === "login" ? (
                    <button className="text-button" type="button" onClick={sendRecoveryLink} disabled={savingAuth}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  ) : null}
                  {message ? <p className="notice inline-auth-message">{message}</p> : null}
                  {error ? <p className="error inline-auth-message">{error}</p> : null}
                </form>
                <div className="auth-switch">
                  {authMode === "register" ? (
                    <>
                      <span>¿Ya tienes cuenta?</span>
                      <button type="button" onClick={() => setAuthMode("login")}>
                        Iniciar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <span>¿Aún no tienes cuenta?</span>
                      <button type="button" onClick={() => setAuthMode("register")}>
                        Crear cuenta
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          {profile && message ? <p className="notice">{message}</p> : null}
          {profile && error ? <p className="error">{error}</p> : null}
        </section>

        <aside className="account-side">
          <h2>Qué tendrá tu cuenta</h2>
          <ul>
            <li>Publicar anuncios con tus datos de contacto.</li>
            <li>Editar, marcar vendido/alquilado, archivar o reactivar publicaciones.</li>
            <li>Contactar anunciantes con una identidad clara.</li>
            <li>Usar Google para crear o iniciar sesión rápidamente.</li>
          </ul>
        </aside>
      </main>
    </>
  );
}

function initials(value) {
  const text = String(value || "A").trim();
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function safeNextPath(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (!text.startsWith("/") || text.startsWith("//")) return "";
  return text;
}

function normalizeAccountTab(value) {
  const text = String(value || "").toLowerCase();
  if (["mensajes", "messages", "inbox"].includes(text)) return "messages";
  if (["anuncios", "listings", "mis-anuncios"].includes(text)) return "listings";
  if (["perfil", "profile", "contacto"].includes(text)) return "profile";
  return "";
}

function accountTabParam(tab) {
  const params = {
    messages: "mensajes",
    listings: "anuncios",
    profile: "perfil"
  };
  return params[tab] || "mensajes";
}

function cleanInquiryMessage(value) {
  return String(value || "")
    .split(/\n---\nDatos/i)[0]
    .trim();
}

function formatDate(value) {
  if (!value) return "Reciente";
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function AccountListingCard({ listing, onStatusChange }) {
  const image = [...(listing.images || [])].sort((a, b) => a.position - b.position)[0]?.url;
  const isClosed = listing.status === "sold" || listing.status === "rented";
  const isArchived = listing.status === "archived";
  return (
    <article className="account-listing-card">
      {image ? <img src={image} alt="" /> : <span className="mini-image-placeholder">A</span>}
      <div className="account-listing-body">
        <div>
          <span className={`status-pill ${listing.status || "pending"}`}>{statusLabel(listing.status)}</span>
          <h3>{listing.title}</h3>
          <p className="muted">{listing.district || "Sin ubicación"}, {listing.province}</p>
        </div>
        <strong>{money(listing.price)}</strong>
        <div className="account-listing-actions">
          {listing.slug && !isArchived ? (
            <Link className="secondary" href={`/anuncio/${listing.slug}`}>
              Ver anuncio
            </Link>
          ) : null}
          <Link className="secondary" href={`/publicar?edit=${listing.id}`}>
            Editar
          </Link>
          {listing.status !== "sold" ? (
            <button className="secondary" type="button" onClick={() => onStatusChange(listing, "sold")}>
              Vendido
            </button>
          ) : null}
          {listing.status !== "rented" ? (
            <button className="secondary" type="button" onClick={() => onStatusChange(listing, "rented")}>
              Alquilado
            </button>
          ) : null}
          {(isClosed || isArchived || listing.status === "paused") ? (
            <button className="secondary" type="button" onClick={() => onStatusChange(listing, "active")}>
              Reactivar
            </button>
          ) : null}
          {!isArchived ? (
            <button className="danger" type="button" onClick={() => onStatusChange(listing, "archived")}>
              Archivar
            </button>
          ) : null}
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
    paused: "Pausado",
    sold: "Vendido",
    rented: "Alquilado",
    archived: "Archivado",
    rejected: "Rechazado"
  };
  return labels[status] || "Pendiente";
}

function statusMessage(status) {
  const messages = {
    active: "Anuncio reactivado. Ya vuelve a mostrarse como disponible.",
    sold: "Marcado como vendido. Seguirá visible con una franja de cierre.",
    rented: "Marcado como alquilado. Seguirá visible con una franja de cierre.",
    archived: "Anuncio archivado. Ya no se muestra al público, pero queda en tu historial."
  };
  return messages[status] || "Estado actualizado.";
}

function authErrorMessage(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("already registered") || text.includes("already exists")) {
    return "Ese correo ya tiene cuenta. Prueba iniciar sesión.";
  }
  if (text.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (text.includes("email not confirmed")) {
    return "Falta confirmar tu correo. Revisa tu email.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "No pudimos conectar con Supabase. Revisa en Vercel que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén completas en Production, y redeploya.";
  }
  if (text.includes("password")) {
    return "Revisa la contraseña. Debe tener al menos 6 caracteres.";
  }
  return value || "No pudimos completar la acción.";
}
