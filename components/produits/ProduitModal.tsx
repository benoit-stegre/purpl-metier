'use client'

import { useState, useEffect, useMemo, Fragment, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CloseIcon, SaveIcon, BackIcon, DeleteIcon, SearchIcon, PlusIcon, ToolIcon, ImageIcon } from '@/components/ui/Icons'
import { AlertTriangle, Check, Trash2, X } from 'lucide-react'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal'
import { recalculerProjetsBrouillonPourProduit } from '@/lib/utils/recalculCascade'
import type { Produit, ComposantForProduit } from '@/types'

// Alias pour compatibilité
type Composant = ComposantForProduit

// Couleurs PURPL
const COLORS = {
  ivoire: "#FFFEF5",
  ecru: "#EDEAE3", 
  noir: "#2F2F2E",
  olive: "#76715A",
  orangeDoux: "#E77E55",
  orangeChaud: "#ED693A",
  rougeDoux: "#C23C3C",
  vertDoux: "#409143",
}

type SelectedComposant = {
  composant_id: string
  quantite: number
  composant: Composant
}

interface ProduitModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingProduit?: Produit | null
  availableComposants: Composant[]
}

export function ProduitModal({
  isOpen,
  onClose,
  onSuccess,
  editingProduit = null,
  availableComposants
}: ProduitModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState<{
    type: "delete-product" | "delete-component"
    componentIndex?: number
    componentName?: string
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const initialFormData = {
    name: '',
    reference: '',
    description: '',
    categorie_id: null as string | null,
    prix_heure: 50,
    nombre_heures: 0,
  }
  
  const [formData, setFormData] = useState(initialFormData)
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null)
  const [originalData, setOriginalData] = useState(initialFormData)
  
  const [selectedComposants, setSelectedComposants] = useState<SelectedComposant[]>([])
  const [originalSelectedComposants, setOriginalSelectedComposants] = useState<SelectedComposant[]>([])
  
  const [showComposantSelector, setShowComposantSelector] = useState(false)
  const [composantSearch, setComposantSearch] = useState('')
  const [composantCategoryFilter, setComposantCategoryFilter] = useState<string>('all')
  const [composantCategories, setComposantCategories] = useState<any[]>([])
  
  const isEditMode = editingProduit !== null
  
  // Titre dynamique
  const modalTitle = useMemo(() => {
    if (formData.name.trim()) {
      return formData.name
    }
    return isEditMode ? 'Modifier le produit' : 'Nouveau produit'
  }, [formData.name, isEditMode])
  
  // Fetch catégories au mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchComposantCategories()
    }
  }, [isOpen])
  
  const fetchComposantCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories_composants')
        .select('*')
        .order('name')
      
      if (error) throw error
      if (data) {
        const filtered = data.filter(cat => {
          const name = cat.name?.toLowerCase().trim() || ''
          const isSansCategorie = name.includes('sans') && name.includes('catégorie') ||
                                  name.includes('sans') && name.includes('categorie') ||
                                  name === 'sans catégorie' ||
                                  name === 'sans_categorie' ||
                                  name === 'sans-catégorie' ||
                                  name === 'sans-categorie'
          return !isSansCategorie
        })
        setComposantCategories(filtered)
      }
    } catch (error) {
      console.error('Erreur fetch catégories composants:', error)
    }
  }
  
  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories_produits')
        .select('*')
        .order('name')
      
      if (data) setCategories(data)
    } catch (error) {
      console.error('Erreur fetch catégories:', error)
    }
  }
  
  // Charger données en mode édition
  useEffect(() => {
    if (isOpen && editingProduit) {
      const categorieId = editingProduit.categorie_id || 
                         (editingProduit.categories_produits?.id) || 
                         null
      
      const loadedData = {
        name: editingProduit.name,
        reference: editingProduit.reference || '',
        description: editingProduit.description || '',
        categorie_id: categorieId,
        prix_heure: (editingProduit as any).prix_heure || 0,
        nombre_heures: (editingProduit as any).nombre_heures || 0,
      }
      
      setFormData(loadedData)
      setOriginalData(loadedData)
      
      if (editingProduit.photo_url) {
        setPhotoPreview(editingProduit.photo_url)
        setOriginalPhotoUrl(editingProduit.photo_url)
      }
      
      const loadedComposants: SelectedComposant[] = editingProduit.produits_composants
        .map(pc => {
          const composant = availableComposants.find(c => c.id === pc.composant?.id)
          if (!composant || !pc.composant) return null
          
          return {
            composant_id: composant.id,
            quantite: pc.quantite,
            composant
          }
        })
        .filter((sc): sc is SelectedComposant => sc !== null)
      
      setSelectedComposants(loadedComposants)
      setOriginalSelectedComposants(JSON.parse(JSON.stringify(loadedComposants)))
      
    } else if (isOpen) {
      setFormData(initialFormData)
      setOriginalData(initialFormData)
      setPhotoPreview(null)
      setOriginalPhotoUrl(null)
      setPhotoFile(null)
      setSelectedComposants([])
      setOriginalSelectedComposants([])
    }
  }, [isOpen, editingProduit])
  
  // Reset à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData(initialFormData)
        setOriginalData(initialFormData)
        setPhotoFile(null)
        setPhotoPreview(null)
        setOriginalPhotoUrl(null)
        setError(null)
        setShowConfirmClose(false)
        setSelectedComposants([])
        setOriginalSelectedComposants([])
        setShowComposantSelector(false)
        setComposantSearch('')
      }, 200)
    }
  }, [isOpen])
  
  // Détection changements
  const hasChanges = () => {
    if (photoFile !== null) return true
    if (originalPhotoUrl && !photoPreview) return true
    
    const formChanged = 
      formData.name !== originalData.name ||
      formData.reference !== originalData.reference ||
      formData.description !== originalData.description ||
      formData.categorie_id !== originalData.categorie_id ||
      formData.prix_heure !== originalData.prix_heure ||
      formData.nombre_heures !== originalData.nombre_heures
    
    const composantsChanged = 
      selectedComposants.length !== originalSelectedComposants.length ||
      selectedComposants.some((sc, index) => {
        const original = originalSelectedComposants[index]
        return !original || 
          sc.composant_id !== original.composant_id || 
          sc.quantite !== original.quantite
      })
    
    return formChanged || composantsChanged
  }
  
  const handleClose = () => {
    if (hasChanges() && !showConfirmClose) {
      setShowConfirmClose(true)
    } else {
      onClose()
    }
  }
  
  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    onClose()
  }
  
  const handleCancelClose = () => {
    setShowConfirmClose(false)
  }
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }
  
  // Handlers composants
  const handleAddComposant = (composant: Composant) => {
    const exists = selectedComposants.find(sc => sc.composant_id === composant.id)
    if (exists) {
      setSelectedComposants(prev => 
        prev.map(sc => 
          sc.composant_id === composant.id 
            ? { ...sc, quantite: sc.quantite + 1 }
            : sc
        )
      )
    } else {
      setSelectedComposants(prev => [...prev, {
        composant_id: composant.id,
        quantite: 1,
        composant
      }])
    }
    setComposantSearch('')
  }
  
  const handleUpdateQuantite = (composantId: string, newQuantite: number) => {
    if (newQuantite < 1) {
      handleRemoveComposant(composantId)
      return
    }
    
    setSelectedComposants(prev =>
      prev.map(sc =>
        sc.composant_id === composantId
          ? { ...sc, quantite: newQuantite }
          : sc
      )
    )
  }
  
  const handleRemoveComposant = (composantId: string) => {
    setSelectedComposants(prev =>
      prev.filter(sc => sc.composant_id !== composantId)
    )
  }

  const handleRemoveComposantByIndex = (index: number) => {
    if (index >= 0 && index < selectedComposants.length) {
      const composantId = selectedComposants[index].composant_id
      handleRemoveComposant(composantId)
    }
  }

  const handleDelete = async () => {
    await handlePermanentDelete()
  }
  
  // Photo handler
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }
  
  // Calculs financiers
  const calculatedData = useMemo(() => {
    const composantsCostSubtotal = selectedComposants.reduce(
      (sum, sc) => sum + (sc.composant.prix_achat || 0) * sc.quantite, 
      0
    )
    
    const composantsSaleSubtotal = selectedComposants.reduce(
      (sum, sc) => sum + (sc.composant.prix_vente || 0) * sc.quantite,
      0
    )
    
    const laborCost = (formData.prix_heure || 0) * (formData.nombre_heures || 0)
    
    const totalWeight = selectedComposants.reduce(
      (sum, sc) => sum + ((sc.composant.poids || 0) * sc.quantite),
      0
    )
    
    const prixRevient = composantsCostSubtotal + laborCost
    const prixVente = composantsSaleSubtotal + laborCost
    const margeEuros = prixVente - prixRevient
    const margePourcent = prixRevient > 0 ? (margeEuros / prixRevient) * 100 : 0

    return {
      composantsCostSubtotal,
      composantsSaleSubtotal,
      laborCost,
      totalWeight,
      prixRevient,
      prixVente,
      margeEuros,
      margePourcent,
    }
  }, [selectedComposants, formData.prix_heure, formData.nombre_heures])

  const prixTotalComposants = calculatedData.composantsSaleSubtotal
  const prixVenteCalcule = calculatedData.prixVente

  const getMargeColor = (value: number) => {
    return value >= 0 ? COLORS.vertDoux : COLORS.rougeDoux
  }

  const getMargeBadgeColor = (percent: number) => {
    if (percent > 30) return COLORS.vertDoux
    if (percent > 15) return COLORS.orangeDoux
    if (percent > 0) return COLORS.orangeChaud
    return COLORS.rougeDoux
  }
  
  // Filtrage composants
  const filteredComposants = availableComposants.filter(comp => {
    const matchesSearch = composantSearch === '' ||
      comp.name.toLowerCase().includes(composantSearch.toLowerCase()) ||
      (comp.reference && comp.reference.toLowerCase().includes(composantSearch.toLowerCase()))
    
    const matchesCategory = composantCategoryFilter === 'all' ||
      comp.categorie_id === composantCategoryFilter
    
    return matchesSearch && matchesCategory
  })
  
  // Sauvegarde
  const performSave = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      let photo_url: string | null = editingProduit?.photo_url || null
      
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('produits-photos')
          .upload(fileName, photoFile)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('produits-photos')
          .getPublicUrl(fileName)
        
        photo_url = publicUrl
        
        if (editingProduit?.photo_url) {
          const oldFileName = editingProduit.photo_url.split('/').pop()
          if (oldFileName) {
            await supabase.storage
              .from('produits-photos')
              .remove([oldFileName])
          }
        }
      }
      
      const dataToSave = {
        name: formData.name,
        reference: formData.reference || null,
        description: formData.description || null,
        categorie_id: formData.categorie_id || null,
        photo_url,
        prix_vente_total: prixVenteCalcule,
        prix_heure: formData.prix_heure || 0,
        nombre_heures: formData.nombre_heures || 0,
      }
      
      let produitId: string
      
      if (isEditMode && editingProduit) {
        const { error: updateError } = await supabase
          .from('produits')
          .update(dataToSave)
          .eq('id', editingProduit.id)
        
        if (updateError) throw updateError
        
        produitId = editingProduit.id
        
        const { error: deleteError } = await supabase
          .from('produits_composants')
          .delete()
          .eq('produit_id', produitId)
        
        if (deleteError) throw deleteError
        
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('produits')
          .insert(dataToSave)
          .select()
          .single()
        
        if (insertError) throw insertError
        if (!insertData) throw new Error('Produit créé mais ID non retourné')
        
        produitId = insertData.id
      }
      
      if (selectedComposants.length > 0) {
        const composantsToInsert = selectedComposants.map(sc => ({
          produit_id: produitId,
          composant_id: sc.composant_id,
          quantite: sc.quantite
        }))
        
        const { error: insertComposantsError } = await supabase
          .from('produits_composants')
          .insert(composantsToInsert)
        
        if (insertComposantsError) throw insertComposantsError
      }

      recalculerProjetsBrouillonPourProduit(produitId).catch((err) =>
        console.error("Erreur recalcul projets brouillon:", err)
      )
      
      onSuccess()
      onClose()
      
    } catch (err: any) {
      setError(err.message || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermanentDelete = async () => {
    if (!isEditMode || !editingProduit) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (editingProduit.photo_url) {
        const oldFileName = editingProduit.photo_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('produits-photos')
            .remove([oldFileName])
        }
      }

      await supabase
        .from('produits_composants')
        .delete()
        .eq('produit_id', editingProduit.id)

      const { error: deleteError } = await supabase
        .from('produits')
        .delete()
        .eq('id', editingProduit.id)

      if (deleteError) throw deleteError

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression définitive')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      setError('Veuillez remplir le nom du produit')
      return
    }
    
    if (!hasChanges()) {
      return
    }
    
    if (hasChanges() && isEditMode) {
      setShowConfirmClose(true)
      return
    }
    
    await performSave()
  }
  
  const handleSaveAndClose = async () => {
    setShowConfirmClose(false)
    
    if (!formData.name) {
      setError('Veuillez remplir le nom du produit')
      return
    }
    
    await performSave()
  }
  
  if (!isOpen) return null
  
  return (
    <Fragment>
      {/* Overlay */}
      <div 
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        {/* Modal Container */}
        <div 
          className="rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          style={{ backgroundColor: COLORS.ivoire }}
        >
          {/* ===== HEADER FIXE ===== */}
          <div 
            className="flex-shrink-0 p-6"
            style={{ borderBottom: `1px solid ${COLORS.ecru}` }}
          >
            <div className="flex items-start justify-between gap-6">
              {/* Photo + Titre */}
              <div className="flex items-center gap-6">
                {/* Photo Upload */}
                <div className="flex-shrink-0">
                  <div 
                    className="w-32 h-32 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: COLORS.ecru }}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span style={{ color: COLORS.olive }}>
                        <ImageIcon className="w-10 h-10" />
                      </span>
                    )}
                  </div>
                  {/* Input file caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {/* Bouton Parcourir */}
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="mt-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: COLORS.olive }}
                  >
                    Parcourir
                  </button>
                </div>
                
                {/* Titre + ID */}
                <div>
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.noir }}
                  >
                    {modalTitle}
                  </h2>
                  {isEditMode && editingProduit?.reference && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: COLORS.olive }}
                    >
                      ID: {editingProduit.reference}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Bouton fermer */}
              <button
                onClick={handleClose}
                className="p-2 hover:opacity-70 transition-opacity"
                style={{ color: COLORS.olive }}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* ===== CONTENU SCROLLABLE ===== */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div 
                className="mb-6 p-4 rounded-lg border"
                style={{ 
                  backgroundColor: '#FEF2F2',
                  borderColor: COLORS.rougeDoux,
                  color: COLORS.rougeDoux 
                }}
              >
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ===== SECTION: Informations générales ===== */}
              <section>
                <h3 
                  className="text-lg font-semibold pb-3 mb-4"
                  style={{ 
                    color: COLORS.olive,
                    borderBottom: `1px solid ${COLORS.ecru}`
                  }}
                >
                  Informations générales
                </h3>
                
                {/* Nom */}
                <div className="mb-4">
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.olive }}
                  >
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors"
                    style={{ 
                      borderColor: COLORS.ecru,
                      backgroundColor: COLORS.ivoire,
                      color: COLORS.noir
                    }}
                    placeholder="Ex: Banc Light 450"
                  />
                </div>
                
                {/* Référence + Catégorie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Référence
                    </label>
                    <input
                      type="text"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                      placeholder="Ex: PRD-001"
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Catégorie
                    </label>
                    <select
                      value={formData.categorie_id || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__manage__') {
                          setShowCategoryManager(true);
                          return;
                        }
                        setFormData({
                          ...formData,
                          categorie_id: value || null,
                        });
                      }}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    >
                      <option value="">Aucune catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option disabled>────────────────</option>
                      <option value="__manage__">⚙ Gérer les catégories...</option>
                    </select>
                    
                    {/* Preview pastille couleur */}
                    {formData.categorie_id && (
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{
                            backgroundColor:
                              categories.find((c) => c.id === formData.categorie_id)?.color || COLORS.orangeChaud,
                          }}
                        />
                        <span className="text-sm" style={{ color: COLORS.olive }}>
                          {categories.find((c) => c.id === formData.categorie_id)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.olive }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none resize-y"
                    style={{ 
                      borderColor: COLORS.ecru,
                      backgroundColor: COLORS.ivoire,
                      color: COLORS.noir
                    }}
                    placeholder="Description du produit..."
                  />
                </div>
              </section>
              
              {/* ===== SECTION: Composants ===== */}
              <section 
                className="p-6 rounded-lg border"
                style={{ borderColor: COLORS.ecru }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: COLORS.olive }}
                  >
                    Composants
                  </h3>
                  <span 
                    className="px-3 py-1 rounded text-sm font-semibold text-white"
                    style={{ backgroundColor: COLORS.olive }}
                  >
                    {selectedComposants.length}
                  </span>
                </div>
                
                {/* Liste composants */}
                {selectedComposants.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {selectedComposants.map((sc, index) => (
                      <div 
                        key={sc.composant_id}
                        className="flex items-center gap-4 p-3 rounded-lg"
                        style={{ backgroundColor: COLORS.ecru }}
                      >
                        {/* Photo */}
                        <div 
                          className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: COLORS.olive }}
                        >
                          {sc.composant.photo_url ? (
                            <img 
                              src={sc.composant.photo_url} 
                              alt={sc.composant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ToolIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        
                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-medium truncate"
                            style={{ color: COLORS.noir }}
                          >
                            {sc.composant.name}
                          </p>
                          {sc.composant.reference && (
                            <p 
                              className="text-xs"
                              style={{ color: COLORS.olive }}
                            >
                              {sc.composant.reference}
                            </p>
                          )}
                        </div>
                        
                        {/* Prix unitaire */}
                        <div className="text-right">
                          <p 
                            className="text-xs"
                            style={{ color: COLORS.olive }}
                          >
                            Prix unitaire
                          </p>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: COLORS.noir }}
                          >
                            {sc.composant.prix_vente.toFixed(2)} €
                          </p>
                        </div>
                        
                        {/* Quantité avec boutons +/- stylés */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sc.composant_id, sc.quantite - 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                            style={{ backgroundColor: COLORS.orangeDoux }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={sc.quantite}
                            onChange={(e) => handleUpdateQuantite(sc.composant_id, parseInt(e.target.value) || 1)}
                            className="w-14 text-center py-1 rounded border-2 focus:outline-none"
                            style={{ 
                              borderColor: COLORS.ecru,
                              backgroundColor: COLORS.ivoire 
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sc.composant_id, sc.quantite + 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                            style={{ backgroundColor: COLORS.orangeDoux }}
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Total ligne */}
                        <div 
                          className="text-right w-20 font-semibold"
                          style={{ color: COLORS.orangeDoux }}
                        >
                          {(sc.composant.prix_vente * sc.quantite).toFixed(2)} €
                        </div>
                        
                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => setConfirmationModal({
                            type: "delete-component",
                            componentIndex: index,
                            componentName: sc.composant.name,
                          })}
                          className="p-2 hover:opacity-70 transition-opacity"
                          style={{ color: COLORS.rougeDoux }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p 
                    className="text-sm text-center py-4"
                    style={{ color: COLORS.olive }}
                  >
                    Aucun composant sélectionné
                  </p>
                )}
                
                {/* Bouton ajouter */}
                <button
                  type="button"
                  onClick={() => setShowComposantSelector(!showComposantSelector)}
                  className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mb-4"
                  style={{ backgroundColor: COLORS.olive }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un composant
                </button>
                
                {/* Sous-totaux */}
                {selectedComposants.length > 0 && (
                  <div className="space-y-1" style={{ color: COLORS.noir }}>
                    <p>
                      <span className="font-medium">Sous-total composants :</span>{" "}
                      <span style={{ color: COLORS.orangeDoux, fontWeight: 600 }}>
                        {prixTotalComposants.toFixed(2)} €
                      </span>
                    </p>
                    {calculatedData.totalWeight > 0 && (
                      <p>
                        <span className="font-medium">Poids total :</span>{" "}
                        <span style={{ color: COLORS.olive, fontWeight: 600 }}>
                          {calculatedData.totalWeight.toFixed(2)} kg
                        </span>
                      </p>
                    )}
                  </div>
                )}
                
                {/* Sélecteur composants */}
                {showComposantSelector && (
                  <div 
                    className="mt-4 p-4 rounded-lg border-2"
                    style={{ borderColor: COLORS.olive }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium" style={{ color: COLORS.olive }}>
                        Bibliothèque composants
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowComposantSelector(false)}
                        className="hover:opacity-70"
                        style={{ color: COLORS.olive }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    {/* Recherche + Filtre */}
                    <div className="space-y-3 mb-3">
                      <div className="relative">
                        <span 
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: COLORS.olive }}
                        >
                          <SearchIcon className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={composantSearch}
                          onChange={(e) => setComposantSearch(e.target.value)}
                          placeholder="Rechercher un composant..."
                          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none"
                          style={{ borderColor: COLORS.ecru }}
                        />
                      </div>
                      
                      <select
                        value={composantCategoryFilter}
                        onChange={(e) => setComposantCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                        style={{ 
                          borderColor: COLORS.ecru,
                          backgroundColor: COLORS.ivoire 
                        }}
                      >
                        <option value="all">Toutes les catégories</option>
                        {composantCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Liste */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredComposants.map(comp => {
                        const isSelected = selectedComposants.some(sc => sc.composant_id === comp.id)
                        
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleAddComposant(comp)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left"
                            style={{ 
                              backgroundColor: isSelected ? `${COLORS.orangeDoux}20` : 'transparent',
                              border: isSelected ? `1px solid ${COLORS.orangeDoux}` : '1px solid transparent'
                            }}
                          >
                            <div 
                              className="w-10 h-10 rounded flex items-center justify-center overflow-hidden flex-shrink-0"
                              style={{ backgroundColor: COLORS.ecru }}
                            >
                              {comp.photo_url ? (
                                <img 
                                  src={comp.photo_url} 
                                  alt={comp.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span style={{ color: COLORS.olive }}>
                                  <ToolIcon className="w-5 h-5" />
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-medium truncate flex items-center gap-2"
                                style={{ color: COLORS.noir }}
                              >
                                {comp.name}
                                {isSelected && <Check className="w-4 h-4" style={{ color: COLORS.orangeDoux }} />}
                              </p>
                              {comp.reference && (
                                <p className="text-xs" style={{ color: COLORS.olive }}>
                                  Réf: {comp.reference}
                                </p>
                              )}
                            </div>
                            
                            <p 
                              className="text-sm font-semibold"
                              style={{ color: COLORS.orangeDoux }}
                            >
                              {comp.prix_vente.toFixed(2)} €
                            </p>
                          </button>
                        )
                      })}
                      
                      {filteredComposants.length === 0 && (
                        <p 
                          className="text-sm text-center py-4"
                          style={{ color: COLORS.olive }}
                        >
                          Aucun composant trouvé
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
              
              {/* ===== SECTION: Main d'œuvre ===== */}
              <section 
                className="p-6 rounded-lg border"
                style={{ borderColor: COLORS.ecru }}
              >
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: COLORS.olive }}
                >
                  Coût de la main d'œuvre
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* Prix de l'heure */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Prix de l'heure
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          prix_heure: Math.max(0, (formData.prix_heure || 0) - 5) 
                        })}
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                        style={{ backgroundColor: COLORS.orangeDoux }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.prix_heure}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          prix_heure: parseFloat(e.target.value) || 0 
                        })}
                        className="flex-1 text-center py-2 rounded-lg border-2 focus:outline-none"
                        style={{ 
                          borderColor: COLORS.ecru,
                          backgroundColor: COLORS.ivoire 
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          prix_heure: (formData.prix_heure || 0) + 5 
                        })}
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                        style={{ backgroundColor: COLORS.orangeDoux }}
                      >
                        +
                      </button>
                      <span 
                        className="text-sm font-medium ml-2"
                        style={{ color: COLORS.olive }}
                      >
                        €/h
                      </span>
                    </div>
                  </div>
                  
                  {/* Nombre d'heures */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Nombre d'heures
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          nombre_heures: Math.max(0, (formData.nombre_heures || 0) - 0.5) 
                        })}
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                        style={{ backgroundColor: COLORS.orangeDoux }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.nombre_heures}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          nombre_heures: parseFloat(e.target.value) || 0 
                        })}
                        className="flex-1 text-center py-2 rounded-lg border-2 focus:outline-none"
                        style={{ 
                          borderColor: COLORS.ecru,
                          backgroundColor: COLORS.ivoire 
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          nombre_heures: (formData.nombre_heures || 0) + 0.5 
                        })}
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                        style={{ backgroundColor: COLORS.orangeDoux }}
                      >
                        +
                      </button>
                      <span 
                        className="text-sm font-medium ml-2"
                        style={{ color: COLORS.olive }}
                      >
                        h
                      </span>
                    </div>
                  </div>
                </div>
                
                 {/* Sous-total main d'œuvre */}
                 <p style={{ color: COLORS.noir }}>
                   <span className="font-medium">Sous-total main d'œuvre :</span>{" "}
                   <span style={{ color: COLORS.orangeDoux, fontWeight: 600 }}>
                     {calculatedData.laborCost.toFixed(2)} €
                   </span>
                 </p>
              </section>
              
              {/* ===== SECTION: Récapitulatif financier ===== */}
              <section
                className="p-6 rounded-lg border-l-4"
                style={{
                  backgroundColor: COLORS.ecru,
                  borderLeftColor: COLORS.olive,
                }}
              >
                <h3 
                  className="text-lg font-semibold mb-6" 
                  style={{ color: COLORS.olive }}
                >
                  Récapitulatif financier
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Prix de revient */}
                  <div 
                    className="p-4 rounded-lg" 
                    style={{ backgroundColor: COLORS.ivoire }}
                  >
                    <p 
                      className="text-xs uppercase tracking-wider" 
                      style={{ color: COLORS.olive }}
                    >
                      Prix de revient
                    </p>
                    <p 
                      className="text-2xl font-bold mt-1" 
                      style={{ color: COLORS.noir }}
                    >
                      {calculatedData.prixRevient.toFixed(2)} €
                    </p>
                  </div>

                  {/* Prix de vente */}
                  <div 
                    className="p-4 rounded-lg" 
                    style={{ backgroundColor: COLORS.ivoire }}
                  >
                    <p 
                      className="text-xs uppercase tracking-wider" 
                      style={{ color: COLORS.olive }}
                    >
                      Prix de vente
                    </p>
                    <p 
                      className="text-2xl font-bold mt-1" 
                      style={{ color: COLORS.olive }}
                    >
                      {calculatedData.prixVente.toFixed(2)} €
                    </p>
                  </div>

                  {/* Marge € */}
                  <div 
                    className="p-4 rounded-lg" 
                    style={{ backgroundColor: COLORS.ivoire }}
                  >
                    <p 
                      className="text-xs uppercase tracking-wider" 
                      style={{ color: COLORS.olive }}
                    >
                      Marge
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: getMargeColor(calculatedData.margeEuros) }}
                    >
                      {calculatedData.margeEuros.toFixed(2)} €
                    </p>
                  </div>

                  {/* Marge % */}
                  <div 
                    className="p-4 rounded-lg" 
                    style={{ backgroundColor: COLORS.ivoire }}
                  >
                    <p 
                      className="text-xs uppercase tracking-wider" 
                      style={{ color: COLORS.olive }}
                    >
                      Marge %
                    </p>
                    <div className="mt-1">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-bold text-white inline-block"
                        style={{ backgroundColor: getMargeBadgeColor(calculatedData.margePourcent) }}
                      >
                        {calculatedData.margePourcent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formules */}
                <div 
                  className="space-y-1 text-xs" 
                  style={{ color: COLORS.olive }}
                >
                  <p>Prix de revient = Composants (coût) + Main d'œuvre</p>
                  <p>Marge = Prix vente - Prix revient</p>
                </div>
              </section>
              
              {/* ===== Bouton Supprimer ===== */}
              {isEditMode && (
                <section>
                  <button
                    type="button"
                    onClick={() => setConfirmationModal({ type: "delete-product" })}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border-2 hover:bg-red-50 disabled:opacity-50"
                    style={{
                      backgroundColor: COLORS.ivoire,
                      color: COLORS.rougeDoux,
                      borderColor: COLORS.rougeDoux,
                    }}
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </section>
              )}
            </form>
          </div>
          
          {/* ===== FOOTER FIXE ===== */}
          <div 
            className="flex-shrink-0 flex justify-end gap-3 p-6"
            style={{ borderTop: `1px solid ${COLORS.ecru}` }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium border-2 transition-colors"
              style={{ 
                borderColor: COLORS.olive,
                color: COLORS.olive,
                backgroundColor: COLORS.ivoire
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: COLORS.orangeDoux }}
            >
              {isLoading 
                ? (isEditMode ? 'Modification...' : 'Création...') 
                : (isEditMode ? 'Modifier le produit' : 'Créer le produit')
              }
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="produits"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}
      
      {/* Popup confirmation 3 boutons */}
      {showConfirmClose && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelClose()
            }
          }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
        >
          <div 
            className="rounded-xl max-w-md w-full p-6"
            style={{ backgroundColor: COLORS.ivoire }}
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ color: COLORS.noir }}
            >
              {isEditMode ? 'Modifications non enregistrées' : 'Création en cours'}
            </h3>
            <p 
              className="mb-6"
              style={{ color: COLORS.olive }}
            >
              Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isLoading}
                className="w-full px-6 py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.orangeDoux }}
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer et fermer'}
              </button>
              
              <button
                type="button"
                onClick={handleCancelClose}
                className="w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border-2"
                style={{ 
                  borderColor: COLORS.olive,
                  color: COLORS.olive 
                }}
              >
                <BackIcon className="w-5 h-5" />
                Continuer l'édition
              </button>
              
              <button
                type="button"
                onClick={handleConfirmClose}
                className="w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border-2"
                style={{ 
                  borderColor: COLORS.rougeDoux,
                  color: COLORS.rougeDoux 
                }}
              >
                <DeleteIcon className="w-5 h-5" />
                Abandonner les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup confirmation suppression composant */}
      {confirmationModal?.type === "delete-component" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div 
            className="rounded-xl w-full max-w-sm p-6" 
            style={{ backgroundColor: COLORS.ivoire }}
          >
            <div className="flex justify-center mb-4">
              <AlertTriangle size={40} style={{ color: COLORS.rougeDoux }} />
            </div>
            <h3 
              className="text-xl font-semibold text-center mb-2" 
              style={{ color: COLORS.noir }}
            >
              Retirer ce composant ?
            </h3>
            <p 
              className="text-center text-sm mb-6" 
              style={{ color: COLORS.olive }}
            >
              Voulez-vous retirer <strong>{confirmationModal.componentName}</strong> de ce produit ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmationModal(null)}
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
                onClick={() => {
                  if (confirmationModal.componentIndex !== undefined) {
                    handleRemoveComposantByIndex(confirmationModal.componentIndex)
                  }
                  setConfirmationModal(null)
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: COLORS.rougeDoux }}
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup confirmation suppression produit */}
      {confirmationModal?.type === "delete-product" && (
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
                onClick={() => setConfirmationModal(null)}
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
                onClick={() => {
                  handleDelete()
                  setConfirmationModal(null)
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50"
                style={{ backgroundColor: COLORS.rougeDoux }}
              >
                {isLoading ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  )
}