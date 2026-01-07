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
          prix_achat,
          prix_vente,
          photo_url,
          poids
        )
      ),
      categories_produits (
        id,
        name,
        slug,
        color
      )
    `)
    .order('created_at', { ascending: false })

  if (produitsError) {
    console.error('Erreur fetch produits:', produitsError)
  }
  
  // Fetch tous les composants avec leurs catégories pour le modal
  const { data: composants } = await supabase
    .from('composants')
    .select(`
      id, 
      name, 
      reference, 
      prix_achat,
      prix_vente, 
      photo_url, 
      is_active, 
      poids,
      categorie_id,
      categorie:categories_composants (
        id,
        name,
        color
      )
    `)
    .order('name')
  
  // Transformer les composants pour gérer les valeurs null
  const transformedComposants = (composants || []).map(comp => ({
    ...comp,
    prix_achat: comp.prix_achat ?? 0,
    prix_vente: comp.prix_vente ?? 0,
    categorie: Array.isArray(comp.categorie) 
      ? (comp.categorie.length > 0 ? comp.categorie[0] : null)
      : (comp.categorie ?? null),
  }))
  
  return (
    <div className="py-1 md:py-1.5 lg:py-2">
      <ProduitsView 
        initialProduits={produits || []} 
        availableComposants={transformedComposants}
      />
    </div>
  )
}
