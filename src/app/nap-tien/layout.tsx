import { redirect } from "next/navigation";
import { AccountSubNav } from "@/components/account/account-sub-nav";
import { getSession } from "@/lib/session";

export default async function NapTienLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/dang-nhap?next=%2Fnap-tien");
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <AccountSubNav />
      {children}
    </div>
  );
}
