"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Eye } from "lucide-react";

interface ReportItem {
  id: string;
  motif: string;
  description: string;
  status: string;
  createdAt: string;
  authorProfile: { displayName: string };
  reportedProfile?: { displayName: string };
  reportedField?: { title: string };
  reportedProduction?: { name: string };
}

const MOTIF_LABELS: Record<string, string> = {
  FALSE_LISTING: "Fausse annonce",
  FALSE_OWNER: "Faux propriétaire",
  SUSPICIOUS_DOCUMENTS: "Documents douteux",
  SCAM_ATTEMPT: "Tentative d'arnaque",
  NON_COMPLIANT_PRODUCT: "Produit non conforme",
  ABUSIVE_BEHAVIOR: "Comportement abusif",
  SUSPICIOUS_ACCOUNT: "Compte suspect",
  USER_DISPUTE: "Litige utilisateurs",
};

const MOTIF_SEVERITY: Record<string, string> = {
  SCAM_ATTEMPT: "var(--destructive)",
  FALSE_OWNER: "var(--destructive)",
  SUSPICIOUS_DOCUMENTS: "var(--secondary)",
  USER_DISPUTE: "var(--secondary)",
  FALSE_LISTING: "var(--muted-foreground)",
  ABUSIVE_BEHAVIOR: "var(--muted-foreground)",
  NON_COMPLIANT_PRODUCT: "var(--muted-foreground)",
  SUSPICIOUS_ACCOUNT: "var(--muted-foreground)",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const resolve = async (id: string, status: "RESOLVED" | "DISMISSED") => {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchReports();
  };

  return (
    <div className="px-10 py-10 max-w-[1100px]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1.5"
          style={{ color: "var(--primary)", opacity: 0.7 }}>Modération</p>
        <div className="flex items-end justify-between">
          <h1 className="text-[2.4rem] font-black leading-none tracking-tight">Signalements</h1>
          {reports.length > 0 && (
            <span className="mb-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "var(--destructive)", color: "white" }}>
              {reports.length} en attente
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <CheckCircle className="w-10 h-10 mb-3" style={{ color: "var(--primary)", opacity: 0.4 }} />
          <p className="font-semibold text-sm">Aucun signalement en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const isOpen = expanded === r.id;
            const severity = MOTIF_SEVERITY[r.motif] ?? "var(--muted-foreground)";
            const target = r.reportedField?.title ?? r.reportedProduction?.name ?? r.reportedProfile?.displayName;

            return (
              <div key={r.id}
                className="rounded-xl border bg-card overflow-hidden transition-all"
                style={{ borderColor: "var(--border)", borderLeftColor: severity, borderLeftWidth: 3 }}>
                <div className="flex items-center gap-4 px-4 py-3.5">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" style={{ color: severity }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-[13px]">
                        {MOTIF_LABELS[r.motif] ?? r.motif}
                      </span>
                      {target && (
                        <span className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                          · {target}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                      Par {r.authorProfile.displayName} · {new Date(r.createdAt).toLocaleDateString("fr-SN")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      aria-label={isOpen ? "Masquer le détail" : "Voir le détail"}
                      aria-expanded={isOpen}
                      className="p-1.5 rounded-lg transition-all hover:bg-accent min-h-11 min-w-11 flex items-center justify-center"
                      style={{ color: "var(--muted-foreground)" }}>
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => resolve(r.id, "RESOLVED")}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90 min-h-11"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                      Résolu
                    </button>
                    <button
                      onClick={() => resolve(r.id, "DISMISSED")}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-90 min-h-11"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                      Ignorer
                    </button>
                  </div>
                </div>

                {/* Détail déplié */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t"
                    style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
                    <p className="text-[13px] mt-3 leading-relaxed">{r.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
