import type { Database } from './database.types'

/**
 * Type de base Client depuis la table clients_pro
 */
export type ClientBase = Database['public']['Tables']['clients_pro']['Row']

/**
 * Client avec sa catégorie
 * Utilisé dans les vues complètes (ClientsGrid, ClientModal, etc.)
 */
export type Client = ClientBase & {
  categories_clients: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
}

/**
 * Client simplifié pour ProjetModal
 */
export type ClientMinimal = {
  id: string
  name: string
  is_active: boolean
}

