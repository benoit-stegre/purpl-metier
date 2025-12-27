import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Récupération des stats (avec fallback en cas d'erreur)
  const [composantsResult, produitsResult, clientsResult, projetsResult] = await Promise.allSettled([
    supabase.from("composants").select("id", { count: "exact", head: true }),
    supabase.from("produits").select("id", { count: "exact", head: true }),
    supabase.from("clients_pro").select("id", { count: "exact", head: true }),
    supabase.from("projets").select("id", { count: "exact", head: true }),
  ]);

  const stats = {
    composants: composantsResult.status === "fulfilled" ? composantsResult.value.count || 0 : 0,
    produits: produitsResult.status === "fulfilled" ? produitsResult.value.count || 0 : 0,
    clients: clientsResult.status === "fulfilled" ? clientsResult.value.count || 0 : 0,
    projets: projetsResult.status === "fulfilled" ? projetsResult.value.count || 0 : 0,
  };

  return <DashboardContent stats={stats} />;
}

function StatsCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-4xl font-bold text-purpl-green">{value}</p>
    </a>
  );
}
