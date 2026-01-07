'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'
import { SearchIcon } from '@/components/ui/Icons'
import { ProduitModal } from './ProduitModal'
import { ProduitCard } from './ProduitCard'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal'
import type { Produit, ProduitKanban, ComposantForProduit } from '@/types'

// Couleurs PURPL
const COLORS = {
  ivoire: "#FFFEF5",
  ecru: "#EDEAE3", 
  noir: "#2F2F2E",
  olive: "#76715A",
  rougeDoux: "#C23C3C",
}

// Alias pour compatibilité
type Composant = ComposantForProduit

interface ProduitsGridProps {
  initialProduits: Produit[]
  availableComposants: Composant[]
}

export function ProduitsGrid({ initialProduits, availableComposants }: ProduitsGridProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    produitId: string | null
    produitName: string
  }>({
    open: false,
    produitId: null,
    produitName: '',
  })
  
  // Fetch catégories pour rafraîchir
  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories_produits')
        .select('*')
        .order('name')
      
      if (data) {
        setCategories(data)
        router.refresh() // Recharger les données
      }
    } catch (error) {
      console.error('Erreur fetch catégories:', error)
    }
  }

  // Fetch catégories pour les filtres au mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const filteredProduits = useMemo(() => {
    return initialProduits.filter(produit => {
      // Filtre recherche
      const matchesSearch = searchTerm === '' || 
        produit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (produit.reference && produit.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Filtre catégorie
      const matchesCategory = selectedCategory === 'all' || 
        produit.categories_produits?.id === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [initialProduits, searchTerm, selectedCategory])

  const handleSuccess = () => {
    router.refresh()
  }
  
  const handleEdit = (produit: Produit | ProduitKanban) => {
    // ProduitsGrid utilise toujours Produit complet, donc on peut caster
    setEditingProduit(produit as Produit)
    setIsModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduit(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.produitId) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('id', deleteConfirm.produitId)

      if (error) throw error

      router.refresh()
      setDeleteConfirm({ open: false, produitId: null, produitName: '' })
      toast.success('Produit supprimé définitivement')
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = (produit: Produit | ProduitKanban) => {
    console.log('ProduitsGrid: handleDeleteClick appelé', { produitId: produit.id, produitName: produit.name })
    setDeleteConfirm({
      open: true,
      produitId: produit.id,
      produitName: produit.name,
    })
  }
  
  return (
    <>
      {/* Header */}
      {/* Filtres */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {/* Barre de recherche */}
        <div className="flex-1 min-w-0 sm:min-w-[300px] relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white"
          />
        </div>

        {/* Dropdown catégories */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            const value = e.target.value;
            
            // Si option "Gérer les catégories" cliquée
            if (value === '__manage__') {
              setShowCategoryManager(true);
              return;
            }
            
            // Sinon, changer la catégorie normalement
            setSelectedCategory(value);
          }}
          className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          
          {/* Séparateur visuel */}
          <option disabled>────────────────</option>
          
          {/* Option gérer avec roue crantée */}
          <option 
            value="__manage__" 
            className="font-semibold"
            style={{ color: '#76715A' }}
          >
            ⚙ Gérer les catégories...
          </option>
        </select>

      </div>

      {/* Compteur résultats */}
      {filteredProduits.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredProduits.length} produit{filteredProduits.length > 1 ? 's' : ''}
          {selectedCategory !== 'all' && ' dans cette catégorie'}
        </div>
      )}
      
      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProduits.map(produit => {
          console.log('ProduitsGrid: rendu ProduitCard', { 
            produitName: produit.name, 
            hasHandleDeleteClick: !!handleDeleteClick 
          })
          return (
            <ProduitCard 
              key={produit.id} 
              produit={produit}
              onEdit={handleEdit}
              onDelete={(p) => {
                console.log('🔴🔴🔴 ProduitsGrid: onDelete inline appelé', p.name)
                handleDeleteClick(p)
              }}
            />
          )
        })}
      </div>
      
      {filteredProduits.length === 0 && (
        <div className="text-center py-12 text-purpl-green">
          Aucun produit trouvé
        </div>
      )}
      
      <ProduitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editingProduit={editingProduit}
        availableComposants={availableComposants}
      />

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="produits"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}

      {/* Popup Confirmation Suppression */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div 
            className="rounded-xl w-full max-w-sm p-6" 
            style={{ backgroundColor: COLORS.ivoire }}
          >
            <div className="flex justify-center mb-4">
              <AlertTriangle size={40} style={{ color: COLORS.rougeDoux }} />
            </div>
            <h3 
              className="text-xl font-semibold text-center mb-2" 
              style={{ color: COLORS.rougeDoux }}
            >
              Supprimer ce produit ?
            </h3>
            <p 
              className="text-center text-sm mb-6" 
              style={{ color: COLORS.noir }}
            >
              Cette action est irréversible. Toutes les données associées seront perdues.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, produitId: null, produitName: '' })}
                className="flex-1 px-4 py-2 rounded-lg font-medium border-2 transition-colors"
                style={{
                  color: COLORS.olive,
                  borderColor: COLORS.olive,
                  backgroundColor: COLORS.ivoire,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50"
                style={{ backgroundColor: COLORS.rougeDoux }}
              >
                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

