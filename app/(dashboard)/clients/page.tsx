import { createClient } from "@/lib/supabase/server";
import { ClientsGrid } from "@/components/clients/ClientsGrid";

export const metadata = {
  title: "Clients - PURPL Métier",
  description: "Gestion des clients",
};

export default async function ClientsPage() {
  const supabase = await createClient();

  // Fetch clients_pro - TOUS (actifs + inactifs) pour que le filtre fonctionne
  const { data: clients, error: clientsError } = await supabase
    .from("clients_pro")
    .select(`
      *,
      categories_clients (
        id,
        name,
        slug,
        color
      )
    `)
    .order("created_at", { ascending: false });

  if (clientsError) {
    console.error("Erreur fetch clients:", clientsError);
  }

  return (
    <div className="py-1 md:py-1.5 lg:py-2">
      <ClientsGrid initialClients={clients || []} />
    </div>
  );
}
