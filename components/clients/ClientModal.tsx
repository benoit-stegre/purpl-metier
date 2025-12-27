"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CloseIcon,
  SaveIcon,
  BackIcon,
  DeleteIcon,
} from "@/components/ui/Icons";
import { AlertTriangle } from "lucide-react";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";

interface Client {
  id: string;
  raison_sociale: string;
  siret: string | null;
  num_tva: string | null;
  contact_nom: string | null;
  contact_prenom: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
  adresse_ligne1: string | null;
  adresse_ligne2: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  categorie_id: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
}

export function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: ClientModalProps) {
  const isEditMode = !!client;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // État initial du formulaire
  const initialFormData = {
    raison_sociale: "",
    siret: "",
    num_tva: "",
    contact_nom: "",
    contact_prenom: "",
    contact_email: "",
    contact_telephone: "",
    adresse_ligne1: "",
    adresse_ligne2: "",
    ville: "",
    code_postal: "",
    pays: "France",
    categorie_id: null as string | null,
    notes: "",
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Stocker les données originales pour comparaison
  const [originalData, setOriginalData] = useState(initialFormData);

  // Fetch catégories au mount
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories_clients")
        .select("*")
        .order("name");

      if (data) setCategories(data);
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    const emptyData = {
      raison_sociale: "",
      siret: "",
      num_tva: "",
      contact_nom: "",
      contact_prenom: "",
      contact_email: "",
      contact_telephone: "",
      adresse_ligne1: "",
      adresse_ligne2: "",
      ville: "",
      code_postal: "",
      pays: "France",
      categorie_id: null,
      notes: "",
      is_active: true,
    };
    setFormData(emptyData);
    setOriginalData(emptyData);
  };

  // Charger les données en mode édition ou réinitialiser en mode création
  useEffect(() => {
    if (!isOpen) {
      // Modal fermé : réinitialiser après un délai
      setTimeout(() => {
        resetForm();
        setError(null);
        setShowConfirmClose(false);
      }, 200);
      return;
    }

    // Modal ouvert
    if (client) {
      // Mode édition : charger les données du client
      const loadedData = {
        raison_sociale: client.raison_sociale || "",
        siret: client.siret || "",
        num_tva: client.num_tva || "",
        contact_nom: client.contact_nom || "",
        contact_prenom: client.contact_prenom || "",
        contact_email: client.contact_email || "",
        contact_telephone: client.contact_telephone || "",
        adresse_ligne1: client.adresse_ligne1 || "",
        adresse_ligne2: client.adresse_ligne2 || "",
        ville: client.ville || "",
        code_postal: client.code_postal || "",
        pays: client.pays || "France",
        categorie_id: client.categorie_id || null,
        notes: client.notes || "",
        is_active: client.is_active !== undefined && client.is_active !== null ? client.is_active : true,
      };

      setFormData(loadedData);
      setOriginalData(loadedData);
    } else {
      // Mode création : réinitialiser le formulaire
      resetForm();
    }
    setError(null);
    setShowConfirmClose(false);
  }, [isOpen, client]);

  // Vérifier si des CHANGEMENTS ont été faits
  const hasChanges = () => {
    return (
      formData.raison_sociale !== originalData.raison_sociale ||
      formData.siret !== originalData.siret ||
      formData.num_tva !== originalData.num_tva ||
      formData.contact_nom !== originalData.contact_nom ||
      formData.contact_prenom !== originalData.contact_prenom ||
      formData.contact_email !== originalData.contact_email ||
      formData.contact_telephone !== originalData.contact_telephone ||
      formData.adresse_ligne1 !== originalData.adresse_ligne1 ||
      formData.adresse_ligne2 !== originalData.adresse_ligne2 ||
      formData.ville !== originalData.ville ||
      formData.code_postal !== originalData.code_postal ||
      formData.pays !== originalData.pays ||
      formData.categorie_id !== originalData.categorie_id ||
      formData.notes !== originalData.notes ||
      formData.is_active !== originalData.is_active
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

  // Clic sur l'overlay (fond noir)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handler pour enregistrer depuis la popup
  const handleSaveAndClose = async () => {
    setShowConfirmClose(false);

    // Valide le formulaire
    if (!formData.raison_sociale || formData.raison_sociale.length < 2) {
      setError("La raison sociale doit contenir au moins 2 caractères");
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

  // Validation email
  const isValidEmail = (email: string) => {
    if (!email) return true; // Email optionnel
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Fonction commune pour la sauvegarde
  const performSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Validation
      if (!formData.raison_sociale || formData.raison_sociale.length < 2) {
        throw new Error("La raison sociale doit contenir au moins 2 caractères");
      }

      if (formData.contact_email && !isValidEmail(formData.contact_email)) {
        throw new Error("L'email n'est pas au format valide");
      }

      const dataToSave = {
        raison_sociale: formData.raison_sociale,
        siret: formData.siret || null,
        num_tva: formData.num_tva || null,
        contact_nom: formData.contact_nom || null,
        contact_prenom: formData.contact_prenom || null,
        contact_email: formData.contact_email || null,
        contact_telephone: formData.contact_telephone || null,
        adresse_ligne1: formData.adresse_ligne1 || null,
        adresse_ligne2: formData.adresse_ligne2 || null,
        ville: formData.ville || null,
        code_postal: formData.code_postal || null,
        pays: formData.pays || "France",
        categorie_id: formData.categorie_id || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
      };

      if (isEditMode && client) {
        const { error: updateError } = await supabase
          .from("clients_pro")
          .update(dataToSave)
          .eq("id", client.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("clients_pro")
          .insert(dataToSave);

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

  // Suppression définitive
  const handlePermanentDelete = async () => {
    if (!isEditMode || !client) return;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Supprimer définitivement de la base de données
      const { error: deleteError } = await supabase
        .from("clients_pro")
        .delete()
        .eq("id", client.id);

      if (deleteError) throw deleteError;

      // Rafraîchir et fermer
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression définitive");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.raison_sociale || formData.raison_sociale.length < 2) {
      setError("La raison sociale doit contenir au moins 2 caractères");
      return;
    }

    if (formData.contact_email && !isValidEmail(formData.contact_email)) {
      setError("L'email n'est pas au format valide");
      return;
    }

    // Si pas de changements, ne rien faire
    if (!hasChanges()) {
      return;
    }

    // Si des changements et en mode édition, ouvrir le popup
    if (hasChanges() && isEditMode) {
      setShowConfirmClose(true);
      return;
    }

    // Si nouveau (création), sauvegarder directement
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
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purpl-black">
                {isEditMode ? "Modifier le client" : "Nouveau client"}
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section Entreprise */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purpl-black border-b border-gray-200 pb-2">
                  Informations entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Raison sociale * */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Raison sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.raison_sociale}
                      onChange={(e) =>
                        setFormData({ ...formData, raison_sociale: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="Ex: PURPL Solutions"
                    />
                  </div>

                  {/* SIRET */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      SIRET
                    </label>
                    <input
                      type="text"
                      value={formData.siret}
                      onChange={(e) =>
                        setFormData({ ...formData, siret: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="123 456 789 00012"
                    />
                  </div>

                  {/* N° TVA */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      N° TVA
                    </label>
                    <input
                      type="text"
                      value={formData.num_tva}
                      onChange={(e) =>
                        setFormData({ ...formData, num_tva: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="FR12345678901"
                    />
                  </div>
                </div>
              </div>

              {/* Section Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purpl-black border-b border-gray-200 pb-2">
                  Contact
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.contact_prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_prenom: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="Jean"
                    />
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.contact_nom}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_nom: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="Dupont"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_email: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="contact@exemple.fr"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_telephone}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_telephone: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>

              {/* Section Adresse */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purpl-black border-b border-gray-200 pb-2">
                  Adresse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Adresse ligne 1 */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={formData.adresse_ligne1}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse_ligne1: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="123 rue de la République"
                    />
                  </div>

                  {/* Adresse ligne 2 */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Complément
                    </label>
                    <input
                      type="text"
                      value={formData.adresse_ligne2}
                      onChange={(e) =>
                        setFormData({ ...formData, adresse_ligne2: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="Bâtiment A, 2ème étage"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Code postal */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={formData.code_postal}
                      onChange={(e) =>
                        setFormData({ ...formData, code_postal: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="75001"
                    />
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) =>
                        setFormData({ ...formData, ville: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="Paris"
                    />
                  </div>

                  {/* Pays */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Pays
                    </label>
                    <input
                      type="text"
                      value={formData.pays}
                      onChange={(e) =>
                        setFormData({ ...formData, pays: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      placeholder="France"
                    />
                  </div>
                </div>
              </div>

              {/* Section Catégorie */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purpl-black border-b border-gray-200 pb-2">
                  Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Catégorie
                    </label>
                    <select
                      value={formData.categorie_id || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "__manage__") {
                          setShowCategoryManager(true);
                          return;
                        }
                        setFormData({
                          ...formData,
                          categorie_id: value || null,
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                    >
                      <option value="">Aucune catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option disabled>────────────────</option>
                      <option value="__manage__" style={{ color: "#76715A" }}>
                        ⚙ Gérer les catégories...
                      </option>
                    </select>

                    {/* Preview pastille couleur */}
                    {formData.categorie_id && (
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{
                            backgroundColor:
                              categories.find((c) => c.id === formData.categorie_id)
                                ?.color || "#76715A",
                          }}
                        />
                        <span className="text-sm text-gray-600">
                          {categories.find((c) => c.id === formData.categorie_id)?.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-purpl-green mb-2">
                      Notes internes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-purpl-sable rounded-lg focus:outline-none focus:border-purpl-green"
                      rows={3}
                      placeholder="Notes, remarques, historique..."
                    />
                  </div>
                </div>
              </div>

              {/* Archivage (si édition) */}
              {isEditMode && (
                <div className="pt-4 border-t border-purpl-ecru">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={!formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: !e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-2 border-purpl-ecru text-purpl-orange focus:ring-purpl-orange cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-purpl-black group-hover:text-purpl-orange transition-colors">
                        Archiver ce client
                      </span>
                      <p className="text-xs text-purpl-green mt-1">
                        Le client archivé sera masqué des listes par défaut
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
                      Ce client est archivé
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
                      Cette action est irréversible. Le client sera supprimé de manière permanente.
                    </p>
                  </div>
                </div>
              )}

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
                    ? "Modifier le client"
                    : "Créer le client"}
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
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purpl-orange text-white rounded-lg hover:bg-purpl-orange/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? "Enregistrement..." : "Enregistrer et fermer"}
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

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="clients"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
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
              Êtes-vous sûr de vouloir supprimer définitivement ce client ?
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
  );
}
