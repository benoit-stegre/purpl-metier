"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import {
  CloseIcon,
  ImageIcon,
  SaveIcon,
  BackIcon,
  DeleteIcon,
  SearchIcon,
  PlusIcon,
  ToolIcon,
} from "@/components/ui/Icons";
import { AlertTriangle, Check, Lock } from "lucide-react";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
  description: string | null;
  client_id: string | null;
  statut: "brouillon" | "en_cours" | "termine" | "annule";
  date_debut: string | null;
  date_fin: string | null;
  budget: number | null;
  photo_url: string | null;
  categorie_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Client {
  id: string;
  name: string;
  is_active: boolean;
}

type Produit = {
  id: string;
  name: string;
  reference: string | null;
  prix_vente_total: number | null;
  photo_url: string | null;
  is_active: boolean;
};

type SelectedProduit = {
  produit_id: string;
  quantite: number;
  prix_unitaire_fige?: number | null; // Prix figé ou null = dynamique
  produit: Produit; // Pour afficher les infos
};

interface ProjetModalProps {
  mode: "create" | "edit";
  projet?: Projet;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon", color: "#6B7280" },
  { value: "en_cours", label: "En cours", color: "#3B82F6" },
  { value: "termine", label: "Terminé", color: "#10B981" },
  { value: "annule", label: "Annulé", color: "#EF4444" },
];

