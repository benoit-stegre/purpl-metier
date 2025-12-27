"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CloseIcon,
  ImageIcon,
  SaveIcon,
  BackIcon,
  DeleteIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { AlertTriangle } from "lucide-react";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { cascadeDepuisComposant } from "@/lib/utils/recalculCascade";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories_composants"]["Row"] & {
  name: string;
};

type Composant = Database["public"]["Tables"]["composants"]["Row"] & {
  categorie: Database["public"]["Tables"]["categories_composants"]["Row"] | null;
};

interface ComposantModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  composant?: Composant | null;
}

export function ComposantModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  composant,
}: ComposantModalProps) {
  // ✅ Stocker le mode dans un state pour éviter les problèmes de props changeantes
  const [isEditMode, setIsEditMode] = useState(!!composant);
  // ✅ Stocker l'ID du composant édité pour garantir qu'il soit disponible lors de la sauvegarde
  const [editingComposantId, setEditingComposantId] = useState<string | null>(composant?.id || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  // État initial du formulaire
  const initialFormData = {
    name: "",
    reference: "",
    categorie_id: null as string | null,
    poids: "",
    largeur: "",
    hauteur: "",
    profondeur: "",
    prix_achat: "",
    marge_pourcent: "30",
    notes: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ✅ Stocker les données originales pour comparaison
  const [originalData, setOriginalData] = useState(initialFormData);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  // ✅ Charger les données en mode édition OU reset en mode création
  // IMPORTANT: Ce useEffect ne doit s'exécuter qu'une seule fois quand isOpen passe de false à true
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [lastComposantId, setLastComposantId] = useState<string | null>(null);

  useEffect(() => {
    // Reset le flag quand le modal est fermé
    if (!isOpen) {
      setHasLoadedData(false);
      setIsEditMode(false); // Reset le mode aussi
      setEditingComposantId(null); // Reset l'ID aussi
      setLastComposantId(null);
      return;
    }

    // Utiliser l'ID pour détecter si c'est un nouveau composant
    const currentComposantId = composant?.id || null;
    
    // Si c'est le même composant et qu'on a déjà chargé les données, ne rien faire
    if (hasLoadedData && lastComposantId === currentComposantId) {
      return;
    }

    // Marquer comme chargé et stocker l'ID
    setHasLoadedData(true);
    setLastComposantId(currentComposantId);

    // Modal ouvert - charger les données ET définir le mode
    if (composant) {
      setIsEditMode(true); // ✅ Mode édition
      setEditingComposantId(composant.id); // ✅ Stocker l'ID pour la sauvegarde
      // Mode édition : charger les données du composant
      const loadedData = {
        name: composant.name || "",
        reference: composant.reference || "",
        categorie_id: composant.categorie_id || null,
        poids: composant.poids?.toString() || "",
        largeur: composant.largeur?.toString() || "",
        hauteur: composant.hauteur?.toString() || "",
        profondeur: composant.profondeur?.toString() || "",
        prix_achat: composant.prix_achat?.toString() || "",
        marge_pourcent: composant.marge_pourcent?.toString() || "30",
        notes: composant.notes || "",
      };

      setFormData(loadedData);
      setOriginalData(loadedData);

      if (composant.photo_url) {
        setPhotoPreview(composant.photo_url);
        setOriginalPhotoUrl(composant.photo_url);
      } else {
        setPhotoPreview(null);
        setOriginalPhotoUrl(null);
      }
      setPhotoFile(null);
    } else {
      setIsEditMode(false); // ✅ Mode création
      setEditingComposantId(null); // ✅ Pas d'ID en création
      // Mode création : reset le formulaire
      setFormData(initialFormData);
      setOriginalData(initialFormData);
      setPhotoPreview(null);
      setOriginalPhotoUrl(null);
      setPhotoFile(null);
    }
    setError(null);
    setShowConfirmClose(false);
  }, [isOpen, composant?.id]);

  // Mettre à jour localCategories quand categories change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Fetch catégories pour rafraîchir (sans fermer la modal)
  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories_composants")
        .select("*")
        .order("name");

      if (data) {
        setLocalCategories(data);
        // Ne pas appeler onSuccess() ici car cela fermerait la modal
      }
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  // ✅ Vérifier si des CHANGEMENTS ont été faits
  const hasChanges = () => {
    // Nouvelle photo uploadée
    if (photoFile !== null) return true;

    // Photo supprimée (était présente, plus maintenant)
    if (originalPhotoUrl && !photoPreview) return true;

    // Comparer chaque champ du formulaire
    const formChanged =
      formData.name !== originalData.name ||
      formData.reference !== originalData.reference ||
      formData.categorie_id !== originalData.categorie_id ||
      formData.poids !== originalData.poids ||
      formData.largeur !== originalData.largeur ||
      formData.hauteur !== originalData.hauteur ||
      formData.profondeur !== originalData.profondeur ||
      formData.prix_achat !== originalData.prix_achat ||
      formData.marge_pourcent !== originalData.marge_pourcent ||
      formData.notes !== originalData.notes;

    return formChanged;
  };

  // Handler fermeture avec confirmation SI changements
  const handleClose = () => {
    if (hasChanges() && !showConfirmClose) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // ✅ Clic sur l'overlay (fond noir)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si on clique directement sur l'overlay (pas sur le contenu)
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ✅ Handler pour enregistrer depuis la popup
  const handleSaveAndClose = async () => {
    setShowConfirmClose(false);

    // Valide le formulaire
    if (!formData.name || !formData.prix_achat || !formData.marge_pourcent) {
      setError(
        "Veuillez remplir tous les champs obligatoires (Nom, Prix achat, Marge)"
      );
      return;
    }

    try {
      await performSave();
    } catch (err) {
      setShowConfirmClose(false); // Revenir au formulaire pour voir l'erreur
    }
  };

  // Confirmation abandon
  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  // Annuler la confirmation
  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  // Calcul prix vente en temps réel
  const prixVente =
    formData.prix_achat && formData.marge_pourcent
      ? (
          parseFloat(formData.prix_achat) *
          (1 + parseFloat(formData.marge_pourcent) / 100)
        ).toFixed(2)
      : "0.00";

  // Fonction commune pour la sauvegarde
  const performSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let photo_url: string | null = composant?.photo_url || null;

      // Upload nouvelle photo si fichier sélectionné
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("composants-photos")
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("composants-photos").getPublicUrl(fileName);

        photo_url = publicUrl;

        // Supprimer ancienne photo si existe
        if (composant?.photo_url) {
          const oldFileName = composant.photo_url.split("/").pop();
          if (oldFileName) {
            await supabase.storage
              .from("composants-photos")
              .remove([oldFileName]);
          }
        }
      }

      const dataToSave = {
        name: formData.name,
        reference: formData.reference || null,
        categorie_id: formData.categorie_id || null,
        photo_url,
        poids: formData.poids ? parseFloat(formData.poids) : null,
        largeur: formData.largeur ? parseFloat(formData.largeur) : null,
        hauteur: formData.hauteur ? parseFloat(formData.hauteur) : null,
        profondeur: formData.profondeur ? parseFloat(formData.profondeur) : null,
        prix_achat: parseFloat(formData.prix_achat),
        marge_pourcent: parseFloat(formData.marge_pourcent),
        notes: formData.notes || null,
      };

      if (isEditMode && editingComposantId) {
        // Mode édition : UPDATE avec l'ID stocké
        const { error: updateError } = await supabase
          .from("composants")
          .update(dataToSave)
          .eq("id", editingComposantId);

        if (updateError) throw updateError;

        // Recalcul cascade si prix_achat ou marge a changé
        if (
          formData.prix_achat !== originalData.prix_achat ||
          formData.marge_pourcent !== originalData.marge_pourcent
        ) {
          // Appel asynchrone sans bloquer la sauvegarde principale
          cascadeDepuisComposant(editingComposantId).catch((err) =>
            console.error("Erreur recalcul cascade:", err)
          );
        }
      } else {
        // Mode création : INSERT
        const { error: insertError } = await supabase
          .from("composants")
          .insert(dataToSave);

        if (insertError) throw insertError;
        // Nouveau composant : pas de cascade car pas encore utilisé dans des produits
      }

      // Attendre que onSuccess soit terminé avant de fermer
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `Erreur lors de ${isEditMode ? "la modification" : "la création"}`
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.prix_achat || !formData.marge_pourcent) {
      setError('Veuillez remplir tous les champs obligatoires (Nom, Prix achat, Marge)');
      return;
    }
    
    // Si pas de changements en mode édition, fermer directement
    if (isEditMode && !hasChanges()) {
      onClose();
      return;
    }
    
    // Sauvegarder directement (création ou édition)
    await performSave();
  };

  // Suppression définitive
  const handlePermanentDelete = async () => {
    if (!isEditMode || !editingComposantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Supprimer la photo si elle existe
      if (composant?.photo_url) {
        const oldFileName = composant.photo_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage
            .from("composants-photos")
            .remove([oldFileName]);
        }
      }

      // Supprimer définitivement de la base de données
      const { error: deleteError } = await supabase
        .from("composants")
        .delete()
        .eq("id", editingComposantId);

      if (deleteError) throw deleteError;

      // Rafraîchir et fermer
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression définitive");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Modal principal - ✅ Ajout onClick sur overlay */}
      <div
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purpl-black">
                {isEditMode ? "Modifier le composant" : "Nouveau composant"}
              </h2>
              <button
                onClick={handleClose}
                className="text-purpl-green hover:text-purpl-orange transition-colors"
                type="button"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Photo du composant
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purpl-ecru rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : composant?.photo_url ? (
                      <img
                        src={composant.photo_url}
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

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Nom du composant *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  placeholder="Ex: Vis inox M8x40"
                />
              </div>

              {/* Reference + Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Référence
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                    placeholder="Ex: QUI-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Catégorie
                  </label>
                  
                  {/* Select catégorie */}
                  <select
                    value={formData.categorie_id || ""}
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
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  >
                    <option value="">Aucune catégorie</option>
                    
                    {localCategories.map((cat) => (
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
                            localCategories.find((c) => c.id === formData.categorie_id)
                              ?.color || "#76715A",
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {
                          localCategories.find((c) => c.id === formData.categorie_id)
                            ?.name || ""
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Modal gestion catégories */}
                {showCategoryManager && (
                  <CategoryManagerModal
                    type="composants"
                    onClose={() => setShowCategoryManager(false)}
                    onUpdate={fetchCategories}
                  />
                )}
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Poids
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.poids}
                    onChange={(e) => setFormData({ ...formData, poids: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Largeur (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.largeur}
                    onChange={(e) => setFormData({ ...formData, largeur: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Hauteur (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hauteur}
                    onChange={(e) => setFormData({ ...formData, hauteur: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Profondeur (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.profondeur}
                    onChange={(e) => setFormData({ ...formData, profondeur: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
              </div>

              {/* Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Prix achat (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.prix_achat}
                    onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Marge (%) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.marge_pourcent}
                    onChange={(e) => setFormData({ ...formData, marge_pourcent: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purpl-green mb-2">
                    Prix vente (€)
                  </label>
                  <div className="w-full px-4 py-2 bg-purpl-ecru rounded-lg font-bold text-purpl-orange text-lg">
                    {prixVente} €
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  placeholder="Notes internes..."
                />
              </div>

              {/* Bouton Supprimer définitivement - Uniquement en mode édition */}
              {isEditMode && (
                <div className="pt-4 border-t border-red-200">
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
                    Cette action est irréversible. Le composant sera supprimé de manière permanente.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2 border-2 border-purpl-sable rounded-lg hover:bg-purpl-ecru transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors disabled:opacity-50"
                >
                  {isLoading
                    ? isEditMode
                      ? "Modification..."
                      : "Création..."
                    : isEditMode
                      ? "Modifier le composant"
                      : "Créer le composant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de confirmation - 3 boutons */}
      {showConfirmClose && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelClose();
            }
          }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-xl font-bold text-purpl-black mb-4">
              {isEditMode ? "Modifications non enregistrées" : "Création en cours"}
            </h3>
            <p className="text-purpl-green mb-6">
              Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
            </p>

            <div className="flex flex-col gap-3">
              {/* Bouton Enregistrer (principal) */}
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? "Enregistrement..." : "Enregistrer et fermer"}
              </button>

              {/* Bouton Annuler (retour édition) */}
              <button
                type="button"
                onClick={handleCancelClose}
                className="w-full px-6 py-3 border-2 border-purpl-green text-purpl-green rounded-lg hover:bg-purpl-ecru transition-colors font-medium flex items-center justify-center gap-2"
              >
                <BackIcon className="w-5 h-5" />
                Continuer l'édition
              </button>

              {/* Bouton Abandonner (sans sauvegarder) */}
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
              ⚠️ Attention : Suppression définitive
            </h3>
            <p className="text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer définitivement ce composant ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <span className="text-red-600 font-semibold">Cette action est irréversible.</span> Toutes les données associées seront perdues.
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
  );
}

