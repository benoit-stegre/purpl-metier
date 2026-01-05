/**
 * Fonctions de recalcul en cascade
 * - Quand un composant change → recalculer les produits qui l'utilisent → recalculer les projets brouillon
 * - Quand un produit change → recalculer les projets brouillon qui l'utilisent
 */

import { createClient } from "@/lib/supabase/client";

/**
 * Recalcule tous les produits utilisant un composant donné,
 * puis recalcule les projets brouillon utilisant ces produits
 */
export async function cascadeDepuisComposant(
  composantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // 1. Trouver tous les produits qui utilisent ce composant
    const { data: produitsComposants, error: fetchError } = await supabase
      .from("produits_composants")
      .select("produit_id")
      .eq("composant_id", composantId);

    if (fetchError) throw fetchError;

    if (!produitsComposants || produitsComposants.length === 0) {
      // Aucun produit n'utilise ce composant
      return { success: true };
    }

    // 2. Pour chaque produit, recalculer son prix et propager aux projets brouillon
    const produitIds = [...new Set(produitsComposants.map((pc) => pc.produit_id))];

    for (const produitId of produitIds) {
      await recalculerProduit(produitId);
      await recalculerProjetsBrouillonPourProduit(produitId);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erreur cascade depuis composant:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Recalcule le prix d'un produit basé sur ses composants et heures de travail
 */
async function recalculerProduit(produitId: string): Promise<void> {
  const supabase = createClient();

  // Récupérer le produit avec ses composants et heures
  const { data: produit, error: produitError } = await supabase
    .from("produits")
    .select(`
      id,
      nombre_heures,
      prix_heure,
      produits_composants (
        quantite,
        composant:composants (
          prix_achat,
          marge_pourcent
        )
      )
    `)
    .eq("id", produitId)
    .single();

  if (produitError || !produit) {
    console.error("Erreur récupération produit:", produitError);
    return;
  }

  // Calculer le coût des composants
  let coutComposants = 0;
  if (produit.produits_composants) {
    for (const pc of produit.produits_composants as any[]) {
      if (pc.composant) {
        const prixAchat = pc.composant.prix_achat || 0;
        const margePourcent = pc.composant.marge_pourcent || 0;
        const prixVenteComposant = prixAchat * (1 + margePourcent / 100);
        coutComposants += prixVenteComposant * (pc.quantite || 1);
      }
    }
  }

  // Calculer le coût de la main d'œuvre
  const coutMainOeuvre = (produit.nombre_heures || 0) * (produit.prix_heure || 0);

  // Prix total du produit
  const prixVenteTotal = coutComposants + coutMainOeuvre;

  // Mettre à jour le produit (uniquement prix_vente_total - les autres colonnes n'existent pas dans la BDD)
  await supabase
    .from("produits")
    .update({
      prix_vente_total: prixVenteTotal,
    })
    .eq("id", produitId);
}

/**
 * Recalcule les projets en brouillon qui utilisent un produit donné
 * (Les projets non-brouillon ont des prix figés et ne doivent pas être recalculés)
 */
export async function recalculerProjetsBrouillonPourProduit(
  produitId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Trouver les projets brouillon qui utilisent ce produit
    const { data: projetsProduits, error: fetchError } = await supabase
      .from("projets_produits")
      .select(`
        projet_id,
        projet:projets!inner (
          id,
          statut
        )
      `)
      .eq("produit_id", produitId)
      .is("prix_unitaire_fige", null); // Seulement ceux sans prix figé

    if (fetchError) throw fetchError;

    if (!projetsProduits || projetsProduits.length === 0) {
      return { success: true };
    }

    // Filtrer pour ne garder que les projets brouillon
    const projetsBrouillon = projetsProduits.filter(
      (pp: any) => pp.projet?.statut === "brouillon"
    );

    // Pour chaque projet brouillon, les données seront recalculées automatiquement
    // via la vue vue_projets_details qui utilise les prix dynamiques des produits
    // Aucune action supplémentaire n'est nécessaire car la vue fait le travail

    return { success: true };
  } catch (error: any) {
    console.error("Erreur recalcul projets brouillon:", error);
    return { success: false, error: error.message };
  }
}





