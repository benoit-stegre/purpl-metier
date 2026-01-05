'use client'

import Image from 'next/image'
import { EditIcon, DuplicateIcon, DeleteIcon, ToolIcon, ImageIcon, WeightIcon } from '@/components/ui/Icons'
import { Package } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Produit = Database['public']['Tables']['produits']['Row'] & {
  produits_composants: Array<{
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
  categories_produits: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
}

interface ProduitCardProps {
  produit: Produit
  onEdit: (produit: Produit) => void
  onDelete: (produit: Produit) => void
}

export function ProduitCard({ produit, onEdit, onDelete }: ProduitCardProps) {
  // Fonction pour générer l'URL publique Supabase
  const getPublicPhotoUrl = (photoUrl: string | null) => {
    if (!photoUrl) return null
    
    // Si c'est déjà une URL complète, la retourner telle quelle
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      return photoUrl
    }
    
    // Sinon, construire l'URL publique depuis le chemin relatif
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    
    // Extraire le nom du fichier (enlever le chemin si présent)
    const fileName = photoUrl.split('/').pop() || photoUrl
    return `${supabaseUrl}/storage/v1/object/public/produits-photos/${fileName}`
  }
  
  const handleCardClick = () => {
    onEdit(produit)
  }
  
  const handleButtonClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation()
    
    if (action === 'edit') {
      onEdit(produit)
    } else if (action === 'delete') {
      onDelete(produit)
    }
  }
  
  const nbComposants = produit.produits_composants?.length || 0
  
  // Utiliser directement prix_vente_total de la BDD (calculé et sauvegardé correctement)
  const prixVente = produit.prix_vente_total ?? 0
  
  // Calcul du poids total = Σ (composant.poids × quantité)
  const poidsTotal = produit.produits_composants?.reduce((total, pc) => {
    if (!pc.composant || !pc.composant.poids) return total
    return total + (pc.composant.poids * pc.quantite)
  }, 0) || 0
  
  const photoUrl = getPublicPhotoUrl(produit.photo_url)
  
  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="h-48 bg-purpl-ecru flex items-center justify-center relative overflow-hidden">
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={produit.name}
            width={300}
            height={200}
            className="w-full h-full object-cover"
            onError={(e) => {
              // En cas d'erreur de chargement, afficher l'icône
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) {
                const fallback = parent.querySelector('.photo-fallback') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        )}
        
        {/* Icône de fallback (affichée si pas de photo ou en cas d'erreur) */}
        <div 
          className="photo-fallback absolute inset-0 flex items-center justify-center bg-purpl-ecru"
          style={{ display: photoUrl ? 'none' : 'flex' }}
        >
          <ImageIcon className="w-6 h-6 text-purpl-green opacity-40" />
        </div>
        
      </div>
      
      <div className="p-4">
        {/* Nom */}
        <h3 className="font-semibold text-lg text-purpl-black mb-1">
          {produit.name}
        </h3>

        {/* Badge catégorie */}
        {produit.categories_produits && (
          <div className="mt-2">
            <span
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
              style={{
                backgroundColor: `${produit.categories_produits.color || "#ED693A"}15`,
                color: produit.categories_produits.color || "#ED693A",
                border: `1px solid ${produit.categories_produits.color || "#ED693A"}30`,
              }}
            >
              {produit.categories_produits.name}
            </span>
          </div>
        )}
        
        {produit.reference && (
          <p className="text-sm text-purpl-green mt-2 mb-3">Réf: {produit.reference}</p>
        )}
        
        {/* Nombre de composants */}
        <div className="text-xs text-purpl-green mb-3 flex items-center gap-1">
          <Package className="w-4 h-4" />
          <span>{nbComposants} composant{nbComposants > 1 ? 's' : ''}</span>
        </div>
        
        {/* Poids total */}
        {poidsTotal > 0 && (
          <div className="text-xs text-purpl-green mb-3 flex items-center gap-1">
            <WeightIcon className="w-4 h-4" />
            <span>{poidsTotal.toFixed(2)}</span>
          </div>
        )}
        
        {/* Prix */}
        <div className="flex justify-between items-center pt-3 border-t border-purpl-ecru">
          <div>
            <p className="text-xs text-purpl-green">Prix vente</p>
            <p className="text-lg font-semibold text-purpl-orange">
              {prixVente.toFixed(2)} €
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-3">
          <button 
            onClick={(e) => handleButtonClick(e, 'edit')}
            className="p-2 hover:bg-purpl-ecru rounded-md transition-colors group"
            title="Modifier"
          >
            <EditIcon className="w-5 h-5 text-purpl-green group-hover:text-purpl-orange transition-colors" />
          </button>
          <button 
            onClick={(e) => handleButtonClick(e, 'duplicate')}
            className="p-2 hover:bg-purpl-ecru rounded-md transition-colors group"
            title="Dupliquer"
          >
            <DuplicateIcon className="w-5 h-5 text-purpl-green group-hover:text-purpl-orange transition-colors" />
          </button>
          <button 
            onClick={(e) => handleButtonClick(e, 'delete')}
            className="p-2 hover:bg-red-100 rounded-md transition-colors group"
            title="Supprimer"
          >
            <DeleteIcon className="w-5 h-5 text-purpl-green group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
