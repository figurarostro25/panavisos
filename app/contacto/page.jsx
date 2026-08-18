"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completeOAuthRedirect, getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { getAuthRedirectOrigin } from "@/lib/site";

const initialForm = {
  subject: "",
  message: ""
};

export default function ContactPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    async function loadSession() {
      await completeOAuthRedirect();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      hydrateProfile(data.session);
      if (data.session?.user && new URLSearchParams(window.location.search).has("code")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      hydrateProfile(nextSession);
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  function hydrateProfile(nextSession) {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    const metadata = nextSession.user.user_metadata || {};
    setProfile({
      name: metadata.full_name || metadata.name || nextSession.user.email,
      email: nextSession.user.email,
      avatar: metadata.avatar_url || metadata.picture || "",
      provider: nextSession.user.app_metadata?.provider || "email"
    });
  }

  async function loginWithGoogle() {
    setMessage("");
    setError("");
    setSending(true);
    try {
      const { error: googleError } = await getSupabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getAuthRedirectOrigin()}/contacto`
        }
      });
      if (googleError) setError(googleError.message);
    } catch {
      setError("No pudimos abrir Google en este momento.");
    } finally {
      setSending(false);
    }
  }

  async function submitContact(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!session?.access_token || profile?.provider !== "google") {
      setError("Para enviar un mensaje, entra primero con Google.");
      return;
    }

    if (!form.message.trim() || form.message.trim().length < 6) {
      setError("Escribe un mensaje un poco más claro.");
      return;
    }

    const clientMeta = {
      language: navigator.language || "",
      languages: Array.isArray(navigator.languages) ? navigator.languages.join(", ") : "",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      page: window.location.href
    };

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          kind: "support",
          subject: form.subject || "Contacto desde PanAvisos",
          message: form.message,
          sender_name: profile.name,
          sender_email: profile.email,
          client_meta: clientMeta
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No pudimos enviar el mensaje.");

      setForm(initialForm);
      setMessage("Mensaje enviado. Gracias por ayudarnos a mejorar PanAvisos.");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSending(false);
    }
  }

  const canSend = session?.access_token && profile?.provider === "google";

  return (
    <main className="contact-page">
      <header className="lead-header contact-header">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/brand/panavisos-logo.svg" alt="PanAvisos" />
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/propiedades">Propiedades</Link>
          <Link href="/marketplace">Marketplace</Link>
          <Link href="/publicar">Publicar</Link>
        </nav>
      </header>

      <section className="contact-shell">
        <div className="contact-copy">
          <span className="eyebrow">Contacto privado</span>
          <h1>Escríbenos una sugerencia, error o idea</h1>
          <p>
            Este buzón es para comentarios reales de usuarios: categorías que faltan, errores al publicar, mejoras o
            ideas para que PanAvisos sea más útil.
          </p>
          <ul>
            <li>Pedimos Google solo para confirmar que el mensaje viene de una persona real.</li>
            <li>Tu mensaje llega al panel de administración.</li>
            <li>Guardamos país/región aproximada e idioma del navegador si están disponibles.</li>
          </ul>
        </div>

        <form className="contact-card" onSubmit={submitContact}>
          <div className="contact-card-head">
            <span className="eyebrow">Enviar mensaje</span>
            <h2>Contacto con PanAvisos</h2>
            {profile ? (
              <p className="muted">Entraste como {profile.email}.</p>
            ) : (
              <p className="muted">Primero entra con Google para habilitar el formulario.</p>
            )}
          </div>

          {!canSend ? (
            <button className="google-button-solid active" type="button" onClick={loginWithGoogle} disabled={sending}>
              Continuar con Google
            </button>
          ) : null}

          <label className="field">
            <span>Asunto</span>
            <input
              disabled={!canSend}
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              placeholder="Ej. sugerencia, error, categoría nueva"
            />
          </label>

          <label className="field">
            <span>Mensaje</span>
            <textarea
              required
              disabled={!canSend}
              rows={7}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Cuéntanos qué viste, qué mejorarías o qué categoría necesitas."
            />
          </label>

          <button className="primary" type="submit" disabled={!canSend || sending}>
            {sending ? "Enviando..." : "Enviar mensaje"}
          </button>

          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
