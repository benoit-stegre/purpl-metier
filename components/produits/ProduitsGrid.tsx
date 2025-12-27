'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { PlusIcon, SearchIcon } from '@/components/ui/Icons'
import { ProduitModal } from './ProduitModal'
import { ProduitCard } from './ProduitCard'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal'
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

type Composant = {
  id: string
  name: string
  reference: string | null
  prix_vente: number
  photo_url: string | null
  is_active: boolean
  poids: number | null
}

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
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
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
      
      // Filtre statut
      let matchesStatus = true
      if (statusFilter === 'active') {
        matchesStatus = produit.is_active === true
      } else if (statusFilter === 'archived') {
        matchesStatus = produit.is_active === false
      }
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [initialProduits, searchTerm, selectedCategory, statusFilter])

  const handleSuccess = () => {
    router.refresh()
  }
  
  const handleEdit = (produit: Produit) => {
    setEditingProduit(produit)
    setIsModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduit(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.produitId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('produits')
        .update({ is_active: false }) // Soft delete
        .eq('id', deleteConfirm.produitId)

      if (error) throw error

      router.refresh()
      setDeleteConfirm({ open: false, produitId: null, produitName: '' })
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDeleteClick = (produit: Produit) => {
    setDeleteConfirm({
      open: true,
      produitId: produit.id,
      produitName: produit.name,
    })
  }
  
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-purpl-black">Produits</h1>
        <button 
          onClick={() => {
            setEditingProduit(null)
            setIsModalOpen(true)
          }}
          className="bg-purpl-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-purpl-orange/90 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau produit
        </button>
      </div>
      
      {/* Filtres */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {/* Barre de recherche */}
        <div className="flex-1 min-w-[300px] relative">
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

        {/* Dropdown statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Tous les produits</option>
          <option value="active">Actifs uniquement</option>
          <option value="archived">Archivés uniquement</option>
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
        {filteredProduits.map(produit => (
          <ProduitCard 
            key={produit.id} 
            produit={produit}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        ))}
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() =>
            setDeleteConfirm({ open: false, produitId: null, produitName: '' })
          }
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-purpl-black mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-purpl-green mb-6">
              Êtes-vous sûr de vouloir supprimer le produit{' '}
              <strong className="text-purpl-black">{deleteConfirm.produitName}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({ open: false, produitId: null, produitName: '' })
                }
                className="px-4 py-2 border-2 border-purpl-ecru rounded-lg hover:bg-purpl-ecru transition-colors text-purpl-black"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

