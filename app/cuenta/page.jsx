"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "", age: "" });
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
      password: "",
      confirmPassword: "",
      phone: nextProfile.phone || "",
      age: nextProfile.age || ""
    });
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
        setError(result.error.message);
        return;
      }

      setMessage(
        authMode === "register"
          ? "Cuenta creada. Si se requiere confirmacion, revisa tu correo antes de entrar."
          : "Sesion iniciada."
      );
    } catch {
      setError("No pudimos completar el acceso ahora. Revisa tus datos e intenta nuevamente.");
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
      const { error: recoveryError } = await getSupabaseBrowser().auth.resetPasswordForEmail(form.email, {
        redirectTo: window.location.origin + "/cuenta"
      });

      if (recoveryError) {
        setError(recoveryError.message);
        return;
      }

      setMessage("Te enviamos un enlace para recuperar tu contrasena.");
    } catch {
      setError("No pudimos enviar la recuperacion ahora.");
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
                  <button className="primary" type="submit">
                    {authMode === "register" ? "Crear cuenta" : "Iniciar sesion"}
                  </button>
                  {authMode === "login" ? (
                    <button className="text-button" type="button" onClick={sendRecoveryLink}>
                      Olvidaste tu contrasena?
                    </button>
                  ) : null}
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
