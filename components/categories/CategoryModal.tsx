"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CloseIcon,
  SaveIcon,
  BackIcon,
  DeleteIcon,
} from "@/components/ui/Icons";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type CategoryType = "composants" | "produits" | "clients";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: Category | null;
  type: CategoryType;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  type,
}: CategoryModalProps) {
  const isEditMode = !!category;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Couleurs par défaut selon le type
  const defaultColors = {
    composants: "#76715A",
    produits: "#ED693A",
    clients: "#76715A",
  };

  // État initial du formulaire
  const initialFormData = {
    name: "",
    slug: "",
    color: defaultColors[type],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [originalData, setOriginalData] = useState(initialFormData);

  // Génération automatique du slug
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever accents
      .replace(/[^a-z0-9]+/g, "-") // Remplacer espaces par -
      .replace(/^-+|-+$/g, ""); // Trim -
  };

  // Charger les données en mode édition
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData(initialFormData);
        setOriginalData(initialFormData);
        setError(null);
        setShowConfirmClose(false);
      }, 200);
      return;
    }

    if (category) {
      // Mode édition : charger les données
      const loadedData = {
        name: category.name || "",
        slug: category.slug || "",
        color: category.color || defaultColors[type],
      };
      setFormData(loadedData);
      setOriginalData(loadedData);
    } else {
      // Mode création : réinitialiser
      const newData = {
        name: "",
        slug: "",
        color: defaultColors[type],
      };
      setFormData(newData);
      setOriginalData(newData);
    }
    setError(null);
    setShowConfirmClose(false);
  }, [isOpen, category, type]);

  // Vérifier si des changements ont été faits
  const hasChanges = () => {
    return (
      formData.name !== originalData.name ||
      formData.slug !== originalData.slug ||
      formData.color !== originalData.color
    );
  };

  // Handler fermeture avec confirmation SI changements
  const handleClose = () => {
    if (hasChanges() && !showConfirmClose) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // Clic sur l'overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handler pour enregistrer depuis la popup
  const handleSaveAndClose = async () => {
    setShowConfirmClose(false);
    if (!formData.name || formData.name.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères");
      return;
    }
    try {
      await performSave();
    } catch (err) {
      setShowConfirmClose(false);
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

  // Fonction commune pour la sauvegarde
  const performSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Validation
      if (!formData.name || formData.name.length < 2) {
        throw new Error("Le nom doit contenir au moins 2 caractères");
      }

      if (!formData.slug) {
        throw new Error("Le slug est obligatoire");
      }

      const dataToSave = {
        name: formData.name,
        slug: formData.slug,
        color: formData.color || defaultColors[type],
      };

      const tableName = `categories_${type}`;

      if (isEditMode && category) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq("id", category.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert([dataToSave]);

        if (insertError) throw insertError;
      }

      onSuccess();
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

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères");
      return;
    }

    if (!formData.slug) {
      setError("Le slug est obligatoire");
      return;
    }

    if (!hasChanges()) {
      return;
    }

    if (hasChanges() && isEditMode) {
      setShowConfirmClose(true);
      return;
    }

    await performSave();
  };

  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Modal principal */}
      <div
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purpl-black">
                {isEditMode ? "Modifier la catégorie" : "Nouvelle catégorie"}
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
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({
                      ...formData,
                      name: newName,
                      slug: generateSlug(newName), // Auto-générer slug
                    });
                  }}
                  className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  placeholder="Ex: Vis et boulons"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                  placeholder="vis-et-boulons"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL-friendly identifier (modifiable)
                </p>
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Couleur
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer border-2 border-purpl-sable"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                    placeholder="#76715A"
                  />
                </div>
              </div>

              {/* Preview couleur */}
              <div>
                <label className="block text-sm font-medium text-purpl-green mb-2">
                  Preview
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{formData.name || "Nom"}</p>
                    <p className="text-gray-500">/{formData.slug || "slug"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-purpl-ecru">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border-2 border-purpl-sable rounded-lg hover:bg-purpl-ecru transition-colors flex items-center gap-2"
                >
                  <BackIcon className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-6 py-2 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <SaveIcon className="w-4 h-4" />
                  {isLoading
                    ? isEditMode
                      ? "Modification..."
                      : "Création..."
                    : isEditMode
                    ? "Modifier"
                    : "Créer"}
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
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-purpl-black mb-4">
              {isEditMode
                ? "Modifications non enregistrées"
                : "Création en cours"}
            </h3>
            <p className="text-purpl-green mb-6">
              Vous avez des modifications non enregistrées. Que souhaitez-vous
              faire ?
            </p>

            <div className="flex flex-col gap-3">
              {/* Bouton Enregistrer */}
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? "Enregistrement..." : "Enregistrer et fermer"}
              </button>

              {/* Bouton Continuer */}
              <button
                type="button"
                onClick={handleCancelClose}
                className="w-full px-6 py-3 border-2 border-purpl-green text-purpl-green rounded-lg hover:bg-purpl-ecru transition-colors font-medium flex items-center justify-center gap-2"
              >
                <BackIcon className="w-5 h-5" />
                Continuer l'édition
              </button>

              {/* Bouton Abandonner */}
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
    </Fragment>
  );
}



