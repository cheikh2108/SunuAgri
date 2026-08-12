import { prisma } from "@/lib/prisma";
import { ListingStatus, ReportStatus } from "@/app/generated/prisma/client";
import { FileCheck, Users, Flag, MapPin, ShoppingBasket, TrendingUp } from "lucide-react";
import Link from "next/link";

// Forcer le rafraîchissement des données à chaque visite
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getStats() {
  const [
    totalUsers, suspendedUsers,
    pendingFields, publishedFields,
    pendingProductions, publishedProductions,
    pendingReports,
    fieldsByRegion,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.field.count({ where: { status: ListingStatus.PENDING_VALIDATION } }),
    prisma.field.count({ where: { status: ListingStatus.PUBLISHED } }),
    prisma.production.count({ where: { status: ListingStatus.PENDING_VALIDATION } }),
    prisma.production.count({ where: { status: ListingStatus.PUBLISHED } }),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    prisma.field.groupBy({
      by: ["region"],
      _count: true,
      where: { status: ListingStatus.PUBLISHED },
      orderBy: { _count: { region: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, createdAt: true,
        profiles: { select: { type: true, displayName: true }, take: 1 },
      },
    }),
  ]);

  return {
    totalUsers, suspendedUsers,
    pendingFields, publishedFields,
    pendingProductions, publishedProductions,
    pendingReports,
    fieldsByRegion,
    recentUsers,
    pendingTotal: pendingFields + pendingProductions,
  };
}

export default async function AdminDashboard() {
  const s = await getStats();

  return (
    <div className="px-10 py-10 max-w-[1200px]">

      {/* Header — typographie dramatique */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
          style={{ color: "var(--primary)", opacity: 0.7 }}>
          Back-office
        </p>
        <h1 className="text-[2.8rem] font-black leading-none tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
          Vue d&apos;ensemble de la plateforme SunuAgri
        </p>
      </div>

      {/* KPIs — grid 4 colonnes, cartes avec accent décalé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Utilisateurs"
          value={s.totalUsers}
          sub={`${s.suspendedUsers} suspendu${s.suspendedUsers > 1 ? "s" : ""}`}
          icon={<Users className="w-4 h-4" />}
          accent="var(--primary)"
        />
        <KpiCard
          label="Champs publiés"
          value={s.publishedFields}
          sub={`${s.pendingFields} en attente`}
          icon={<MapPin className="w-4 h-4" />}
          accent="var(--primary)"
          href="/admin/listings?type=fields"
          urgent={s.pendingFields > 0}
        />
        <KpiCard
          label="Productions publiées"
          value={s.publishedProductions}
          sub={`${s.pendingProductions} en attente`}
          icon={<ShoppingBasket className="w-4 h-4" />}
          accent="var(--secondary)"
          href="/admin/listings?type=productions"
          urgent={s.pendingProductions > 0}
        />
        <KpiCard
          label="Signalements"
          value={s.pendingReports}
          sub="en attente de traitement"
          icon={<Flag className="w-4 h-4" />}
          accent="var(--destructive)"
          href="/admin/reports"
          urgent={s.pendingReports > 0}
        />
      </div>

      {/* Bandeau d'action si validation en attente */}
      {s.pendingTotal > 0 && (
        <Link href="/admin/listings"
          className="flex items-center justify-between px-6 py-4 rounded-xl mb-10 transition-all hover:opacity-90 group"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5" />
            <span className="font-semibold text-sm">
              {s.pendingTotal} annonce{s.pendingTotal > 1 ? "s" : ""} en attente de validation
            </span>
          </div>
          <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">
            Valider →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition géographique */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <h2 className="font-semibold text-sm">Champs par région</h2>
          </div>
          {s.fieldsByRegion.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Aucun champ publié pour l&apos;instant
            </p>
          ) : (
            <div className="space-y-3">
              {s.fieldsByRegion.map((r, i) => {
                const max = s.fieldsByRegion[0]._count;
                const pct = Math.round((r._count / max) * 100);
                return (
                  <div key={r.region}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="font-medium">{r.region}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{r._count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--muted)" }}
                      role="img" aria-label={`${r.region} : ${r._count} champ${r._count > 1 ? "s" : ""}, ${pct}%`}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? "var(--primary)" : "var(--secondary)",
                          opacity: 1 - i * 0.12,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Utilisateurs récents */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-sm">Inscrits récents</h2>
            <Link href="/admin/users"
              className="text-xs hover:underline"
              style={{ color: "var(--primary)" }}>
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {s.recentUsers.map((u) => {
              const profile = u.profiles[0];
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                    {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">
                      {profile?.displayName ?? "—"}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {profile?.type ?? "—"} · {new Date(u.createdAt).toLocaleDateString("fr-SN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, icon, accent, href, urgent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
  urgent?: boolean;
}) {
  const inner = (
    <div className="relative rounded-xl border bg-card p-5 overflow-hidden transition-all hover:shadow-md group"
      style={{ borderColor: urgent ? accent : "var(--border)" }}>
      {/* Barre colorée en haut à gauche */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3 pl-2">
        <div className="p-1.5 rounded-md" style={{ background: `color-mix(in oklch, ${accent} 15%, transparent)` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {urgent && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `color-mix(in oklch, ${accent} 15%, transparent)`, color: accent }}>
            Action
          </span>
        )}
      </div>
      <p className="text-[2rem] font-black leading-none tracking-tight pl-2">{value}</p>
      <p className="text-[12px] font-semibold mt-1 pl-2">{label}</p>
      <p className="text-[11px] mt-0.5 pl-2" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
    </div>
  );

  if (href) return (
    <Link href={href} aria-label={`${label} — ${value} (${sub})`}>
      {inner}
    </Link>
  );
  return inner;
}
