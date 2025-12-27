import { createClient } from '@/lib/supabase/server'
import { ProduitsView } from '@/components/produits/ProduitsView'

export const metadata = {
  title: 'Produits - PURPL Métier',
  description: 'Gestion des produits finis',
}

export default async function ProduitsPage() {
  const supabase = await createClient()
  
  // Fetch produits avec leurs composants et catégories
  const { data: produits, error: produitsError } = await supabase
    .from('produits')
    .select(`
      *,
      produits_composants (
        id,
        quantite,
        composant:composants (
          id,
          name,
          reference,
          prix_vente,
          photo_url,
          poids
        )
      ),
      categories_produits (
        id,
        name,
        color
      )
    `)
    .order('created_at', { ascending: false })

  if (produitsError) {
    console.error('Erreur fetch produits:', produitsError)
  }
  
  // Fetch tous les composants pour le modal
  const { data: composants } = await supabase
    .from('composants')
    .select('id, name, reference, prix_vente, photo_url, is_active, poids')
    .eq('is_active', true)
    .order('name')
  
  return (
    <div className="py-4 md:py-6 lg:py-8">
      <ProduitsView 
        initialProduits={produits || []} 
        availableComposants={composants || []}
      />
    </div>
  )
}
