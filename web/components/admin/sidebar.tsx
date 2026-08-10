"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileCheck, Users, Flag, LogOut, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Annonces", icon: FileCheck },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/reports", label: "Signalements", icon: Flag },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigation principale"
      className="fixed left-0 top-0 h-screen w-55 flex flex-col z-40"
      style={{ background: "var(--sidebar)" }}>

      {/* Skip link pour keyboard nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)" }}>
        Aller au contenu
      </a>

      <div className="px-6 pt-8 pb-10 overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--sidebar-primary)" }} aria-hidden="true">
            <Sprout className="w-4 h-4" style={{ color: "var(--sidebar-primary-foreground)" }} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight leading-none"
              style={{ color: "var(--sidebar-primary)" }}>SunuAgri</p>
            <p className="text-[10px] mt-0.5 font-medium uppercase tracking-widest"
              style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>Admin</p>
          </div>
        </div>
      </div>

      <nav aria-label="Menu admin" className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 rounded-md text-[13px] font-medium transition-colors min-h-11",
                active ? "text-sidebar-primary" : "hover:bg-sidebar-accent"
              )}
              style={{
                color: active ? "var(--sidebar-primary)" : "var(--sidebar-foreground)",
                background: active ? "var(--sidebar-accent)" : undefined,
                opacity: active ? 1 : 0.75,
              }}>
              {/* Barre d'accent latérale sur l'item actif */}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 w-0.5 h-6 rounded-r"
                  style={{ background: "var(--sidebar-primary)" }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <button
          className="w-full flex items-center gap-3 px-3 rounded-md text-[13px] font-medium transition-colors hover:bg-sidebar-accent min-h-11"
          style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}>
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
