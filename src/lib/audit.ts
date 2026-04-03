import { adminAudits } from "@/db/schema";
import { getDb } from "@/lib/db";

type AuditInput = {
  adminUserId: number;
  action: string;
  targetType: string;
  targetId?: string | number | null;
  payload?: unknown;
  ipAddress?: string;
};

export async function logAdminAudit(input: AuditInput) {
  const db = getDb();
  await db.insert(adminAudits).values({
    adminUserId: input.adminUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId != null ? String(input.targetId) : null,
    payload: input.payload ? JSON.stringify(input.payload).slice(0, 5000) : null,
    ipAddress: input.ipAddress ?? null,
  });
}
