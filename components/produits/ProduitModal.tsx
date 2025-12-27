'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CloseIcon, SaveIcon, BackIcon, DeleteIcon, SearchIcon, PlusIcon, ToolIcon, ImageIcon, SettingsIcon, WeightIcon } from '@/components/ui/Icons'
import { AlertTriangle, Check } from 'lucide-react'
import CategoryManagerModal from '@/components/categories/CategoryManagerModal'
import { recalculerProjetsBrouillonPourProduit } from '@/lib/utils/recalculCascade'
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
    } | null
  }>
  categories_produits: {
    id: string
    name: string
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

type SelectedComposant = {
  composant_id: string
  quantite: number
  composant: Composant  // Pour afficher les infos
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const initialFormData = {
    name: '',
    reference: '',
    description: '',
    categorie_id: null as string | null,
    prix_heure: 0,
    nombre_heures: 0,
    is_active: true,
  }
  
  const [formData, setFormData] = useState(initialFormData)
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null)
  const [originalData, setOriginalData] = useState(initialFormData)
  
  // State pour composants sélectionnés
  const [selectedComposants, setSelectedComposants] = useState<SelectedComposant[]>([])
  const [originalSelectedComposants, setOriginalSelectedComposants] = useState<SelectedComposant[]>([])
  
  // State pour le sélecteur
  const [showComposantSelector, setShowComposantSelector] = useState(false)
  const [composantSearch, setComposantSearch] = useState('')
  
  const isEditMode = editingProduit !== null
  
  // Fetch catégories au mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])
  
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
      // Extraire categorie_id du produit (peut être dans l'objet directement ou via categories_produits)
      const categorieId = editingProduit.categorie_id || 
                         (editingProduit.categories_produits?.id) || 
                         null
      
      console.log('📥 Chargement produit en édition:', {
        produitId: editingProduit.id,
        produitName: editingProduit.name,
        categorie_id_direct: editingProduit.categorie_id,
        categories_produits: editingProduit.categories_produits,
        categorieId_extrait: categorieId
      })
      
      const loadedData = {
        name: editingProduit.name,
        reference: editingProduit.reference || '',
        description: editingProduit.description || '',
        categorie_id: categorieId,
        prix_heure: (editingProduit as any).prix_heure || 0,
        nombre_heures: (editingProduit as any).nombre_heures || 0,
        is_active: editingProduit.is_active ?? true,
      }
      
      console.log('📝 loadedData avec categorie_id:', loadedData.categorie_id)
      
      setFormData(loadedData)
      setOriginalData(loadedData)
      
      // Charger composants sélectionnés
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
      setOriginalSelectedComposants(JSON.parse(JSON.stringify(loadedComposants))) // Deep copy
      
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
    // Nouvelle photo uploadée
    if (photoFile !== null) return true
    
    // Photo supprimée (était présente, plus maintenant)
    if (originalPhotoUrl && !photoPreview) return true
    
    const formChanged = 
      formData.name !== originalData.name ||
      formData.reference !== originalData.reference ||
      formData.description !== originalData.description ||
      formData.categorie_id !== originalData.categorie_id ||
      formData.prix_heure !== originalData.prix_heure ||
      formData.nombre_heures !== originalData.nombre_heures ||
      formData.is_active !== originalData.is_active
    
    // Vérifier changements composants
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
  
  
  // Handlers pour gérer les composants
  const handleAddComposant = (composant: Composant) => {
    // Vérifier si déjà ajouté
    const exists = selectedComposants.find(sc => sc.composant_id === composant.id)
    if (exists) {
      // Incrémenter la quantité
      setSelectedComposants(prev => 
        prev.map(sc => 
          sc.composant_id === composant.id 
            ? { ...sc, quantite: sc.quantite + 1 }
            : sc
        )
      )
    } else {
      // Ajouter nouveau
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
  
  // Handler pour upload photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }
  
  // ✅ CALCULS - UNE SEULE FOIS ICI (accessible par toutes les fonctions)
  // Prix total composants
  const prixTotalComposants = selectedComposants.reduce((total, sc) => {
    return total + (sc.composant.prix_vente * sc.quantite)
  }, 0)
  
  // Poids total = Σ (composant.poids × quantité)
  // Ignorer les composants sans poids (null, undefined, 0)
  const poidsTotal = selectedComposants.reduce((total, sc) => {
    if (!sc.composant || !sc.composant.poids) return total
    return total + (sc.composant.poids * sc.quantite)
  }, 0)
  
  // Coût temps = Prix de l'heure × Nombre d'heures
  const coutTemps = (formData.prix_heure || 0) * (formData.nombre_heures || 0)
  
  // Prix vente final
  const prixVenteCalcule = prixTotalComposants + coutTemps
  
  // Filtrage composants pour le sélecteur
  const filteredComposants = availableComposants.filter(comp =>
    composantSearch === '' ||
    comp.name.toLowerCase().includes(composantSearch.toLowerCase()) ||
    (comp.reference && comp.reference.toLowerCase().includes(composantSearch.toLowerCase()))
  )
  
  // ✅ Fonction commune pour la sauvegarde
  const performSave = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      let photo_url: string | null = editingProduit?.photo_url || null
      
      // Upload nouvelle photo si fichier sélectionné
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
        
        // Supprimer ancienne photo si existe
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
        is_active: formData.is_active,
      }

      // Debug: vérifier categorie_id
      console.log('📝 dataToSave:', dataToSave)
      console.log('🔍 categorie_id:', formData.categorie_id)
      
      let produitId: string
      
      if (isEditMode && editingProduit) {
        const { error: updateError } = await supabase
          .from('produits')
          .update(dataToSave)
          .eq('id', editingProduit.id)
        
        if (updateError) throw updateError
        
        produitId = editingProduit.id
        
        // Supprimer anciens composants
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
      
      // Insérer nouveaux composants
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

      // Recalculer les projets brouillon qui utilisent ce produit
      recalculerProjetsBrouillonPourProduit(produitId).catch((err) =>
        console.error("Erreur recalcul projets brouillon:", err)
      )
      
      onSuccess()
      onClose()
      
    } catch (err: any) {
      setError(err.message || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'}`)
      throw err // Relancer pour que les appelants puissent gérer
    } finally {
      setIsLoading(false)
    }
  }

  // Suppression définitive
  const handlePermanentDelete = async () => {
    if (!isEditMode || !editingProduit) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Supprimer la photo si elle existe
      if (editingProduit.photo_url) {
        const oldFileName = editingProduit.photo_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('produits-photos')
            .remove([oldFileName])
        }
      }

      // Supprimer les relations produits_composants
      await supabase
        .from('produits_composants')
        .delete()
        .eq('produit_id', editingProduit.id)

      // Supprimer définitivement de la base de données
      const { error: deleteError } = await supabase
        .from('produits')
        .delete()
        .eq('id', editingProduit.id)

      if (deleteError) throw deleteError

      // Rafraîchir et fermer
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression définitive')
    } finally {
      setIsLoading(false)
      setShowDeleteConfirm(false)
    }
  }
  
  // handleSubmit - gère Entrée et clic sur bouton
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name) {
      setError('Veuillez remplir le nom du produit')
      return
    }
    
    // Si pas de changements, ne rien faire
    if (!hasChanges()) {
      // Aucune modification à enregistrer
      return
    }
    
    // Si des changements et en mode édition, ouvrir le popup
    if (hasChanges() && isEditMode) {
      setShowConfirmClose(true)
      return
    }
    
    // Si nouveau (création) ou pas de changements, sauvegarder directement
    await performSave()
  }
  
  // handleSaveAndClose avec logs de debug
  const handleSaveAndClose = async () => {
    console.log('🔵 handleSaveAndClose - Début')
    console.log('📝 formData:', formData)
    console.log('🧩 selectedComposants:', selectedComposants)
    console.log('✏️ isEditMode:', isEditMode)
    console.log('📦 editingProduit:', editingProduit)
    
    setShowConfirmClose(false)
    
    // Validation
    if (!formData.name) {
      console.log('❌ Validation échouée: nom manquant')
      setError('Veuillez remplir le nom du produit')
      return
    }
    
    console.log('✅ Validation OK, démarrage sauvegarde...')
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      console.log('🔌 Supabase client créé')
      
      let photo_url: string | null = editingProduit?.photo_url || null
      console.log('📸 photo_url initial:', photo_url)
      
      // Upload nouvelle photo si fichier sélectionné
      if (photoFile) {
        console.log('📤 Upload nouvelle photo...')
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('produits-photos')
          .upload(fileName, photoFile)
        
        if (uploadError) {
          console.error('❌ Erreur upload photo:', uploadError)
          throw uploadError
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('produits-photos')
          .getPublicUrl(fileName)
        
        photo_url = publicUrl
        console.log('✅ Photo uploadée:', photo_url)
        
        // Supprimer ancienne photo si existe
        if (editingProduit?.photo_url) {
          const oldFileName = editingProduit.photo_url.split('/').pop()
          if (oldFileName) {
            await supabase.storage
              .from('produits-photos')
              .remove([oldFileName])
            console.log('🗑️ Ancienne photo supprimée')
          }
        }
      }
      
      // Utilise directement prixVenteCalcule (défini plus bas)
      console.log('💰 Prix composants:', prixTotalComposants)
      console.log('⏱️ Coût temps:', coutTemps)
      console.log('💵 Prix vente final:', prixVenteCalcule)
      
      const dataToSave = {
        name: formData.name,
        reference: formData.reference || null,
        description: formData.description || null,
        categorie_id: formData.categorie_id || null,
        photo_url,
        prix_vente_total: prixVenteCalcule,
        prix_heure: formData.prix_heure || 0,
        nombre_heures: formData.nombre_heures || 0,
        is_active: formData.is_active,
      }
      console.log('💾 Données à sauvegarder:', dataToSave)
      console.log('🔍 categorie_id dans dataToSave:', dataToSave.categorie_id)
      
      let produitId: string
      
      if (isEditMode) {
        console.log('✏️ Mode ÉDITION - Update produit ID:', editingProduit?.id)
        
        if (!editingProduit?.id) {
          console.error('❌ editingProduit.id est undefined!')
          throw new Error('ID du produit manquant pour la modification')
        }
        
        const { error: updateError } = await supabase
          .from('produits')
          .update(dataToSave)
          .eq('id', editingProduit.id)
        
        if (updateError) {
          console.error('❌ Erreur update produit:', updateError)
          console.error('❌ Détails updateError:', JSON.stringify(updateError, null, 2))
          throw updateError
        }
        
        console.log('✅ Produit mis à jour')
        produitId = editingProduit.id
        
        // Supprimer anciens composants
        console.log('🗑️ Suppression anciens composants...')
        const { error: deleteError } = await supabase
          .from('produits_composants')
          .delete()
          .eq('produit_id', produitId)
        
        if (deleteError) {
          console.error('❌ Erreur suppression composants:', deleteError)
          console.error('❌ Détails deleteError:', JSON.stringify(deleteError, null, 2))
          throw deleteError
        }
        console.log('✅ Anciens composants supprimés')
        
      } else {
        console.log('➕ Mode CRÉATION - Insert nouveau produit')
        
        const { data: insertData, error: insertError } = await supabase
          .from('produits')
          .insert(dataToSave)
          .select()
          .single()
        
        if (insertError) {
          console.error('❌ Erreur insert produit:', insertError)
          console.error('❌ Détails insertError:', JSON.stringify(insertError, null, 2))
          throw insertError
        }
        
        if (!insertData) {
          console.error('❌ Produit créé mais ID non retourné')
          throw new Error('Produit créé mais ID non retourné')
        }
        
        produitId = insertData.id
        console.log('✅ Produit créé avec ID:', produitId)
      }
      
      // Insérer nouveaux composants
      if (selectedComposants.length > 0) {
        console.log('📦 Insertion composants:', selectedComposants.length)
        
        const composantsToInsert = selectedComposants.map(sc => ({
          produit_id: produitId,
          composant_id: sc.composant_id,
          quantite: sc.quantite
        }))
        console.log('📦 Composants à insérer:', composantsToInsert)
        
        const { error: insertComposantsError } = await supabase
          .from('produits_composants')
          .insert(composantsToInsert)
        
        if (insertComposantsError) {
          console.error('❌ Erreur insertion composants:', insertComposantsError)
          console.error('❌ Détails insertComposantsError:', JSON.stringify(insertComposantsError, null, 2))
          throw insertComposantsError
        }
        console.log('✅ Composants insérés')
      } else {
        console.log('ℹ️ Aucun composant à insérer')
      }

      // Recalculer les projets brouillon qui utilisent ce produit
      recalculerProjetsBrouillonPourProduit(produitId).catch((err) =>
        console.error("Erreur recalcul projets brouillon:", err)
      )
      
      console.log('🎉 Sauvegarde terminée avec succès !')
      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error('💥 ERREUR DANS handleSaveAndClose:', err)
      console.error('💥 Type:', typeof err)
      console.error('💥 Message:', err?.message)
      console.error('💥 Stack:', err?.stack)
      console.error('💥 Objet complet:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = err?.message || err?.toString() || JSON.stringify(err) || 'Erreur lors de la sauvegarde'
      console.error('💥 Message d\'erreur final:', errorMessage)
      
      setError(errorMessage)
      setShowConfirmClose(false)
    } finally {
      setIsLoading(false)
      console.log('🏁 handleSaveAndClose - Fin')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <Fragment>
      <div 
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purpl-black">
                {isEditMode ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button
                onClick={handleClose}
                className="text-purpl-green hover:text-purpl-orange transition-colors"
                type="button"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom + Référence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                    placeholder="Ex: Table basse chêne"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                    placeholder="Ex: PRD-001"
                  />
                </div>
              </div>
              
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Catégorie
                </label>
                
                {/* Select catégorie */}
                <select
                  value={formData.categorie_id || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // Si option "Gérer les catégories" cliquée
                    if (value === '__manage__') {
                      setShowCategoryManager(true);
                      return;
                    }
                    
                    // Sinon, changer la catégorie normalement
                    setFormData({
                      ...formData,
                      categorie_id: value || null,
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                >
                  <option value="">Aucune catégorie</option>
                  
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

                {/* Preview pastille couleur si catégorie sélectionnée */}
                {formData.categorie_id && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{
                        backgroundColor:
                          categories.find((c) => c.id === formData.categorie_id)
                            ?.color || '#ED693A',
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {
                        categories.find((c) => c.id === formData.categorie_id)
                          ?.name
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Modal gestion catégories */}
              {showCategoryManager && (
                <CategoryManagerModal
                  type="produits"
                  onClose={() => setShowCategoryManager(false)}
                  onUpdate={fetchCategories}
                />
              )}
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                  placeholder="Description du produit..."
                />
              </div>
              
              {/* Photo produit */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Photo du produit
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 bg-purpl-ecru rounded-lg flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : editingProduit?.photo_url ? (
                      <img
                        src={editingProduit.photo_url}
                        alt="Photo actuelle"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-purpl-green opacity-40" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {/* Sélecteur de composants */}
              <div className="border-2 border-purpl-ecru rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-purpl-black">
                    Composants ({selectedComposants.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowComposantSelector(!showComposantSelector)}
                    className="px-4 py-2 bg-purpl-green text-white rounded-lg hover:bg-purpl-green/90 transition-colors flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ajouter un composant
                  </button>
                </div>
                
                {/* Liste composants sélectionnés */}
                {selectedComposants.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {selectedComposants.map(sc => (
                      <div 
                        key={sc.composant_id}
                        className="flex items-center gap-3 p-3 bg-purpl-ecru rounded-lg"
                      >
                        {/* Photo miniature */}
                        <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          {sc.composant.photo_url ? (
                            <img 
                              src={sc.composant.photo_url} 
                              alt={sc.composant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ToolIcon className="w-6 h-6 text-purpl-green" />
                          )}
                        </div>
                        
                        {/* Nom + Référence */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-purpl-black truncate">
                            {sc.composant.name}
                          </p>
                          {sc.composant.reference && (
                            <p className="text-xs text-purpl-green">
                              Réf: {sc.composant.reference}
                            </p>
                          )}
                        </div>
                        
                        {/* Prix unitaire */}
                        <div className="text-right">
                          <p className="text-sm text-purpl-black">
                            {sc.composant.prix_vente.toFixed(2)} €
                          </p>
                          <p className="text-xs text-purpl-green">unitaire</p>
                        </div>
                        
                        {/* Quantité */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sc.composant_id, sc.quantite - 1)}
                            className="w-8 h-8 bg-white rounded border border-purpl-ecru hover:bg-purpl-ecru transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={sc.quantite}
                            onChange={(e) => handleUpdateQuantite(sc.composant_id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center px-2 py-1 border-2 border-purpl-ecru rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sc.composant_id, sc.quantite + 1)}
                            className="w-8 h-8 bg-white rounded border border-purpl-ecru hover:bg-purpl-ecru transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Total */}
                        <div className="text-right w-24">
                          <p className="font-semibold text-purpl-orange">
                            {(sc.composant.prix_vente * sc.quantite).toFixed(2)} €
                          </p>
                        </div>
                        
                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleRemoveComposant(sc.composant_id)}
                          className="p-2 hover:bg-red-100 rounded transition-colors"
                          title="Retirer"
                        >
                          <DeleteIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-purpl-green text-center py-4">
                    Aucun composant sélectionné
                  </p>
                )}
                
                {/* Prix total composants */}
                {selectedComposants.length > 0 && (
                  <div className="pt-3 border-t border-purpl-ecru space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-purpl-black">
                        Prix total composants :
                      </span>
                      <span className="text-xl font-bold text-purpl-orange">
                        {prixTotalComposants.toFixed(2)} €
                      </span>
                    </div>
                    
                    {/* Poids total */}
                    {poidsTotal > 0 && (
                      <div className="flex items-center gap-1 text-xs text-purpl-green">
                        <WeightIcon className="w-4 h-4" />
                        <span>{poidsTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Sélecteur composants (popup) */}
                {showComposantSelector && (
                  <div className="mt-4 p-4 bg-white border-2 border-purpl-green rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-purpl-black">Bibliothèque composants</h4>
                      <button
                        type="button"
                        onClick={() => setShowComposantSelector(false)}
                        className="text-purpl-green hover:text-purpl-orange"
                      >
                        <CloseIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Recherche */}
                    <div className="relative mb-3">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purpl-green" />
                      <input
                        type="text"
                        value={composantSearch}
                        onChange={(e) => setComposantSearch(e.target.value)}
                        placeholder="Rechercher un composant..."
                        className="w-full pl-10 pr-4 py-2 border border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                      />
                    </div>
                    
                    {/* Liste composants disponibles */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredComposants.map(comp => {
                        const isSelected = selectedComposants.some(sc => sc.composant_id === comp.id)
                        
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => handleAddComposant(comp)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                              isSelected 
                                ? 'bg-purpl-orange/10 border border-purpl-orange' 
                                : 'hover:bg-purpl-ecru border border-transparent'
                            }`}
                          >
                            <div className="w-10 h-10 bg-purpl-ecru rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                              {comp.photo_url ? (
                                <img 
                                  src={comp.photo_url} 
                                  alt={comp.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ToolIcon className="w-5 h-5 text-purpl-green" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-purpl-black truncate flex items-center gap-2">
                                {comp.name}
                                {isSelected && <Check className="w-4 h-4 text-purpl-orange" />}
                              </p>
                              {comp.reference && (
                                <p className="text-xs text-purpl-green">Réf: {comp.reference}</p>
                              )}
                            </div>
                            
                            <p className="text-sm font-semibold text-purpl-orange">
                              {comp.prix_vente.toFixed(2)} €
                            </p>
                          </button>
                        )
                      })}
                      
                      {filteredComposants.length === 0 && (
                        <p className="text-sm text-purpl-green text-center py-4">
                          Aucun composant trouvé
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Coût de la main d'œuvre */}
              <div className="border-2 border-purpl-ecru rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purpl-black mb-3">
                  Coût de la main d'œuvre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Prix de l'heure (€/h)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.prix_heure}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        prix_heure: parseFloat(e.target.value) || 0 
                      })}
                      className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Nombre d'heures (h)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nombre_heures}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        nombre_heures: parseFloat(e.target.value) || 0 
                      })}
                      className="w-full px-4 py-2 border-2 border-purpl-ecru rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="0.0"
                    />
                  </div>
                </div>
                
                {/* Affichage coût temps calculé */}
                {coutTemps > 0 && (
                  <div className="mt-3 pt-3 border-t border-purpl-ecru">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purpl-green">
                        Coût temps :
                      </span>
                      <span className="text-sm font-semibold text-purpl-orange">
                        {coutTemps.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Résumé des coûts simplifié */}
              <div className="bg-purpl-ecru rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purpl-green">Prix composants (avec marge) :</span>
                  <span className="font-medium text-purpl-black">
                    {prixTotalComposants.toFixed(2)} €
                  </span>
                </div>
                
                {coutTemps > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purpl-green">
                      Main d'œuvre :
                    </span>
                    <span className="font-medium text-purpl-black">
                      {coutTemps.toFixed(2)} €
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between pt-3 border-t-2 border-purpl-orange">
                  <span className="text-purpl-black font-bold text-lg">Prix vente final :</span>
                  <span className="font-bold text-purpl-orange text-xl">
                    {prixVenteCalcule.toFixed(2)} €
                  </span>
                </div>
              </div>
              
              {/* Archivage */}
              {isEditMode && (
                <div className="pt-4 border-t border-purpl-ecru">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: !e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-purpl-ecru text-purpl-orange focus:ring-purpl-orange cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-purpl-black group-hover:text-purpl-orange transition-colors">
                        Archiver ce produit
                      </span>
                      <p className="text-xs text-purpl-green mt-1">
                        Le produit n'apparaîtra plus dans les listes actives
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Bouton Supprimer définitivement - Uniquement si archivé */}
              {isEditMode && !formData.is_active && (
                <div className="pt-4 border-t border-red-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 mb-3 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Ce produit est archivé
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                      <DeleteIcon className="w-4 h-4" />
                      Supprimer définitivement
                    </button>
                    <p className="text-xs text-red-600 mt-2">
                      Cette action est irréversible. Le produit sera supprimé de manière permanente.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2 border-2 border-purpl-ecru rounded-lg hover:bg-purpl-ecru transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors disabled:opacity-50"
                >
                  {isLoading 
                    ? (isEditMode ? 'Modification...' : 'Création...') 
                    : (isEditMode ? 'Modifier le produit' : 'Créer le produit')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
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
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-xl font-bold text-purpl-black mb-4">
              {isEditMode ? 'Modifications non enregistrées' : 'Création en cours'}
            </h3>
            <p className="text-purpl-green mb-6">
              Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer et fermer'}
              </button>
              
              <button
                type="button"
                onClick={handleCancelClose}
                className="w-full px-6 py-3 border-2 border-purpl-green text-purpl-green rounded-lg hover:bg-purpl-ecru transition-colors font-medium flex items-center justify-center gap-2"
              >
                <BackIcon className="w-5 h-5" />
                Continuer l'édition
              </button>
              
              <button
                type="button"
                onClick={handleConfirmClose}
                className="w-full px-6 py-3 border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <DeleteIcon className="w-5 h-5" />
                Abandonner les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression définitive */}
      {showDeleteConfirm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Suppression définitive
            </h3>
            <p className="text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer définitivement ce produit ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Cette action est <strong>irréversible</strong>. Toutes les données associées seront perdues.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <DeleteIcon className="w-5 h-5" />
                {isLoading ? "Suppression..." : "Oui, supprimer définitivement"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  )
}

