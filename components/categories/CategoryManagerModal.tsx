'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { CloseIcon, PlusIcon, DeleteIcon, EditIcon, SaveIcon } from '@/components/ui/Icons'
import { PURPL_COLORS, DEFAULT_COLORS } from '@/lib/constants/colors'

interface CategoryManagerModalProps {
  type: 'composants' | 'produits' | 'clients' | 'projets'
  onClose: () => void
  onUpdate: () => void  // Callback pour rafraîchir le select parent
}

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
}

export default function CategoryManagerModal({ type, onClose, onUpdate }: CategoryManagerModalProps) {
  const supabase = createClient()
  
  // Couleur par défaut selon le type - DÉFINIE AVANT les useState
  const getDefaultColor = () => {
    return DEFAULT_COLORS[type]
  }
  
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ name: '', color: getDefaultColor() })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; name: string }>({
    open: false,
    id: null,
    name: ''
  })

  const tableName = `categories_${type}`
  const titles = {
    composants: 'Catégories de Composants',
    produits: 'Catégories de Produits',
    clients: 'Catégories de Clients',
    projets: 'Catégories de Projets'
  }

  useEffect(() => {
    // Désactiver les demandes de permission notifications système
    if ('Notification' in window && Notification.permission === 'default') {
      // Ne rien faire, ne pas demander la permission
    }
    
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      console.log('🔄 fetchCategories - Début')
      console.log('📋 tableName:', tableName)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('name')
      
      console.log('📤 Fetch response - data:', data)
      console.log('📤 Fetch response - error:', error)
      
      if (error) {
        console.error('❌ Erreur fetch:', error)
        throw error
      }
      
      if (data) {
        console.log('✅ Catégories récupérées:', data.length)
        setCategories(data)
      }
    } catch (error) {
      console.error('❌ Erreur fetch catégories complète:', error)
    }
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire')
      return
    }

    const slug = generateSlug(formData.name)
    const dataToSave = {
      name: formData.name.trim(),
      slug: slug,
      color: formData.color || getDefaultColor()
    }

    console.log('🔵 handleSave - Début')
    console.log('📝 dataToSave:', dataToSave)
    console.log('🆔 editingId:', editingId)
    console.log('📋 tableName:', tableName)

    try {
      if (editingId) {
        // Modification
        console.log('✏️ Mode ÉDITION')
        const { data, error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq('id', editingId)
          .select()
        
        console.log('📤 Update response - data:', data)
        console.log('📤 Update response - error:', error)
        
        if (error) {
          console.error('❌ Erreur update:', error)
          throw error
        }
        
        console.log('✅ Catégorie modifiée avec succès')
        toast.success('Catégorie modifiée')
      } else {
        // Création
        console.log('➕ Mode CRÉATION')
        const { data, error } = await supabase
          .from(tableName)
          .insert([dataToSave])
          .select()
        
        console.log('📤 Insert response - data:', data)
        console.log('📤 Insert response - error:', error)
        
        if (error) {
          console.error('❌ Erreur insert:', error)
          throw error
        }
        
        console.log('✅ Catégorie créée avec succès')
        toast.success('Catégorie créée')
      }

      setFormData({ name: '', color: getDefaultColor() })
      setEditingId(null)
      setIsAdding(false)
      await fetchCategories()
      onUpdate() // Rafraîchir le select parent
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde complète:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (cat: Category) => {
    console.log('✏️ handleEdit - Catégorie:', cat)
    setEditingId(cat.id)
    setFormData({ 
      name: cat.name, 
      color: cat.color || getDefaultColor() 
    })
    setIsAdding(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', deleteConfirm.id)
      
      if (error) throw error
      
      toast.success('Catégorie supprimée')
      await fetchCategories()
      onUpdate() // Rafraîchir le select parent
      setDeleteConfirm({ open: false, id: null, name: '' })
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', color: getDefaultColor() })
    setEditingId(null)
    setIsAdding(false)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purpl-black">{titles[type]}</h2>
              <button
                onClick={onClose}
                className="text-purpl-green hover:text-purpl-orange transition-colors"
                type="button"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Liste catégories */}
              <div className="space-y-2 mb-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    editingId === cat.id 
                      ? 'bg-purpl-green/5 border-purpl-green' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {editingId === cat.id ? (
                    // Mode édition - Layout horizontal compact
                    <div className="flex items-center gap-3 flex-1">
                      {/* Input nom */}
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="flex-1 px-3 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                        autoFocus
                      />
                      
                      {/* Sélecteur couleurs PURPL - Toutes les 8 couleurs en grille 4×2 */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 font-medium">Couleur:</label>
                        <div className="flex gap-1 flex-wrap max-w-[180px]">
                          {PURPL_COLORS.map((purplColor) => (
                            <button
                              key={purplColor.hex}
                              type="button"
                              onClick={() => setFormData({ ...formData, color: purplColor.hex })}
                              className={`w-8 h-8 rounded-lg border-2 transition-all flex-shrink-0 ${
                                formData.color === purplColor.hex
                                  ? 'border-gray-900 scale-110 shadow-lg'
                                  : 'border-gray-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: purplColor.hex }}
                              title={purplColor.name}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Boutons actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSave}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Enregistrer"
                        >
                          <SaveIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Annuler"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: cat.color || getDefaultColor() }}
                        />
                        <span className="font-medium text-purpl-black">{cat.name}</span>
                        <span className="text-sm text-gray-500">/{cat.slug}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-purpl-green hover:bg-purpl-green/10 rounded transition-colors"
                          title="Éditer"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ open: true, id: cat.id, name: cat.name })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Formulaire ajout */}
            {isAdding && (
              <div className="p-4 border-2 border-dashed border-purpl-green/30 rounded-md bg-purpl-ecru">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nom de la catégorie"
                      className="flex-1 px-3 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-purpl-green text-white rounded-md hover:bg-opacity-90 transition-colors"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border-2 border-purpl-sable rounded-lg hover:bg-purpl-ecru transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                  
                  {/* Sélecteur couleurs PURPL */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-purpl-green">Couleur</label>
                    <div className="flex gap-2 flex-wrap">
                      {PURPL_COLORS.map((purplColor) => (
                        <button
                          key={purplColor.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: purplColor.hex })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            formData.color === purplColor.hex
                              ? 'border-gray-900 scale-110 shadow-lg'
                              : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: purplColor.hex }}
                          title={purplColor.name}
                        />
                      ))}
                    </div>
                    
                    {/* Afficher le nom de la couleur sélectionnée */}
                    <span className="text-xs text-gray-500">
                      {PURPL_COLORS.find(c => c.hex === formData.color)?.name || 'Couleur personnalisée'}
                    </span>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t">
              <button
                onClick={() => setIsAdding(true)}
                disabled={isAdding || editingId !== null}
                className="flex items-center gap-2 px-6 py-3 bg-purpl-green text-white rounded-lg hover:bg-purpl-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                type="button"
              >
                <PlusIcon className="w-5 h-5" />
                Nouvelle catégorie
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-purpl-sable rounded-lg hover:bg-purpl-ecru transition-colors font-medium"
                type="button"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup confirmation suppression */}
      {deleteConfirm.open && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4"
          onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        >
          <div 
            className="bg-white rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-purpl-black mb-4">Confirmer la suppression</h3>
            <p className="text-purpl-green mb-6">
              Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-purpl-black">{deleteConfirm.name}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
                className="px-6 py-3 border-2 border-purpl-sable rounded-lg hover:bg-purpl-ecru transition-colors font-medium"
                type="button"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                type="button"
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

