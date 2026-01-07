import type { Database } from './database.types'

/**
 * Type de base Composant depuis la table composants
 */
export type ComposantBase = Database['public']['Tables']['composants']['Row']

/**
 * Composant avec sa catégorie
 * Utilisé dans les vues complètes (ComposantsView, ComposantModal, etc.)
 */
export type Composant = ComposantBase & {
  categorie: Database['public']['Tables']['categories_composants']['Row'] | null
}

/**
 * Composant avec catégorie pour ProduitModal
 * Utilisé dans la sélection de composants pour un produit
 */
export type ComposantForProduit = {
  id: string
  name: string
  reference: string | null
  prix_achat: number
  prix_vente: number
  photo_url: string | null
  is_active: boolean
  poids: number | null
  categorie_id: string | null
  categorie: {
    id: string
    name: string
    color: string | null
  } | null
}

/**
 * Composant simplifié pour ProduitsGrid
 */
export type ComposantSimplified = {
  id: string
  name: string
  reference: string | null
  prix_vente: number
  photo_url: string | null
  poids: number | null
}

