"use client";

import { useRouter } from "next/navigation";
import { Sprout, MapPin, Wheat, ShoppingCart, TrendingUp, Tractor } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  const profileTypes = [
    {
      icon: MapPin,
      title: "J'ai une terre à louer/vendre",
      subtitle: "Propriétaire foncier",
      description: "Mettre en location ou vendre des terres agricoles",
      path: "/onboarding/owner",
      color: "oklch(0.42 0.14 145)", // vert SunuAgri
    },
    {
      icon: Wheat,
      title: "Je veux vendre ma production",
      subtitle: "Producteur agricole",
      description: "Commercialiser vos récoltes et productions",
      path: "/onboarding/producer",
      color: "oklch(0.78 0.16 72)", // ambre
    },
    {
      icon: ShoppingCart,
      title: "Je veux acheter des produits",
      subtitle: "Acheteur",
      description: "Trouver et acheter des produits agricoles",
      path: "/onboarding/buyer",
      color: "oklch(0.55 0.18 200)", // bleu
    },
    {
      icon: TrendingUp,
      title: "Je cherche à investir",
      subtitle: "Investisseur",
      description: "Investir dans des projets agricoles",
      path: "/onboarding/investor",
      color: "oklch(0.52 0.20 280)", // violet
    },
    {
      icon: Tractor,
      title: "J'offre des services agricoles",
      subtitle: "Prestataire",
      description: "Proposer des services d'équipement ou d'expertise",
      path: "/onboarding/provider",
      color: "oklch(0.48 0.16 40)", // orange
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-[720px]">
        {/* Logo + titre */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <Sprout className="w-6 h-6" style={{ color: "var(--primary-foreground)" }} />
            </div>
            <span className="font-black text-2xl tracking-tight" style={{ color: "var(--primary)" }}>
              SunuAgri
            </span>
          </div>

          <h1 className="text-[2rem] font-black tracking-tight mb-3" style={{ color: "var(--foreground)" }}>
            Bienvenue !
          </h1>
          <p className="text-[15px]" style={{ color: "var(--foreground)", opacity: 0.7 }}>
            Que voulez-vous faire sur SunuAgri ?
          </p>
        </div>

        {/* Cartes de sélection */}
        <div className="space-y-3 mb-8">
          {profileTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.path}
                onClick={() => router.push(type.path)}
                className="w-full p-5 rounded-2xl border-2 transition-all text-left group hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = type.color;
                  e.currentTarget.style.boxShadow = `0 8px 24px color-mix(in oklch, ${type.color} 25%, transparent)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `color-mix(in oklch, ${type.color} 15%, transparent)` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: type.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[16px] font-bold mb-0.5" style={{ color: "var(--foreground)" }}>
                      {type.title}
                    </h2>
                    <p className="text-[13px] font-medium mb-1" style={{ color: type.color }}>
                      {type.subtitle}
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                      {type.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="transition-transform group-hover:translate-x-1"
                    >
                      <path
                        d="M7.5 15l5-5-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--foreground)", opacity: 0.3 }}
                      />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lien "Continuer sans profil" */}
        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-[13px] px-4 py-2 rounded-lg transition-colors"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "var(--muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.6";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Continuer sans profil
          </button>
          <p className="text-[12px] mt-2" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            (navigation limitée)
          </p>
        </div>
      </div>
    </div>
  );
}
