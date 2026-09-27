import { headers } from "next/headers";
import { DashLogin } from "@/components/dashboard/DashLogin";
import { DASHBOARD_SEGMENT, isDashboardHost } from "@/lib/dashboard/url";

export const dynamic = "force-dynamic";

// A kezelő saját bejelentkezése (kétlépcsős azonosítással, ha be van kapcsolva)
export default async function DashLoginPage({ searchParams }: PageProps<"/[locale]/kezelo/belepes">) {
  const host = (await headers()).get("host");
  const { mfa, lejart } = await searchParams;
  return <DashLogin base={isDashboardHost(host) ? "" : DASHBOARD_SEGMENT} mfa={mfa === "1"} expired={lejart === "1"} />;
}
