import { AccountServerManager } from "@/components/account/account-server-manager";
import { getAccountServers } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountServersPage() {
  const session = await requireUser();
  const myServers = await getAccountServers(session.userId, 50);

  return (
    <section className="space-y-4">
      <AccountServerManager initialServers={myServers} />
    </section>
  );
}

