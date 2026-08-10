"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Phone, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Identifiants incorrects"); return; }
      router.push("/admin");
    } catch {
      setError("Erreur réseau, réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--sidebar)" }}>

      {/* Panneau gauche — branding, caché sur mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
        style={{ borderRight: "1px solid var(--sidebar-border)" }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--sidebar-primary)" }}>
            <Sprout className="w-5 h-5" style={{ color: "var(--sidebar-primary-foreground)" }} />
          </div>
          <span className="font-black text-lg tracking-tight"
            style={{ color: "var(--sidebar-primary)" }}>SunuAgri</span>
        </div>

        <div className="-ml-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] mb-4"
            style={{ color: "var(--sidebar-primary)" }}>
            Plateforme agricole
          </p>
          <p className="text-[3.2rem] font-black leading-[1.05] tracking-tight"
            style={{ color: "var(--sidebar-foreground)" }}>
            Connecter<br />la terre<br />et le marché
          </p>
          {/* Contraste suffisant — opacity min 0.6 pour le texte secondaire */}
          <p className="mt-5 text-[14px] leading-relaxed max-w-[280px]"
            style={{ color: "var(--sidebar-foreground)", opacity: 0.65 }}>
            La plateforme de référence pour le foncier agricole et la commercialisation au Sénégal.
          </p>
        </div>

        <p className="text-[12px]" style={{ color: "var(--sidebar-foreground)", opacity: 0.45 }}>
          © 2026 SunuAgri · ATAABA Expertise
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">

          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden" aria-hidden="true">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--sidebar-primary)" }}>
              <Sprout className="w-4 h-4" style={{ color: "var(--sidebar-primary-foreground)" }} />
            </div>
            <span className="font-black tracking-tight"
              style={{ color: "var(--sidebar-primary)" }}>SunuAgri</span>
          </div>

          {/* h1 = titre principal de la page */}
          <h1 className="text-[1.6rem] font-black tracking-tight mb-1"
            style={{ color: "var(--sidebar-foreground)" }}>
            Connexion
          </h1>
          <p className="text-[13px] mb-8" style={{ color: "var(--sidebar-foreground)", opacity: 0.65 }}>
            Accès réservé aux administrateurs
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div>
              <label
                htmlFor="phone"
                className="block text-[12px] font-semibold mb-1.5"
                style={{ color: "var(--sidebar-foreground)", opacity: 0.75 }}>
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--sidebar-foreground)", opacity: 0.35 }} aria-hidden="true" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 7X XXX XX XX"
                  autoComplete="tel"
                  required
                  aria-required="true"
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-[14px] transition-colors min-h-[44px]"
                  style={{
                    background: "var(--sidebar-accent)",
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--sidebar-foreground)",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = "0 0 0 2px var(--sidebar-primary)"}
                  onBlur={(e) => e.currentTarget.style.boxShadow = "none"}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-semibold mb-1.5"
                style={{ color: "var(--sidebar-foreground)", opacity: 0.75 }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--sidebar-foreground)", opacity: 0.35 }} aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-[14px] transition-colors min-h-[44px]"
                  style={{
                    background: "var(--sidebar-accent)",
                    border: "1px solid var(--sidebar-border)",
                    color: "var(--sidebar-foreground)",
                    outline: "none",
                  }}
                  onFocus={(e) => e.currentTarget.style.boxShadow = "0 0 0 2px var(--sidebar-primary)"}
                  onBlur={(e) => e.currentTarget.style.boxShadow = "none"}
                />
              </div>
            </div>

            {/* Message d'erreur — role alert pour screen readers */}
            {error && (
              <p
                id="login-error"
                role="alert"
                className="text-[13px] px-3 py-2.5 rounded-lg"
                style={{ background: "color-mix(in oklch, var(--destructive) 12%, transparent)", color: "var(--destructive)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-opacity disabled:opacity-60 hover:opacity-90 min-h-[44px] mt-2"
              style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
