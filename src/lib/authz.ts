import { getSession } from "@/lib/session";

export async function requireAdminRole() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return null;
  }
  return session;
}

export async function requireSuperAdminRole() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return null;
  }
  return session;
}
