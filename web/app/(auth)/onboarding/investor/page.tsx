"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, TrendingUp, User } from "lucide-react";
import { SENEGAL_REGIONS, DEPARTMENTS_BY_REGION, COMMUNES_BY_DEPARTMENT } from "@/components/onboarding/location-data";

export default function OnboardingInvestorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [activityArea, setActivityArea] = useState("");
  const [region, setRegion] = useState("");
  const [department, setDepartment] = useState("");
  const [commune, setCommune] = useState("");
  const [locality, setLocality] = useState("");

  const departments = region ? DEPARTMENTS_BY_REGION[region] || [] : [];
  const communes = department ? COMMUNES_BY_DEPARTMENT[department] || [] : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!displayName.trim()) {
        setError("Le nom complet est obligatoire");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INVESTOR",
          displayName: displayName.trim(),
          photoUrl: photoUrl.trim() || undefined,
          activityArea: activityArea.trim() || undefined,
          region: region || undefined,
          department: department || undefined,
          commune: commune || undefined,
          locality: locality.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError("Erreur réseau, réessayez.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)" }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M12 20l6 6 10-12" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: "var(--foreground)" }}>
            Profil créé avec succès !
          </h1>
          <p className="text-[14px]" style={{ color: "var(--foreground)", opacity: 0.6 }}>
            Redirection vers votre tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: "var(--background)" }}>
      <div className="max-w-[560px] mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-8 px-3 py-2 rounded-lg transition-colors"
          style={{ color: "var(--foreground)", opacity: 0.7 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.background = "var(--muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[14px] font-medium">Retour</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "color-mix(in oklch, oklch(0.52 0.20 280) 15%, transparent)" }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: "oklch(0.52 0.20 280)" }} />
            </div>
            <div>
              <h1 className="text-[1.8rem] font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                Profil Investisseur
              </h1>
              <p className="text-[13px]" style={{ color: "oklch(0.52 0.20 280)" }}>
                Investissez dans des projets agricoles
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label htmlFor="displayName" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              Nom complet ou raison sociale <span style={{ color: "var(--destructive)" }}>*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--foreground)", opacity: 0.35 }} />
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Abdoulaye Ndiaye"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="photoUrl" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              Photo de profil (URL)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--foreground)", opacity: 0.35 }} />
              <input
                id="photoUrl"
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              />
            </div>
          </div>

          <div>
            <label htmlFor="activityArea" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              Domaines d'intérêt (optionnel)
            </label>
            <input
              id="activityArea"
              type="text"
              value={activityArea}
              onChange={(e) => setActivityArea(e.target.value)}
              placeholder="Ex: Agrobusiness, Élevage, Transformation..."
              className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              Région (optionnel)
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setDepartment("");
                setCommune("");
              }}
              className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: region ? "var(--foreground)" : "var(--muted-foreground)",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <option value="">Sélectionnez une région</option>
              {SENEGAL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {region && (
            <>
              <div>
                <label htmlFor="department" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
                  Département
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setCommune("");
                  }}
                  className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: department ? "var(--foreground)" : "var(--muted-foreground)",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <option value="">Sélectionnez un département</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="commune" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
                  Commune
                </label>
                {communes.length > 0 ? (
                  <select
                    id="commune"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: commune ? "var(--foreground)" : "var(--muted-foreground)",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <option value="">Sélectionnez une commune</option>
                    {communes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="commune"
                    type="text"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Entrez le nom de la commune"
                    className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  />
                )}
              </div>

              <div>
                <label htmlFor="locality" className="block text-[13px] font-semibold mb-2" style={{ color: "var(--foreground)", opacity: 0.85 }}>
                  Localité / Quartier
                </label>
                <input
                  id="locality"
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Ex: Almadies"
                  className="w-full px-4 py-3 rounded-xl text-[14px] transition-colors"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
              </div>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl text-[13px] font-medium"
              style={{
                background: "color-mix(in oklch, var(--destructive) 12%, transparent)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[15px] transition-opacity disabled:opacity-60 hover:opacity-90 mt-8"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Création en cours..." : "Créer mon profil"}
          </button>
        </form>
      </div>
    </div>
  );
}
