import { createClient } from '@/lib/supabase/server'
import { ProjetsView } from './ProjetsView'

export default async function ProjetsPage() {
  const supabase = await createClient()

  // Fetch projets avec relations categories_projets + clients_pro
  const { data: projets, error: projetsError } = await supabase
    .from('projets')
    .select(`
      *,
      categories_projets (
        id,
        name,
        slug,
        color
      ),
      clients_pro (
        id,
        raison_sociale
      )
    `)
    .order('created_at', { ascending: false })

  if (projetsError) {
    console.error('❌ Erreur fetch projets:', projetsError)
  }

  // Fetch vue_projets_details pour le Kanban (inclut total_ht calculé)
  const { data: projetsDetails, error: detailsError } = await supabase
    .from('vue_projets_details')
    .select('*')
    .order('created_at', { ascending: false })

  if (detailsError) {
    console.error('❌ Erreur fetch projets details:', detailsError)
  }

  return (
    <div className="py-4 md:py-6 lg:py-8">
      <ProjetsView 
        projets={projets || []} 
        projetsDetails={projetsDetails || []}
      />
    </div>
  )
}
