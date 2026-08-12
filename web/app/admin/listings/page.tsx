"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, ShoppingBasket, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Eye, Calendar, Ruler
} from "lucide-react";

type ListingType = "fields" | "productions";
type ActionType = "approve" | "reject" | "suspend";

interface FieldListing {
  id: string;
  title: string;
  operationType: string;
  region: string;
  commune: string;
  areaSqm: number;
  price?: number;
  createdAt: string;
  profile: { displayName: string; verificationLevels: string[] };
  medias: { url: string }[];
}

interface ProductionListing {
  id: string;
  name: string;
  category: string;
  offerType: string;
  region: string;
  quantityAvailable: number;
  quantityUnit: string;
  price: number;
  createdAt: string;
  profile: { displayName: string; verificationLevels: string[] };
  medias: { url: string }[];
}

export default function ListingsPage() {
  const [tab, setTab] = useState<ListingType>("fields");
  const [fields, setFields] = useState<FieldListing[]>([]);
  const [productions, setProductions] = useState<ProductionListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: ListingType } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ totalFields: number; totalProductions: number; totalPages: number; total: number } | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings?type=all&status=PENDING_VALIDATION&page=${page}&limit=20`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      setFields(data.fields ?? []);
      setProductions(data.productions ?? []);
      setMeta(data.meta ?? null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const act = async (listingType: ListingType, listingId: string, action: ActionType, reason?: string) => {
    setActing(listingId);
    await fetch("/api/admin/listings", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingType: listingType === "fields" ? "field" : "production", listingId, action, reason }),
    });
    setActing(null);
    setRejectModal(null);
    setRejectReason("");
    fetchListings();
  };

  const items = tab === "fields" ? fields : productions;
  const pendingCount = meta?.total ?? (fields.length + productions.length);

  return (
    <div className="px-10 py-10 max-w-[1100px]">

      {/* Header avec compteur urgent */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1.5"
          style={{ color: "var(--primary)", opacity: 0.7 }}>Modération</p>
        <div className="flex items-end gap-4">
          <h1 className="text-[2.4rem] font-black leading-none tracking-tight">Annonces</h1>
          {pendingCount > 0 && (
            <span className="mb-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {pendingCount} en attente
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Type d'annonce"
        className="flex gap-1 p-1 rounded-lg mb-6 w-fit"
        style={{ background: "var(--muted)" }}>
        {(["fields", "productions"] as ListingType[]).map((t) => {
          const count = t === "fields" ? (meta?.totalFields ?? fields.length) : (meta?.totalProductions ?? productions.length);
          const isActive = tab === t;
          return (
            <button key={t}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${t}`}
              id={`tab-${t}`}
              onClick={() => { setTab(t); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all min-h-11"
              style={{
                background: isActive ? "var(--card)" : "transparent",
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: isActive ? "0 1px 3px oklch(0 0 0 / 0.08)" : undefined,
              }}>
              {t === "fields" ? <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> : <ShoppingBasket className="w-3.5 h-3.5" aria-hidden="true" />}
              {t === "fields" ? "Champs" : "Productions"}
              {count > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed"
          style={{ borderColor: "var(--border)" }}>
          <CheckCircle className="w-10 h-10 mb-3" style={{ color: "var(--primary)", opacity: 0.4 }} />
          <p className="font-semibold text-sm">File vide</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Aucune annonce en attente de validation
          </p>
        </div>
      ) : (
        <>
          <div
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="space-y-3">
            {items.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                type={tab}
                acting={acting === item.id}
                onApprove={() => act(tab, item.id, "approve")}
                onReject={() => setRejectModal({ id: item.id, type: tab })}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
                Page {page} sur {meta.totalPages} · {tab === "fields" ? meta.totalFields : meta.totalProductions} {tab === "fields" ? "champs" : "productions"} au total
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity min-h-11"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                  ← Précédent
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity min-h-11"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal rejet */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0 0 0 / 0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectModal(null); setRejectReason(""); } }}
          onKeyDown={(e) => { if (e.key === "Escape") { setRejectModal(null); setRejectReason(""); } }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl border"
            style={{ borderColor: "var(--border)" }}>
            <h3 id="reject-modal-title" className="font-bold text-base mb-1">Motif de refus</h3>
            <p className="text-[13px] mb-4" style={{ color: "var(--muted-foreground)" }}>
              Ce motif sera transmis au propriétaire de l&apos;annonce.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex : Photos manquantes, description insuffisante…"
              rows={3}
              autoFocus
              aria-label="Motif de refus"
              className="w-full rounded-lg px-3 py-2.5 text-[13px] resize-none outline-none focus:ring-2 focus:ring-ring"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2 rounded-lg text-[13px] font-medium min-h-11"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                Annuler
              </button>
              <button
                disabled={!rejectReason.trim()}
                aria-busy={acting === rejectModal.id}
                onClick={() => act(rejectModal.type, rejectModal.id, "reject", rejectReason)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium disabled:opacity-40 transition-opacity min-h-11"
                style={{ background: "var(--destructive)", color: "white" }}>
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  item, type, acting, onApprove, onReject
}: {
  item: FieldListing | ProductionListing;
  type: ListingType;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isField = type === "fields";
  const f = item as FieldListing;
  const p = item as ProductionListing;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-sm"
      style={{ borderColor: "var(--border)" }}>

      {/* Miniature ou icône */}
      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: "var(--accent)" }}>
        {item.medias?.[0]?.url ? (
          <img src={item.medias[0].url} alt="" className="w-full h-full object-cover" />
        ) : isField ? (
          <MapPin className="w-5 h-5" style={{ color: "var(--accent-foreground)", opacity: 0.5 }} />
        ) : (
          <ShoppingBasket className="w-5 h-5" style={{ color: "var(--accent-foreground)", opacity: 0.5 }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span className="font-semibold text-[14px] truncate">{isField ? f.title : p.name}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {isField ? f.operationType : p.offerType}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {isField ? `${f.region} · ${f.commune}` : p.region}
          </span>
          {isField ? (
            <span className="flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {f.areaSqm} ha
            </span>
          ) : (
            <span>{p.quantityAvailable} {p.quantityUnit}</span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.createdAt).toLocaleDateString("fr-SN")}
          </span>
        </div>
        <p className="text-[12px] mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>
          Par <span style={{ color: "var(--foreground)" }}>{item.profile.displayName}</span>
          {item.profile.verificationLevels.includes("ID_VERIFIED") && (
            <span className="ml-1.5 text-[10px] px-1 rounded" style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
              ✓ Vérifié
            </span>
          )}
        </p>
      </div>

      {/* Prix */}
      <div className="text-right shrink-0 mr-2">
        <p className="font-bold text-[15px]">
          {isField ? (f.price ? `${f.price.toLocaleString()} F` : "—") : `${p.price.toLocaleString()} F`}
        </p>
        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>XOF</p>
      </div>

      {/* Actions — hiérarchie claire : approuver = primary, rejeter = destructive */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onApprove}
          disabled={acting}
          aria-busy={acting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-all hover:opacity-90 min-h-11"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {acting ? "…" : "Approuver"}
        </button>
        <button
          onClick={onReject}
          disabled={acting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-40 transition-all hover:opacity-90 min-h-11"
          style={{ background: "color-mix(in oklch, var(--destructive) 12%, transparent)", color: "var(--destructive)" }}>
          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
          Refuser
        </button>
      </div>
    </div>
  );
}
