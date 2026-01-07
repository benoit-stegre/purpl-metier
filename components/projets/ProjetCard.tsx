'use client'

import { useState } from 'react'
import { Building2, Calendar, FileText, ShoppingCart } from 'lucide-react'
import { ImageIcon, DuplicateIcon, DeleteIcon } from '@/components/ui/Icons'
import { toast } from 'react-hot-toast'
import { exportProjetDevis, exportProjetCommande } from '@/lib/exports/projetExports'

// Couleurs PURPL (IDENTIQUE à ProduitCard)
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

// Couleurs statuts projets
const STATUS_COLORS: Record<string, string> = {
  brouillon: '#6B7280',
  en_cours: '#3B82F6',
  termine: '#10B981',
  annule: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
}

interface ProjetCardProps {
  projet: {
    id: string
    nom: string
    reference: string | null
    statut: string | null
    client_nom?: string | null
    total_ht: number | null
    total_revient?: number | null
    photo_url?: string | null
    date_debut?: string | null
    created_at?: string | null
  }
  variant?: 'grid' | 'kanban'
  onClick?: () => void
  isDragging?: boolean
  onDuplicate?: () => void
  onDelete?: () => void
  // Props optionnelles pour statut dynamique (depuis Kanban)
  statutColor?: string
  statutLabel?: string
}

export function ProjetCard({
  projet,
  variant = 'grid',
  onClick,
  isDragging = false,
  onDuplicate,
  onDelete,
  statutColor,
  statutLabel,
}: ProjetCardProps) {
  const [isExporting, setIsExporting] = useState<'devis' | 'commande' | null>(null)

  // URL photo Supabase
  const getPublicPhotoUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return null
    const fileName = photoUrl.split('/').pop() || photoUrl
    return `${supabaseUrl}/storage/v1/object/public/projets-photos/${fileName}`
  }

  // Calcul marge
  const totalHT = projet.total_ht ?? 0
  const totalRevient = projet.total_revient ?? 0
  const margeEuros = totalHT - totalRevient
  const margePourcent = totalRevient > 0 ? (margeEuros / totalRevient) * 100 : 0

  // Couleur badge marge (IDENTIQUE à ProduitCard)
  const getMarginBadgeColor = (percent: number) => {
    if (percent > 30) return COLORS.vert
    if (percent >= 15) return COLORS.orangeDoux
    if (percent >= 0) return COLORS.orangeChaud
    return COLORS.rouge
  }

  // Formatage date
  const formattedDate = projet.date_debut
    ? new Date(projet.date_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : projet.created_at
    ? new Date(projet.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  // Handlers export
  const handleExportDevis = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExporting('devis')
    const result = await exportProjetDevis(projet.id)
    if (result.success) toast.success('Devis exporté')
    else toast.error(result.error || 'Erreur export')
    setIsExporting(null)
  }

  const handleExportCommande = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExporting('commande')
    const result = await exportProjetCommande(projet.id)
    if (result.success) toast.success('Commande exportée')
    else toast.error(result.error || 'Erreur export')
    setIsExporting(null)
  }

  const photoUrl = getPublicPhotoUrl(projet.photo_url)
  // Utiliser les props statutColor/statutLabel si fournies (pour statuts dynamiques), sinon fallback sur les mappings hardcodés
  const statusColor = statutColor || STATUS_COLORS[projet.statut || 'brouillon'] || '#6B7280'
  const statusLabel = statutLabel || STATUS_LABELS[projet.statut || 'brouillon'] || (projet.statut || 'Brouillon').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group ${
        isDragging ? 'shadow-2xl ring-2 ring-[#ED693A] scale-[1.02]' : ''
      }`}
      style={{ backgroundColor: COLORS.ivoire }}
      onClick={onClick}
    >
      {/* ===== BOUTONS HOVER ===== */}
      {(onDuplicate || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className={`rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform ${
                variant === 'kanban' ? 'w-7 h-7' : 'w-8 h-8'
              }`}
              style={{ backgroundColor: COLORS.olive, color: "white" }}
              title="Dupliquer"
            >
              <DuplicateIcon className={variant === 'kanban' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform ${
                variant === 'kanban' ? 'w-7 h-7' : 'w-8 h-8'
              }`}
              style={{ backgroundColor: COLORS.rouge, color: "white" }}
              title="Supprimer"
            >
              <DeleteIcon className={variant === 'kanban' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </button>
          )}
        </div>
      )}
      {/* ===== FIN BOUTONS HOVER ===== */}

      {/* ZONE PHOTO */}
      <div
        className={`w-full flex items-center justify-center relative ${
          variant === 'kanban' ? 'h-[100px]' : 'h-[140px]'
        }`}
        style={{ backgroundColor: '#F3F4F6' }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={projet.nom}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement?.querySelector('.photo-fallback') as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}

        {/* Placeholder photo */}
        <div
          className="photo-fallback absolute inset-0 flex items-center justify-center"
          style={{ display: photoUrl ? 'none' : 'flex', backgroundColor: '#F3F4F6' }}
        >
          <span style={{ color: COLORS.olive }}>
            <ImageIcon className="w-10 h-10" />
          </span>
        </div>

        {/* Badge statut - haut gauche (comme badge catégorie dans ProduitCard) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-xs font-medium" style={{ color: COLORS.noir }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* CONTENU */}
      <div className="p-4">
        {/* Header : Nom + Prix */}
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate" style={{ color: COLORS.noir }}>
              {projet.nom}
            </div>
            {projet.reference && (
              <div className="text-xs" style={{ color: COLORS.olive }}>
                {projet.reference}
              </div>
            )}
          </div>
          <div className="text-lg font-bold whitespace-nowrap ml-2" style={{ color: COLORS.orangeDoux }}>
            {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
        </div>

        {/* Client */}
        {projet.client_nom && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.olive }}>
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{projet.client_nom}</span>
          </div>
        )}

        {/* Date (optionnel, uniquement si disponible) */}
        {formattedDate && variant === 'grid' && (
          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: COLORS.olive }}>
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Marge - seulement si total_revient > 0 */}
        {projet.total_revient !== undefined && projet.total_revient !== null && projet.total_revient > 0 && (
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
                {margeEuros >= 0 ? '+' : ''}{margeEuros.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: getMarginBadgeColor(margePourcent) }}
              >
                {margePourcent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Boutons Export */}
        <div
          className="flex items-center gap-2 pt-3 mt-3"
          style={{ borderTop: `1px solid ${COLORS.ecru}` }}
        >
          <button
            onClick={handleExportDevis}
            disabled={isExporting !== null}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md hover:opacity-80 transition-colors disabled:opacity-50"
            style={{ backgroundColor: COLORS.ecru, color: COLORS.olive }}
          >
            {isExporting === 'devis' ? (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Devis</span>
          </button>
          <button
            onClick={handleExportCommande}
            disabled={isExporting !== null}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-80 transition-colors disabled:opacity-50"
            style={{ backgroundColor: COLORS.orangeChaud }}
          >
            {isExporting === 'commande' ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            <span>Commande</span>
          </button>
        </div>
      </div>
    </div>
  )
}

