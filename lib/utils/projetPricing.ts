import { createClient } from "@/lib/supabase/client";

/**
 * Fige les prix des produits d'un projet
 * Copie le prix_vente_total actuel de chaque produit dans prix_unitaire_fige
 * À appeler quand un projet passe de "brouillon" vers un autre statut
 */
export async function figerPrixProduits(projetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Récupérer tous les produits du projet avec leur prix actuel
    const { data: projetProduits, error: fetchError } = await supabase
      .from("projets_produits")
      .select(`
        id,
        prix_unitaire_fige,
        produit:produits (prix_vente_total)
      `)
      .eq("projet_id", projetId);

    if (fetchError) throw fetchError;

    if (!projetProduits || projetProduits.length === 0) {
      return { success: true }; // Rien à figer
    }

    // Mettre à jour chaque produit qui n'a pas encore de prix figé
    for (const pp of projetProduits) {
      if (pp.prix_unitaire_fige === null) {
        // Gérer le cas où produit peut être un objet ou un tableau
        const produitData = Array.isArray(pp.produit) ? pp.produit[0] : pp.produit;
        const prixActuel = (produitData as { prix_vente_total: number | null } | undefined)?.prix_vente_total ?? 0;
        
        const { error: updateError } = await supabase
          .from("projets_produits")
          .update({ prix_unitaire_fige: prixActuel })
          .eq("id", pp.id);

        if (updateError) throw updateError;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erreur figement prix:", error);
    return { success: false, error: error.message || "Erreur lors du figement des prix" };
  }
}

/**
 * Défige les prix des produits d'un projet
 * Remet prix_unitaire_fige à NULL pour tous les produits du projet
 * À appeler quand un projet repasse en "brouillon"
 */
export async function defigerPrixProduits(projetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("projets_produits")
      .update({ prix_unitaire_fige: null })
      .eq("projet_id", projetId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Erreur défigement prix:", error);
    return { success: false, error: error.message || "Erreur lors du défigement des prix" };
  }
}

/**
 * Retourne le prix à utiliser pour un produit dans un projet
 * - Si prix_unitaire_fige est défini → prix figé (historique)
 * - Sinon → prix_vente_total du produit (dynamique)
 */
export function getPrixProduit(
  projetProduit: { prix_unitaire_fige?: number | null },
  produit: { prix_vente_total?: number | null }
): number {
  return projetProduit.prix_unitaire_fige ?? produit.prix_vente_total ?? 0;
}

/**
 * Vérifie si un statut nécessite des prix figés
 */
export function statutNecessiteFigement(statut: string): boolean {
  return statut !== "brouillon";
}

/**
 * Gère le changement de statut d'un projet
 * - brouillon → autre : fige les prix
 * - autre → brouillon : défige les prix
 */
export async function gererChangementStatut(
  projetId: string,
  ancienStatut: string,
  nouveauStatut: string
): Promise<{ success: boolean; error?: string }> {
  const ancienNecessiteFigement = statutNecessiteFigement(ancienStatut);
  const nouveauNecessiteFigement = statutNecessiteFigement(nouveauStatut);

  // Passage brouillon → autre statut : figer
  if (!ancienNecessiteFigement && nouveauNecessiteFigement) {
    return await figerPrixProduits(projetId);
  }

  // Passage autre statut → brouillon : défiger
  if (ancienNecessiteFigement && !nouveauNecessiteFigement) {
    return await defigerPrixProduits(projetId);
  }

  // Pas de changement de logique de figement
  return { success: true };
}



