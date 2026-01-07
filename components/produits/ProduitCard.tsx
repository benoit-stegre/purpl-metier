'use client'

import { useMemo } from 'react'
import { ImageIcon, DuplicateIcon, DeleteIcon, WeightIcon } from '@/components/ui/Icons'
import type { Produit, ProduitKanban } from '@/types'

// Couleurs PURPL
const COLORS = {
  ivoire: '#FFFEF5',
  ecru: '#EDEAE3',
  noir: '#2F2F2E',
  olive: '#76715A',
  orangeDoux: '#E77E55',
  orangeChaud: '#ED693A',
  rouge: '#C23C3C',
  vert: '#409143',
}

interface ProduitCardProps {
  produit: Produit | ProduitKanban
  variant?: 'grid' | 'kanban'
  onClick?: () => void
  onEdit?: (produit: Produit | ProduitKanban) => void
  onDuplicate?: () => void
  onDelete?: (produit: Produit | ProduitKanban) => void
}

export function ProduitCard({ 
  produit, 
  variant = 'grid',
  onClick,
  onEdit,
  onDuplicate,
  onDelete 
}: ProduitCardProps) {
  // Debug: vérifier que onDelete est bien passé
  console.log('ProduitCard render:', { 
    produitName: produit.name, 
    hasOnDelete: !!onDelete,
    onDeleteType: typeof onDelete 
  })
  // Gérer onClick : si onEdit est fourni, l'utiliser, sinon onClick
  const handleCardClick = () => {
    if (onEdit) {
      onEdit(produit)
    } else if (onClick) {
      onClick()
    }
  }

  // Gérer duplicate : si onDuplicate n'est pas fourni, utiliser onEdit
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate()
    } else if (onEdit) {
      // Dupliquer = créer un nouveau produit avec les mêmes données
      onEdit(produit)
    }
  }
  // Fonction pour générer l'URL publique Supabase
  const getPublicPhotoUrl = (photoUrl: string | null) => {
    if (!photoUrl) return null
    
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      return photoUrl
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    
    const fileName = photoUrl.split('/').pop() || photoUrl
    return `${supabaseUrl}/storage/v1/object/public/produits-photos/${fileName}`
  }

  // Calcul du prix de revient
  const prixRevient = useMemo(() => {
    // Coût des composants (prix d'achat)
    const composantsCost = produit.produits_composants?.reduce((sum, pc) => {
      if (!pc.composant) return sum
      // ProduitKanban n'a pas prix_achat, utiliser prix_vente comme fallback
      const prixAchat = 'prix_achat' in pc.composant ? pc.composant.prix_achat : (pc.composant.prix_vente * 0.6) // Estimation 60% du prix de vente
      if (!prixAchat) return sum
      return sum + (prixAchat * pc.quantite)
    }, 0) || 0

    // Coût main d'œuvre
    const laborCost = (produit.prix_heure || 0) * (produit.nombre_heures || 0)

    return composantsCost + laborCost
  }, [produit.produits_composants, produit.prix_heure, produit.nombre_heures])

  // Calcul de la marge
  const prixVente = produit.prix_vente_total ?? 0
  const margeEuros = prixVente - prixRevient
  const margePourcent = prixRevient > 0 
    ? (margeEuros / prixRevient) * 100 
    : 0

  // Couleur du badge marge %
  const getMarginBadgeColor = (percent: number) => {
    if (percent > 30) return COLORS.vert
    if (percent >= 15) return COLORS.orangeDoux
    if (percent >= 0) return COLORS.orangeChaud
    return COLORS.rouge
  }

  // Calcul du poids total (pour variant kanban)
  const poidsTotal = useMemo(() => {
    return produit.produits_composants?.reduce((total, pc) => {
      if (!pc.composant || !pc.composant.poids) return total
      return total + (pc.composant.poids * pc.quantite)
    }, 0) || 0
  }, [produit.produits_composants])

  const photoUrl = getPublicPhotoUrl(produit.photo_url)
  const category = produit.categories_produits

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
      style={{ backgroundColor: COLORS.ivoire }}
      onClick={handleCardClick}
    >
      {/* PHOTO */}
      <div 
        className={`w-full flex items-center justify-center relative ${variant === 'kanban' ? 'h-[100px]' : 'h-[140px]'}`}
        style={{ backgroundColor: '#F3F4F6' }}
      >
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={produit.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const parent = e.currentTarget.parentElement
              if (parent) {
                const fallback = parent.querySelector('.photo-fallback') as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        
        {/* Placeholder image */}
        <div 
          className="photo-fallback absolute inset-0 flex items-center justify-center"
          style={{ 
            display: photoUrl ? 'none' : 'flex',
            backgroundColor: '#F3F4F6' 
          }}
        >
          <span style={{ color: COLORS.olive }}>
            <ImageIcon className="w-10 h-10" />
          </span>
        </div>
        
        {/* Badge catégorie - haut gauche */}
        {category && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: category.color || COLORS.orangeChaud }}
            />
            <span className="text-xs font-medium" style={{ color: COLORS.noir }}>
              {category.name}
            </span>
          </div>
        )}
        
        {/* Actions - haut droite, visibles au survol */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20" style={{ pointerEvents: 'auto' }}>
          {(onDuplicate || onEdit) && (
            <button
              onClick={(e) => { 
                e.stopPropagation()
                handleDuplicate()
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              style={{ backgroundColor: COLORS.olive, color: 'white' }}
              title="Dupliquer"
            >
              <span style={{ color: 'white' }}>
                <DuplicateIcon className="w-4 h-4" />
              </span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { 
                console.log('ProduitCard: bouton supprimer cliqué', { 
                  produit: produit.name, 
                  produitId: produit.id,
                  onDeleteDefined: !!onDelete,
                  onDeleteType: typeof onDelete
                })
                e.stopPropagation()
                e.preventDefault()
                if (onDelete) {
                  console.log('ProduitCard: appel de onDelete avec produit', produit)
                  onDelete(produit)
                } else {
                  console.warn('ProduitCard: onDelete est undefined au moment de l\'appel!')
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-all border group/delete relative z-10"
              style={{ 
                backgroundColor: 'white', 
                borderColor: COLORS.rouge,
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.rouge
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
              title="Supprimer"
            >
              <span 
                className="group-hover/delete:text-white transition-colors"
                style={{ color: COLORS.rouge }}
              >
                <DeleteIcon className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>
      </div>
      
      {/* CONTENU */}
      <div className="p-4">
        {/* Header : Nom + Prix */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-semibold" style={{ color: COLORS.noir }}>
              {produit.name}
            </div>
            {produit.reference && (
              <div className="text-xs" style={{ color: COLORS.olive }}>
                {produit.reference}
              </div>
            )}
            {/* Poids (uniquement si disponible et variant kanban) */}
            {variant === 'kanban' && poidsTotal > 0 && (
              <div className="text-xs flex items-center gap-1 mt-1" style={{ color: COLORS.olive }}>
                <span style={{ color: COLORS.olive }}>
                  <WeightIcon className="w-4 h-4" />
                </span>
                <span>{poidsTotal.toFixed(2)} kg</span>
              </div>
            )}
          </div>
          <div className="text-lg font-bold whitespace-nowrap" style={{ color: COLORS.orangeDoux }}>
            {prixVente.toFixed(2)} €
          </div>
        </div>
        
        {/* Marge */}
        <div 
          className="flex items-center justify-between pt-3 mt-3"
          style={{ borderTop: `1px solid ${COLORS.ecru}` }}
        >
          <span className="text-xs" style={{ color: COLORS.olive }}>Marge</span>
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-semibold"
              style={{ color: margeEuros >= 0 ? COLORS.vert : COLORS.rouge }}
            >
              {margeEuros >= 0 ? '+' : ''}{margeEuros.toFixed(2)} €
            </span>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: getMarginBadgeColor(margePourcent) }}
            >
              {margePourcent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