export function ProjetModal({
  mode,
  projet,
  onClose,
  onSuccess,
}: ProjetModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    reference: "",
    description: "",
    client_id: null as string | null,
    statut: "brouillon" as "brouillon" | "en_cours" | "termine" | "annule",
    date_debut: "",
    date_fin: "",
    budget: "",
    categorie_id: null as string | null,
  });

  const [originalData, setOriginalData] = useState(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  
  // State pour produits sélectionnés
  const [selectedProduits, setSelectedProduits] = useState<SelectedProduit[]>([]);
  const [originalSelectedProduits, setOriginalSelectedProduits] = useState<SelectedProduit[]>([]);
  
  // State pour le sélecteur
  const [showProduitSelector, setShowProduitSelector] = useState(false);
  const [produitSearch, setProduitSearch] = useState("");
  const [availableProduits, setAvailableProduits] = useState<Produit[]>([]);

  // Charger catégories, clients et produits au mount
  useEffect(() => {
    loadCategories();
    loadClients();
    loadProduits();
  }, []);

  // Charger les données du projet en mode édition
  useEffect(() => {
    if (mode === "edit" && projet) {
      const loadedData = {
        nom: projet.nom || "",
        reference: projet.reference || "",
        description: projet.description || "",
        client_id: projet.client_id || null,
        statut: projet.statut || "brouillon",
        date_debut: projet.date_debut
          ? new Date(projet.date_debut).toISOString().split("T")[0]
          : "",
        date_fin: projet.date_fin
          ? new Date(projet.date_fin).toISOString().split("T")[0]
          : "",
        budget: projet.budget?.toString() || "",
        categorie_id: projet.categorie_id || null,
      };

      setFormData(loadedData);
      setOriginalData(loadedData);

      if (projet.photo_url) {
        setPhotoPreview(projet.photo_url);
        setOriginalPhotoUrl(projet.photo_url);
      } else {
        setPhotoPreview(null);
        setOriginalPhotoUrl(null);
      }
      
      // Charger produits existants du projet
      if (projet.id) {
        loadProjetProduits(projet.id);
      }
    } else {
      resetForm();
      setSelectedProduits([]);
      setOriginalSelectedProduits([]);
    }
  }, [mode, projet]);

  const loadCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories_projets")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Erreur chargement catégories:", error);
      toast.error("Erreur lors du chargement des catégories");
    }
  };

  const loadClients = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients_pro")
        .select("id, raison_sociale, is_active")
        .order("raison_sociale");

      if (error) throw error;
      if (data) {
        // Transformer raison_sociale en name pour compatibilité avec l'interface
        setClients(data.map(client => ({
          id: client.id,
          name: client.raison_sociale,
        })));
      }
    } catch (error) {
      console.error("Erreur chargement clients:", error);
      toast.error("Erreur lors du chargement des clients");
    }
  };

  const loadProduits = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("produits")
        .select("id, name, reference, prix_vente_total, photo_url")
        .order("name");

      if (error) throw error;
      if (data) setAvailableProduits(data);
    } catch (error) {
      console.error("Erreur chargement produits:", error);
      toast.error("Erreur lors du chargement des produits");
    }
  };

  const loadProjetProduits = async (projetId: string) => {
    try {
      const supabase = createClient();
      
      // Charger les produits disponibles si pas encore chargés
      let produits = availableProduits;
      if (produits.length === 0) {
        const { data: produitsData } = await supabase
          .from("produits")
          .select("id, name, reference, prix_vente_total, photo_url")
          .order("name");
        produits = produitsData || [];
        setAvailableProduits(produits);
      }
      
      const { data, error } = await supabase
        .from("projets_produits")
        .select(`
          id,
          quantite,
          prix_unitaire_fige,
          produit:produits (
            id,
            name,
            reference,
            prix_vente_total,
            photo_url
          )
        `)
        .eq("projet_id", projetId);

      if (error) throw error;
      
      if (data) {
        const loadedProduits: SelectedProduit[] = data
          .map((pp: any) => {
            const produit = produits.find((p) => p.id === pp.produit?.id);
            if (!produit || !pp.produit) return null;

            return {
              produit_id: produit.id,
              quantite: pp.quantite,
              prix_unitaire_fige: pp.prix_unitaire_fige ?? null,
              produit,
            } as SelectedProduit;
          })
          .filter((sp): sp is SelectedProduit => sp !== null);

        setSelectedProduits(loadedProduits);
        setOriginalSelectedProduits(JSON.parse(JSON.stringify(loadedProduits))); // Deep copy
      }
    } catch (error) {
      console.error("Erreur chargement produits projet:", error);
      toast.error("Erreur lors du chargement des produits du projet");
    }
  };

  // ✅ Vérifier si des CHANGEMENTS ont été faits
  const hasChanges = () => {
    // Nouvelle photo uploadée
    if (photoFile !== null) return true;
    // Photo supprimée
    if (originalPhotoUrl && !photoPreview) return true;
    // Comparer les produits sélectionnés
    if (JSON.stringify(selectedProduits.map(sp => ({ id: sp.produit_id, q: sp.quantite }))) !== 
        JSON.stringify(originalSelectedProduits.map(sp => ({ id: sp.produit_id, q: sp.quantite })))) {
      return true;
    }
    // Comparer chaque champ du formulaire
    return (
      formData.nom !== originalData.nom ||
      formData.reference !== originalData.reference ||
      formData.description !== originalData.description ||
      formData.client_id !== originalData.client_id ||
      formData.statut !== originalData.statut ||
      formData.date_debut !== originalData.date_debut ||
      formData.date_fin !== originalData.date_fin ||
      formData.budget !== originalData.budget ||
      formData.categorie_id !== originalData.categorie_id
    );
  };

  // ✅ Handler fermeture avec confirmation SI changements
  const handleClose = () => {
    if (hasChanges() && !showConfirmClose) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  // ✅ Clic sur l'overlay (fond noir)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ✅ Confirmation abandon
  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  // ✅ Annuler la confirmation
  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  // ✅ Sauvegarder et fermer depuis popup
  const handleSaveAndClose = async () => {
    setShowConfirmClose(false);
    // Déclencher la sauvegarde
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent);
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("projets-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("projets-photos").getPublicUrl(fileName);

      setPhotoPreview(publicUrl);
      setPhotoFile(file);
      toast.success("Photo uploadée avec succès");
    } catch (error: any) {
      console.error("Erreur upload photo:", error);
      toast.error(error.message || "Erreur lors de l'upload de la photo");
    }
  };

  const handlePhotoDelete = async () => {
    try {
      if (originalPhotoUrl) {
        const supabase = createClient();
        const fileName = originalPhotoUrl.split("/").pop();
        if (fileName) {
          await supabase.storage
            .from("projets-photos")
            .remove([fileName]);
        }
      }

      setPhotoPreview(null);
      setPhotoFile(null);
      setOriginalPhotoUrl(null);
      toast.success("Photo supprimée");
    } catch (error: any) {
      console.error("Erreur suppression photo:", error);
      toast.error("Erreur lors de la suppression de la photo");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nom requis
    if (!formData.nom.trim()) {
      newErrors.nom = "Remplir le champ « Nom » pour valider";
    }

    // Client requis (NOT NULL en BDD)
    if (!formData.client_id) {
      newErrors.client_id = "Sélectionner un « Client » pour valider";
    }

    // Budget doit être un nombre si rempli
    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = "Le budget doit être un nombre valide";
    }

    // Date fin >= date début si les deux sont renseignées
    if (formData.date_debut && formData.date_fin) {
      const dateDebut = new Date(formData.date_debut);
      const dateFin = new Date(formData.date_fin);
      if (dateFin < dateDebut) {
        newErrors.date_fin = "La date de fin doit être postérieure à la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    const emptyData = {
      nom: "",
      reference: "",
      description: "",
      client_id: null as string | null,
      statut: "brouillon" as "brouillon" | "en_cours" | "termine" | "annule",
      date_debut: "",
      date_fin: "",
      budget: "",
      categorie_id: null as string | null,
    };
    setFormData(emptyData);
    setOriginalData(emptyData);
    setPhotoPreview(null);
    setPhotoFile(null);
    setOriginalPhotoUrl(null);
    setSelectedProduits([]);
    setOriginalSelectedProduits([]);
    setShowProduitSelector(false);
    setProduitSearch("");
    setErrors({});
  };

  // Handlers pour gérer les produits
  const handleAddProduit = (produit: Produit) => {
    // Vérifier si déjà ajouté
    const exists = selectedProduits.find((sp) => sp.produit_id === produit.id);
    if (exists) {
      // Incrémenter la quantité
      setSelectedProduits((prev) =>
        prev.map((sp) =>
          sp.produit_id === produit.id
            ? { ...sp, quantite: sp.quantite + 1 }
            : sp
        )
      );
    } else {
      // Ajouter nouveau
      setSelectedProduits((prev) => [
        ...prev,
        {
          produit_id: produit.id,
          quantite: 1,
          produit,
        },
      ]);
    }
    setProduitSearch("");
  };

  const handleUpdateQuantite = (produitId: string, newQuantite: number) => {
    if (newQuantite < 1) {
      handleRemoveProduit(produitId);
      return;
    }

    setSelectedProduits((prev) =>
      prev.map((sp) =>
        sp.produit_id === produitId ? { ...sp, quantite: newQuantite } : sp
      )
    );
  };

  const handleRemoveProduit = (produitId: string) => {
    setSelectedProduits((prev) =>
      prev.filter((sp) => sp.produit_id !== produitId)
    );
  };

  // Calcul total HT projet (utilise le prix figé si disponible, sinon le prix dynamique)
  const totalHT = selectedProduits.reduce((total, sp) => {
    const prixUnitaire = sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0;
    return total + (prixUnitaire * sp.quantite);
  }, 0);

  // Filtrage produits pour le sélecteur
  const filteredProduits = availableProduits.filter(
    (prod) =>
      produitSearch === "" ||
      prod.name.toLowerCase().includes(produitSearch.toLowerCase()) ||
      (prod.reference &&
        prod.reference.toLowerCase().includes(produitSearch.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Upload photo si nouveau fichier
      let photo_url: string | null = originalPhotoUrl || null;
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("projets-photos")
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("projets-photos").getPublicUrl(fileName);

        photo_url = publicUrl;

        // Supprimer ancienne photo si existe
        if (originalPhotoUrl && mode === "edit") {
          const oldFileName = originalPhotoUrl.split("/").pop();
          if (oldFileName) {
            await supabase.storage
              .from("projets-photos")
              .remove([oldFileName]);
          }
        }
      }

      const dataToSave = {
        nom: formData.nom.trim(),
        reference: formData.reference.trim() || null,
        description: formData.description.trim() || null,
        client_id: formData.client_id || null,
        statut: formData.statut,
        date_debut: formData.date_debut || null,
        date_fin: formData.date_fin || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        categorie_id: formData.categorie_id || null,
        photo_url,
      };

      let projetId: string;

      if (mode === "edit" && projet) {
        const { error } = await supabase
          .from("projets")
          .update(dataToSave)
          .eq("id", projet.id);

        if (error) throw error;
        projetId = projet.id;
        toast.success("Projet modifié avec succès");
      } else {
        const { data: insertData, error } = await supabase
          .from("projets")
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        if (!insertData) throw new Error("Projet créé mais ID non retourné");
        projetId = insertData.id;
        toast.success("Projet créé avec succès");
      }

      // Gérer les produits du projet
      if (mode === "edit" && projet) {
        // Supprimer anciens produits
        const { error: deleteError } = await supabase
          .from("projets_produits")
          .delete()
          .eq("projet_id", projetId);

        if (deleteError) throw deleteError;
      }

      // Insérer nouveaux produits avec gestion du prix figé
      if (selectedProduits.length > 0) {
        // Déterminer si on doit figer les prix :
        // - "brouillon" → prix dynamiques (null)
        // - Autres statuts → prix figés
        const doitFigerPrix = formData.statut !== "brouillon";

        const produitsToInsert = selectedProduits.map((sp) => ({
          projet_id: projetId,
          produit_id: sp.produit_id,
          quantite: sp.quantite,
          // Si statut != brouillon : figer le prix (garder l'existant si déjà figé, sinon prendre le prix actuel)
          // Si statut == brouillon : mettre null (prix dynamique)
          prix_unitaire_fige: doitFigerPrix 
            ? (sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0)
            : null,
        }));

        const { error: insertProduitsError } = await supabase
          .from("projets_produits")
          .insert(produitsToInsert);

        if (insertProduitsError) throw insertProduitsError;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("❌ Erreur sauvegarde projet:", error);
      console.error("❌ Type erreur:", typeof error);
      console.error("❌ Constructor:", error?.constructor?.name);
      console.error("❌ Message:", error?.message);
      console.error("❌ Code:", error?.code);
      console.error("❌ Details:", error?.details);
      console.error("❌ Stack:", error?.stack);
      console.error("❌ Stringified:", JSON.stringify(error, null, 2));
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projet) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Supprimer la photo si elle existe
      if (projet.photo_url) {
        const fileName = projet.photo_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("projets-photos").remove([fileName]);
        }
      }

      // Supprimer le projet
      const { error } = await supabase
        .from("projets")
        .delete()
        .eq("id", projet.id);

      if (error) throw error;

      toast.success("Projet supprimé avec succès");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erreur suppression projet:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Fragment>
      {/* Modal principal - ✅ Ajout onClick sur overlay */}
      <div 
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h2
              className="text-2xl font-bold"
              style={{ color: "#76715A" }}
            >
              {mode === "edit" ? "Modifier le projet" : "Nouveau projet"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              type="button"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {/* Section Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                        handlePhotoUpload(file);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                  />
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handlePhotoDelete}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section Nom & Référence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                />
                {errors.nom && (
                  <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                />
              </div>
            </div>

            {/* Section Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
              />
            </div>

            {/* Section Client & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={formData.client_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_id: e.target.value || null,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A] ${
                    errors.client_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statut: e.target.value as
                        | "brouillon"
                        | "en_cours"
                        | "termine"
                        | "annule",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Dates & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) =>
                    setFormData({ ...formData, date_debut: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) =>
                    setFormData({ ...formData, date_fin: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                />
                {errors.date_fin && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.date_fin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
                />
                {errors.budget && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                )}
              </div>
            </div>

            {/* Section Produits */}
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Produits ({selectedProduits.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProduitSelector(!showProduitSelector)}
                  className="px-4 py-2 bg-[#ED693A] text-white rounded-md hover:bg-[#d85a2a] transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un produit
                </button>
              </div>

              {/* Liste produits sélectionnés */}
              {selectedProduits.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedProduits.map((sp) => (
                    <div
                      key={sp.produit_id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {/* Photo miniature */}
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        {sp.produit.photo_url ? (
                          <img
                            src={sp.produit.photo_url}
                            alt={sp.produit.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ToolIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Nom + Référence */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {sp.produit.name}
                        </p>
                        {sp.produit.reference && (
                          <p className="text-xs text-gray-500">
                            Réf: {sp.produit.reference}
                          </p>
                        )}
                      </div>

                      {/* Prix unitaire */}
                      <div className="text-right">
                        <p className={`text-sm ${sp.prix_unitaire_fige ? 'text-amber-700' : 'text-gray-800'}`}>
                          {(sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0).toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {sp.prix_unitaire_fige && <Lock className="w-3 h-3" />}
                          <span>{sp.prix_unitaire_fige ? 'figé' : 'unitaire'}</span>
                        </p>
                      </div>

                      {/* Quantité */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantite(sp.produit_id, sp.quantite - 1)
                          }
                          className="w-8 h-8 bg-white rounded border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={sp.quantite}
                          onChange={(e) =>
                            handleUpdateQuantite(
                              sp.produit_id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 text-center px-2 py-1 border-2 border-gray-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuantite(sp.produit_id, sp.quantite + 1)
                          }
                          className="w-8 h-8 bg-white rounded border border-gray-300 hover:bg-gray-100 transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Total */}
                      <div className="text-right w-24">
                        <p className={`font-semibold ${sp.prix_unitaire_fige ? 'text-amber-700' : 'text-[#76715A]'}`}>
                          {(
                            (sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0) * sp.quantite
                          ).toFixed(2)}{" "}
                          €
                        </p>
                      </div>

                      {/* Supprimer */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduit(sp.produit_id)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                        title="Retirer"
                      >
                        <DeleteIcon className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun produit sélectionné
                </p>
              )}

              {/* Total HT */}
              {selectedProduits.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">
                      Total HT :
                    </span>
                    <span className="text-xl font-bold text-[#76715A]">
                      {totalHT.toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}

              {/* Sélecteur produits (popup) */}
              {showProduitSelector && (
                <div className="mt-4 p-4 bg-white border-2 border-[#ED693A] rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800">
                      Bibliothèque produits
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowProduitSelector(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <CloseIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Recherche */}
                  <div className="relative mb-3">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={produitSearch}
                      onChange={(e) => setProduitSearch(e.target.value)}
                      placeholder="Rechercher un produit..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ED693A]"
                    />
                  </div>

                  {/* Liste produits disponibles */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredProduits.map((prod) => {
                      const isSelected = selectedProduits.some(
                        (sp) => sp.produit_id === prod.id
                      );

                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleAddProduit(prod)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                            isSelected
                              ? "bg-[#EDEAE3] border border-[#ED693A]"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {prod.photo_url ? (
                              <img
                                src={prod.photo_url}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ToolIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate flex items-center gap-2">
                              {prod.name}
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#76715A]" />
                              )}
                            </p>
                            {prod.reference && (
                              <p className="text-xs text-gray-500">
                                Réf: {prod.reference}
                              </p>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-[#76715A]">
                            {(prod.prix_vente_total || 0).toFixed(2)} €
                          </p>
                        </button>
                      );
                    })}

                    {filteredProduits.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Aucun produit trouvé
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#76715A]"
              >
                <option value="">Aucune catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option disabled>────────────────</option>
                <option
                  value="__manage__"
                  style={{ color: "#76715A" }}
                >
                  ⚙ Gérer les catégories...
                </option>
              </select>
            </div>

            {/* Bouton Supprimer définitivement - Uniquement en mode édition */}
            {mode === "edit" && (
              <div className="pt-4 border-t border-red-200 mb-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <DeleteIcon className="w-4 h-4" />
                  Supprimer définitivement
                </button>
                <p className="text-xs text-red-600 mt-2">
                  Cette action est irréversible. Le projet sera supprimé de manière permanente.
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                {/* Le bouton de suppression n'est plus ici, il est au-dessus si archivé */}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <BackIcon className="w-4 h-4 inline mr-2" />
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#76715A" }}
                >
                  <SaveIcon className="w-4 h-4 inline mr-2" />
                  {isSubmitting
                    ? "Enregistrement..."
                    : mode === "edit"
                    ? "Enregistrer"
                    : "Créer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Popup confirmation suppression */}
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
              Êtes-vous sûr de vouloir supprimer définitivement ce projet ?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <span className="text-red-600 font-semibold">Cette action est irréversible.</span> Toutes les données associées seront perdues.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <DeleteIcon className="w-5 h-5" />
                {isSubmitting ? "Suppression..." : "Oui, supprimer définitivement"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CategoryManager */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="projets"
          onClose={() => {
            setShowCategoryManager(false);
            loadCategories();
          }}
          onUpdate={loadCategories}
        />
      )}

      {/* ✅ Modal de confirmation - 3 boutons */}
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
            <h3 className="text-xl font-bold text-[#76715A] mb-4">
              {mode === "edit" ? "Modifications non enregistrées" : "Création en cours"}
            </h3>
            <p className="text-gray-600 mb-6">
              Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-[#ED693A] text-white rounded-lg hover:bg-[#ED693A]/90 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <SaveIcon className="w-5 h-5" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer et fermer"}
              </button>

              <button
                type="button"
                onClick={handleCancelClose}
                className="w-full px-6 py-3 border-2 border-[#76715A] text-[#76715A] rounded-lg hover:bg-[#EDEAE3] transition-colors font-medium flex items-center justify-center gap-2"
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
    </Fragment>
  );
}
