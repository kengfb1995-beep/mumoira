import { BuyServicePanel } from "@/components/services/buy-service-panel";

export default function AccountPurchasePage() {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-amber-200 sm:text-xl">Mua dịch vụ (VIP/Banner) bằng số dư</h2>
      <BuyServicePanel />
    </section>
  );
}
