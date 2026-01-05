import type { Database } from './database.types'

/**
 * Catégorie de produits
 */
export type CategoryProduit = Database['public']['Tables']['categories_produits']['Row']

/**
 * Catégorie de composants
 */
export type CategoryComposant = Database['public']['Tables']['categories_composants']['Row']

/**
 * Catégorie de clients
 */
export type CategoryClient = Database['public']['Tables']['categories_clients']['Row']

/**
 * Catégorie de projets
 */
export type CategoryProjet = Database['public']['Tables']['categories_projets']['Row']

/**
 * Type générique pour les catégories (utilisé dans CategoryManager)
 */
export type Category = {
  id: string
  name: string
  slug: string
  color: string | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * Type pour identifier le type de catégorie
 */
export type CategoryType = 'composants' | 'produits' | 'clients' | 'projets'

