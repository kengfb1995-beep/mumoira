import { ServerDateEditorList } from "@/components/servers/server-date-editor-list";
import { getAccountServers } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountServersPage() {
  const session = await requireUser();
  const myServers = await getAccountServers(session.userId, 20);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Server của bạn (sửa Open/Alpha Test)</h2>
      {myServers.length === 0 ? (
        <p className="text-sm text-zinc-500">Bạn chưa đăng server nào.</p>
      ) : (
        <div className="space-y-4">
          {myServers.map((s) => (
            <div key={s.id} className="rounded-2xl border border-amber-500/20 bg-black/25 p-4">
              <p className="mb-1 font-medium text-amber-100">{s.name}</p>
              <p className="mb-3 text-xs text-zinc-500">
                Trạng thái: <span className="text-zinc-300">{s.status}</span>
                {s.vipPackageType === "vip_gold" ? (
                  <span className="ml-2 text-amber-400">· VIP Vàng</span>
                ) : null}
              </p>
              <ServerDateEditorList
                serverId={s.id}
                initialAlpha={s.alphaTestDate}
                initialOpen={s.openBetaDate}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
