import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/mu-admin/dang-nhap");
  }
  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/mu-admin/dang-nhap?error=forbidden");
  }
  return session;
}

