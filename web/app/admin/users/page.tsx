"use client";

import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShieldOff, ShieldCheck, UserCheck } from "lucide-react";

interface UserItem {
  id: string;
  phone: string | null;
  email: string | null;
  isSuspended: boolean;
  createdAt: string;
  profiles: {
    id: string;
    type: string;
    displayName: string;
    verificationLevels: string[];
    _count: { fields: number; productions: number };
  }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSuspended, setFilterSuspended] = useState<"all" | "suspended">("all");
  const [acting, setActing] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filterSuspended === "suspended") params.set("suspended", "true");
    try {
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      setUsers(data.data ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, filterSuspended, page]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers, search]);

  const act = async (userId: string, action: string, profileId?: string) => {
    setActing(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, profileId }),
    });
    setActing(null);
    fetchUsers();
  };

  return (
    <div className="px-10 py-10 max-w-[1100px]">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-1.5"
          style={{ color: "var(--primary)", opacity: 0.7 }}>Modération</p>
        <div className="flex items-end justify-between">
          <h1 className="text-[2.4rem] font-black leading-none tracking-tight">Utilisateurs</h1>
          <span className="mb-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
            {total} au total
          </span>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "var(--muted-foreground)" }} />
          <Input
            placeholder="Nom, téléphone, email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-9 text-[13px]"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--muted)" }}>
          {(["all", "suspended"] as const).map((f) => (
            <button key={f}
              onClick={() => { setFilterSuspended(f); setPage(1); }}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
              style={{
                background: filterSuspended === f ? "var(--card)" : "transparent",
                color: filterSuspended === f ? "var(--foreground)" : "var(--muted-foreground)",
              }}>
              {f === "all" ? "Tous" : "Suspendus"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              {["Utilisateur", "Contact", "Rôles", "Activité", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
              : users.map((u) => {
                const profile = u.profiles[0];
                const fields = u.profiles.reduce((s, p) => s + p._count.fields, 0);
                const prods = u.profiles.reduce((s, p) => s + p._count.productions, 0);
                const isVerified = u.profiles.some((p) => p.verificationLevels.includes("ID_VERIFIED"));

                return (
                  <tr key={u.id}
                    className="border-t transition-colors hover:bg-accent/30"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                          {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium">{profile?.displayName ?? "—"}</p>
                          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                            {new Date(u.createdAt).toLocaleDateString("fr-SN")}
                          </p>
                        </div>
                        {u.isSuspended && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "color-mix(in oklch, var(--destructive) 15%, transparent)", color: "var(--destructive)" }}>
                            Suspendu
                          </span>
                        )}
                        {isVerified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
                            ✓ ID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                      <p>{u.phone ?? "—"}</p>
                      <p className="text-[11px]">{u.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.profiles.map((p) => (
                          <Badge key={p.id} variant="outline" className="text-[10px]">
                            {p.type}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{fields} champ{fields > 1 ? "s" : ""}</p>
                      <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {prods} production{prods > 1 ? "s" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {u.isSuspended ? (
                          <button
                            onClick={() => act(u.id, "reactivate")}
                            disabled={acting === u.id}
                            aria-label="Réactiver le compte"
                            className="p-1.5 rounded-lg transition-all hover:bg-accent disabled:opacity-40 min-h-11 min-w-11 flex items-center justify-center"
                            style={{ color: "var(--primary)" }}>
                            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            onClick={() => act(u.id, "suspend")}
                            disabled={acting === u.id}
                            aria-label="Suspendre le compte"
                            className="p-1.5 rounded-lg transition-all hover:bg-accent disabled:opacity-40 min-h-11 min-w-11 flex items-center justify-center"
                            style={{ color: "var(--destructive)" }}>
                            <ShieldOff className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                        {!isVerified && profile && (
                          <button
                            onClick={() => act(u.id, "verify_id", profile.id)}
                            disabled={acting === u.id}
                            aria-label="Vérifier l'identité"
                            className="p-1.5 rounded-lg transition-all hover:bg-accent disabled:opacity-40 min-h-11 min-w-11 flex items-center justify-center"
                            style={{ color: "var(--muted-foreground)" }}>
                            <UserCheck className="w-4 h-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>
            Page {page} · {total} résultats
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-40"
              style={{ background: "var(--muted)" }}>
              ← Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-40"
              style={{ background: "var(--muted)" }}>
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
