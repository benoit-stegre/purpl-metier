import type { Database } from './database.types'

// Réexport pour faciliter l'utilisation
type CategoryProduit = Database['public']['Tables']['categories_produits']['Row']

/**
 * Type de base Produit depuis la table produits
 */
export type ProduitBase = Database['public']['Tables']['produits']['Row']

/**
 * Produit avec ses relations (composants et catégorie)
 * Utilisé dans les vues complètes (ProduitsView, ProduitModal, etc.)
 */
export type Produit = ProduitBase & {
  produits_composants: Array<{
    id: string
    quantite: number
    composant: {
      id: string
      name: string
      reference: string | null
      prix_achat: number
      prix_vente: number
      photo_url: string | null
      poids: number | null
    } | null
  }>
  categories_produits: CategoryProduit | null
}

/**
 * Produit simplifié pour Kanban
 * Inclut tous les champs requis par ProduitsKanban
 */
export type ProduitKanban = {
  id: string
  name: string
  reference: string | null
  photo_url: string | null
  prix_vente_total: number | null
  prix_heure: number | null
  nombre_heures: number | null
  is_active: boolean | null
  categorie_id: string | null
  categories_produits: {
    id: string
    name: string
    color: string | null
  } | null
  produits_composants?: Array<{
    id: string
    quantite: number
    composant: {
      id: string
      name: string
      reference: string | null
      prix_vente: number
      photo_url: string | null
      poids: number | null
    } | null
  }>
}

/**
 * Produit minimal pour ProjetModal
 * Utilisé dans la sélection de produits pour un projet
 */
export type ProduitMinimal = {
  id: string
  name: string
  reference: string | null
  prix_vente_total: number | null
  photo_url: string | null
  is_active: boolean
  prix_revient?: number // Prix de revient calculé (composants + main d'œuvre)
}

