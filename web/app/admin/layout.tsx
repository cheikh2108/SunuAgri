import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata = { title: "SunuAgri Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { systemRole: true },
  });

  const isAdmin = user && ["ADMIN", "SUPER_ADMIN"].includes(user.systemRole);
  if (!isAdmin) redirect("/");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-[220px] flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
