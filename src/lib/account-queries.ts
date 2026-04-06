import { and, desc, eq } from "drizzle-orm";
import { servers, transactions, users } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getAccountProfile(userId: number) {
  const db = getDb();
  const rows = await db
    .select({ email: users.email, balance: users.balance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Chỉ giao dịch đã hoàn tất (nạp tiền sau webhook PayOS, mua dịch vụ / phí server ghi ngay success). Pending không hiển thị trong lịch sử người dùng. */
export async function getAccountTransactions(userId: number, limit = 30) {
  const db = getDb();
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      status: transactions.status,
      serviceType: transactions.serviceType,
      description: transactions.description,
      referenceId: transactions.referenceId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.status, "success")))
    .orderBy(desc(transactions.id))
    .limit(limit);
}

export async function getAccountServers(userId: number, limit = 20) {
  const db = getDb();
  return db
    .select({
      id: servers.id,
      name: servers.name,
      status: servers.status,
      vipPackageType: servers.vipPackageType,
      openBetaDate: servers.openBetaDate,
      alphaTestDate: servers.alphaTestDate,
    })
    .from(servers)
    .where(eq(servers.userId, userId))
    .orderBy(desc(servers.id))
    .limit(limit);
}
