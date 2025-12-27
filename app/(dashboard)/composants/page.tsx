import { createClient } from "@/lib/supabase/server";
import { ComposantsView } from "@/components/composants/ComposantsView";

export default async function ComposantsPage() {
  const supabase = await createClient();

  // Fetch composants avec catégories
  const { data: composantsData, error: composantsError } = await supabase
    .from("composants")
    .select(`
      *,
      categorie:categories_composants(*)
    `)
    .order("created_at", { ascending: false });

  // Fetch toutes les catégories pour les filtres
  const { data: categories, error: categoriesError } = await supabase
    .from("categories_composants")
    .select("*")
    .order("name");

  // Gestion des erreurs
  if (composantsError) {
    console.error("Error fetching composants:", composantsError);
  }
  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  return (
    <div className="py-4 md:py-6 lg:py-8">
      <ComposantsView
        initialComposants={composantsData || []}
        categories={categories || []}
      />
    </div>
  );
}
