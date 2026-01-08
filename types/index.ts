/**
 * Export centralisé de tous les types métier
 */

// Types de base depuis Supabase
export type { Database } from './database.types'

// Types Produit
export type {
  ProduitBase,
  Produit,
  ProduitKanban,
  ProduitMinimal,
} from './produit'

// Types Composant
export type {
  ComposantBase,
  Composant,
  ComposantForProduit,
  ComposantSimplified,
} from './composant'

// Types Client
export type {
  ClientBase,
  Client,
  ClientMinimal,
} from './client'

// Types Category
export type {
  CategoryProduit,
  CategoryComposant,
  CategoryClient,
  CategoryProjet,
  Category,
  CategoryType,
} from './category'


