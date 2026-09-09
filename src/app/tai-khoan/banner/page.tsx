import { AccountBannerManager } from "@/components/account/account-banner-manager";
import { getAccountBanners } from "@/lib/account-queries";
import { requireUser } from "@/lib/auth";

export default async function AccountBannersPage() {
  const session = await requireUser();
  const myBanners = await getAccountBanners(session.userId, 50);

  return (
    <section className="space-y-4">
      <AccountBannerManager initialBanners={myBanners} />
    </section>
  );
}
