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
import { AlertTriangle, Check, Lock, Trash2, X } from "lucide-react";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import type { ProduitMinimal, ClientMinimal, CategoryProjet } from "@/types";
import type { StatutProjet } from "@/types/database.types";

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
};

interface Projet {
  id: string;
  nom: string;
  reference: string | null;
  description: string | null;
  client_id: string | null;
  statut: string; // Statut dynamique depuis statuts_projet
  date_debut: string | null;
  date_fin: string | null;
  budget: number | null;
  photo_url: string | null;
  categorie_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Alias pour compatibilité
type Category = CategoryProjet;
type Client = ClientMinimal;
type Produit = ProduitMinimal;

type SelectedProduit = {
  produit_id: string;
  quantite: number;
  prix_unitaire_fige?: number | null; // Prix figé ou null = dynamique
  produit: Produit; // Pour afficher les infos
};

interface ProjetModalProps {
  mode: "create" | "edit";
  projet?: Projet;
  duplicateFromId?: string; // ID du projet à dupliquer
  onClose: () => void;
  onSuccess: () => void;
}

// Statuts par défaut (fallback si BDD vide)
const DEFAULT_STATUTS: StatutProjet[] = [
  { id: "default-brouillon", nom: "brouillon", couleur: "#6B7280", ordre: 0, is_system: true, created_at: "" },
  { id: "default-en_cours", nom: "en_cours", couleur: "#3B82F6", ordre: 1, is_system: false, created_at: "" },
  { id: "default-termine", nom: "termine", couleur: "#10B981", ordre: 2, is_system: false, created_at: "" },
  { id: "default-annule", nom: "annule", couleur: "#EF4444", ordre: 3, is_system: false, created_at: "" },
];

export function ProjetModal({
  mode,
  projet,
  duplicateFromId,
  onClose,
  onSuccess,
}: ProjetModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    reference: "",
    description: "",
    client_id: null as string | null,
    statut: "brouillon", // Statut dynamique depuis statuts_projet
    date_debut: "",
    date_fin: "",
    budget: "",
    categorie_id: null as string | null,
  });

  // State pour les statuts dynamiques
  const [statuts, setStatuts] = useState<StatutProjet[]>(DEFAULT_STATUTS);

  const [originalData, setOriginalData] = useState(formData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  // State pour popup de confirmation (retrait produit ou suppression projet)
  const [confirmationModal, setConfirmationModal] = useState<{
    type: "delete-project" | "delete-product"
    productIndex?: number
    productName?: string
  } | null>(null);
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

  // Charger les statuts depuis statuts_projet
  const loadStatuts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("statuts_projet")
        .select("*")
        .order("ordre");

      if (error) throw error;

      if (data && data.length > 0) {
        setStatuts(data as StatutProjet[]);
        // Si le statut actuel n'existe pas dans les nouveaux statuts, utiliser le premier
        if (formData.statut && !data.some((s) => s.nom === formData.statut)) {
          setFormData((prev) => ({ ...prev, statut: data[0].nom }));
        }
      } else {
        setStatuts(DEFAULT_STATUTS);
      }
    } catch (error) {
      console.error("Erreur chargement statuts:", error);
      setStatuts(DEFAULT_STATUTS);
    }
  };

  // Charger catégories, clients, produits et statuts au mount
  useEffect(() => {
    loadCategories();
    loadClients();
    loadProduits();
    loadStatuts();
  }, []);

  // Charger les données du projet en mode édition ou duplication
  useEffect(() => {
    if ((mode === "edit" || duplicateFromId) && projet) {
      // Vérifier si le statut du projet existe dans les statuts chargés
      const statutExiste = statuts.some((s) => s.nom === projet.statut);
      const statutAUtiliser = statutExiste ? projet.statut : (statuts[0]?.nom || "brouillon");
      
      const loadedData = {
        nom: projet.nom || "",
        reference: projet.reference || "",
        description: projet.description || "",
        client_id: projet.client_id || null,
        statut: statutAUtiliser,
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

      if (projet.photo_url && mode === "edit") {
        // En mode duplicate, ne pas copier la photo
        setPhotoPreview(projet.photo_url);
        setOriginalPhotoUrl(projet.photo_url);
      } else {
        setPhotoPreview(null);
        setOriginalPhotoUrl(null);
      }
      
      // Charger les produits du projet source (edit ou duplicate)
      const sourceProjetId = duplicateFromId || projet.id;
      if (sourceProjetId) {
        loadProjetProduits(sourceProjetId);
      }
    } else {
      resetForm();
      setSelectedProduits([]);
      setOriginalSelectedProduits([]);
    }
  }, [mode, projet, duplicateFromId, statuts]);

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
          is_active: client.is_active ?? true,
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
        .select(`
          id, 
          name, 
          reference, 
          prix_vente_total, 
          photo_url, 
          is_active,
          prix_heure,
          nombre_heures,
          produits_composants (
            quantite,
            composant:composants (
              prix_achat
            )
          )
        `)
        .order("name");

      if (error) throw error;
      if (data) setAvailableProduits(data.map(produit => {
        // Calculer le prix de revient du produit
        const coutComposants = produit.produits_composants?.reduce((sum: number, pc: any) => {
          return sum + (pc.quantite * (pc.composant?.prix_achat || 0));
        }, 0) || 0;
        const coutMainOeuvre = (produit.prix_heure || 0) * (produit.nombre_heures || 0);
        const prixRevient = coutComposants + coutMainOeuvre;

        return {
          id: produit.id,
          name: produit.name,
          reference: produit.reference,
          prix_vente_total: produit.prix_vente_total,
          photo_url: produit.photo_url,
          is_active: produit.is_active ?? true,
          prix_revient: prixRevient,
        };
      }));
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
          .select(`
            id, 
            name, 
            reference, 
            prix_vente_total, 
            photo_url, 
            is_active,
            prix_heure,
            nombre_heures,
            produits_composants (
              quantite,
              composant:composants (
                prix_achat
              )
            )
          `)
          .order("name");
        produits = (produitsData || []).map((produit: any) => {
          // Calculer le prix de revient du produit
          const coutComposants = produit.produits_composants?.reduce((sum: number, pc: any) => {
            return sum + (pc.quantite * (pc.composant?.prix_achat || 0));
          }, 0) || 0;
          const coutMainOeuvre = (produit.prix_heure || 0) * (produit.nombre_heures || 0);
          const prixRevient = coutComposants + coutMainOeuvre;

          return {
            id: produit.id,
            name: produit.name,
            reference: produit.reference,
            prix_vente_total: produit.prix_vente_total,
            photo_url: produit.photo_url,
            is_active: produit.is_active ?? true,
            prix_revient: prixRevient,
          };
        });
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
      statut: statuts[0]?.nom || "brouillon",
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

  const handleRemoveProduitByIndex = (index: number) => {
    if (index >= 0 && index < selectedProduits.length) {
      const produitId = selectedProduits[index].produit_id;
      handleRemoveProduit(produitId);
    }
  };

  // Calcul total HT projet (utilise le prix figé si disponible, sinon le prix dynamique)
  const totalHT = selectedProduits.reduce((total, sp) => {
    const prixUnitaire = sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0;
    return total + (prixUnitaire * sp.quantite);
  }, 0);

  // Calcul du prix de revient total
  const totalRevient = selectedProduits.reduce((total, sp) => {
    const prixRevient = sp.produit.prix_revient ?? 0;
    return total + prixRevient * sp.quantite;
  }, 0);

  // Calcul de la marge
  const margeEuros = totalHT - totalRevient;
  const margePourcent = totalRevient > 0 ? (margeEuros / totalRevient) * 100 : 0;

  // Couleur du badge marge selon le pourcentage
  const getMargeBadgeColor = (percent: number) => {
    if (percent > 30) return COLORS.vertDoux;
    if (percent > 15) return COLORS.orangeDoux;
    if (percent > 0) return COLORS.orangeChaud;
    return COLORS.rougeDoux;
  };

  // Couleur de la marge € (vert si positive, rouge si négative)
  const getMargeColor = (value: number) => {
    return value >= 0 ? COLORS.vertDoux : COLORS.rougeDoux;
  };

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

      // Si on est en mode édition ET qu'on n'est pas en train de dupliquer → UPDATE
      // Sinon (création ou duplication) → INSERT
      const isEditMode = mode === "edit" && projet && !duplicateFromId;
      
      if (isEditMode) {
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
        toast.success(duplicateFromId ? "Projet dupliqué avec succès" : "Projet créé avec succès");
      }

      // Gérer les produits du projet
      // En mode édition, supprimer les anciens produits avant d'insérer les nouveaux
      if (isEditMode) {
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
      setConfirmationModal(null);
    }
  };

  return (
    <Fragment>
      {/* Modal principal - ✅ Ajout onClick sur overlay */}
      <div 
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
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
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                    id="photo-input-projet"
                  />
                  {/* Bouton Parcourir */}
                  <label
                    htmlFor="photo-input-projet"
                    className="mt-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer block text-center"
                    style={{ backgroundColor: COLORS.olive }}
                  >
                    Parcourir
                  </label>
                </div>
                
                {/* Titre + Référence */}
                <div>
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.noir }}
                  >
                    {formData.nom || (mode === "edit" ? "Modifier le projet" : "Nouveau projet")}
                  </h2>
                  {mode === "edit" && projet?.reference && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: COLORS.olive }}
                    >
                      ID: {projet.reference}
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
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ===== CONTENU SCROLLABLE ===== */}
          <div className="flex-1 overflow-y-auto p-6">
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
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none transition-colors"
                    style={{ 
                      borderColor: errors.nom ? COLORS.rougeDoux : COLORS.ecru,
                      backgroundColor: COLORS.ivoire,
                      color: COLORS.noir
                    }}
                    placeholder="Ex: Aménagement Place Kléber"
                  />
                  {errors.nom && (
                    <p className="text-sm mt-1" style={{ color: COLORS.rougeDoux }}>
                      {errors.nom}
                    </p>
                  )}
                </div>
                
                {/* Référence */}
                <div className="mb-4">
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
                    placeholder="Ex: PRJ-2025-001"
                  />
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
                    placeholder="Description du projet..."
                  />
                </div>
              </section>

              {/* ===== SECTION: Client & Statut ===== */}
              <section 
                className="p-6 rounded-lg border"
                style={{ borderColor: COLORS.ecru }}
              >
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: COLORS.olive }}
                >
                  Client & Statut
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Client *
                    </label>
                    <select
                      value={formData.client_id || ""}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value || null })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: errors.client_id ? COLORS.rougeDoux : COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    >
                      <option value="">Sélectionner un client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    {errors.client_id && (
                      <p className="text-sm mt-1" style={{ color: COLORS.rougeDoux }}>
                        {errors.client_id}
                      </p>
                    )}
                  </div>
                  
                  {/* Statut */}
                  <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.olive }}
                  >
                    Statut
                  </label>
                    <select
                      value={formData.statut}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        statut: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    >
                      {statuts.map((status) => (
                        <option key={status.id} value={status.nom}>
                          {status.nom.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    
                    {/* Preview pastille couleur statut */}
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: statuts.find((s) => s.nom === formData.statut)?.couleur || "#6B7280",
                        }}
                      />
                      <span className="text-sm" style={{ color: COLORS.olive }}>
                        {statuts.find((s) => s.nom === formData.statut)?.nom.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || formData.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ===== SECTION: Planning & Budget ===== */}
              <section 
                className="p-6 rounded-lg border"
                style={{ borderColor: COLORS.ecru }}
              >
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: COLORS.olive }}
                >
                  Planning & Budget
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date début */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    />
                  </div>
                  
                  {/* Date fin */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: errors.date_fin ? COLORS.rougeDoux : COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    />
                    {errors.date_fin && (
                      <p className="text-sm mt-1" style={{ color: COLORS.rougeDoux }}>
                        {errors.date_fin}
                      </p>
                    )}
                  </div>
                  
                  {/* Budget */}
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: COLORS.olive }}
                    >
                      Budget client (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{ 
                        borderColor: errors.budget ? COLORS.rougeDoux : COLORS.ecru,
                        backgroundColor: COLORS.ivoire,
                        color: COLORS.noir
                      }}
                    />
                    {errors.budget && (
                      <p className="text-sm mt-1" style={{ color: COLORS.rougeDoux }}>
                        {errors.budget}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ===== SECTION: Produits ===== */}
              <section 
                className="p-6 rounded-lg border"
                style={{ borderColor: COLORS.ecru }}
              >
                {/* Header : Titre + Badge compteur (PAS de bouton ici !) */}
                <div className="flex justify-between items-center mb-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: COLORS.olive }}
                  >
                    Produits
                  </h3>
                  <span 
                    className="px-3 py-1 rounded text-sm font-semibold text-white"
                    style={{ backgroundColor: COLORS.olive }}
                  >
                    {selectedProduits.length}
                  </span>
                </div>

                {/* Liste produits sélectionnés */}
                {selectedProduits.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {selectedProduits.map((sp, index) => (
                      <div
                        key={sp.produit_id}
                        className="flex items-center gap-4 p-3 rounded-lg"
                        style={{ backgroundColor: COLORS.ecru }}
                      >
                        {/* Photo */}
                        <div 
                          className="w-12 h-12 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: COLORS.olive }}
                        >
                          {sp.produit.photo_url ? (
                            <img
                              src={sp.produit.photo_url}
                              alt={sp.produit.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ToolIcon className="w-6 h-6 text-white" />
                          )}
                        </div>

                        {/* Nom + Référence */}
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-medium truncate"
                            style={{ color: COLORS.noir }}
                          >
                            {sp.produit.name}
                          </p>
                          {sp.produit.reference && (
                            <p className="text-xs" style={{ color: COLORS.olive }}>
                              {sp.produit.reference}
                            </p>
                          )}
                        </div>

                        {/* Prix unitaire */}
                        <div className="text-right">
                          <p 
                            className="text-xs flex items-center justify-end gap-1"
                            style={{ color: COLORS.olive }}
                          >
                            {sp.prix_unitaire_fige && <Lock className="w-3 h-3" />}
                            <span>{sp.prix_unitaire_fige ? 'figé' : 'Prix unitaire'}</span>
                          </p>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: sp.prix_unitaire_fige ? '#B45309' : COLORS.noir }}
                          >
                            {(sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0).toFixed(2)} €
                          </p>
                        </div>

                        {/* Quantité avec boutons +/- */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sp.produit_id, sp.quantite - 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                            style={{ backgroundColor: COLORS.orangeDoux }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={sp.quantite}
                            onChange={(e) => handleUpdateQuantite(sp.produit_id, parseInt(e.target.value) || 1)}
                            className="w-14 text-center py-1 rounded border-2 focus:outline-none"
                            style={{ 
                              borderColor: COLORS.ecru,
                              backgroundColor: COLORS.ivoire 
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantite(sp.produit_id, sp.quantite + 1)}
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold transition-opacity hover:opacity-80"
                            style={{ backgroundColor: COLORS.orangeDoux }}
                          >
                            +
                          </button>
                        </div>

                        {/* Total ligne */}
                        <div 
                          className="text-right w-24 font-semibold"
                          style={{ color: sp.prix_unitaire_fige ? '#B45309' : COLORS.orangeDoux }}
                        >
                          {((sp.prix_unitaire_fige ?? sp.produit.prix_vente_total ?? 0) * sp.quantite).toFixed(2)} €
                        </div>

                        {/* Supprimer - ⚠️ OUVRE UNE POPUP, NE SUPPRIME PAS DIRECTEMENT */}
                        <button
                          type="button"
                          onClick={() => setConfirmationModal({
                            type: "delete-product",
                            productIndex: index,
                            productName: sp.produit.name,
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
                    Aucun produit sélectionné
                  </p>
                )}

                {/* ⚠️ BOUTON AJOUTER - APRÈS la liste, pleine largeur, fond OLIVE */}
                <button
                  type="button"
                  onClick={() => setShowProduitSelector(!showProduitSelector)}
                  className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 mb-4"
                  style={{ backgroundColor: COLORS.olive }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Ajouter un produit
                </button>

                {/* Sous-total */}
                {selectedProduits.length > 0 && (
                  <div style={{ color: COLORS.noir }}>
                    <p>
                      <span className="font-medium">Sous-total produits :</span>{" "}
                      <span style={{ color: COLORS.orangeDoux, fontWeight: 600 }}>
                        {totalHT.toFixed(2)} €
                      </span>
                    </p>
                  </div>
                )}

                {/* Sélecteur produits (popup) */}
                {showProduitSelector && (
                  <div 
                    className="mt-4 p-4 rounded-lg border-2"
                    style={{ borderColor: COLORS.olive }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 
                        className="font-medium"
                        style={{ color: COLORS.olive }}
                      >
                        Bibliothèque produits
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowProduitSelector(false)}
                        style={{ color: COLORS.olive }}
                        className="hover:opacity-70"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Recherche */}
                    <div className="relative mb-3">
                      <span 
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: COLORS.olive }}
                      >
                        <SearchIcon className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={produitSearch}
                        onChange={(e) => setProduitSearch(e.target.value)}
                        placeholder="Rechercher un produit..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-2 focus:outline-none"
                        style={{ 
                          borderColor: COLORS.ecru,
                          backgroundColor: COLORS.ivoire
                        }}
                      />
                    </div>

                    {/* Liste produits disponibles */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredProduits.map((prod) => {
                        const isSelected = selectedProduits.some((sp) => sp.produit_id === prod.id);

                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddProduit(prod)}
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
                              {prod.photo_url ? (
                                <img
                                  src={prod.photo_url}
                                  alt={prod.name}
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
                                {prod.name}
                                {isSelected && <Check className="w-4 h-4" style={{ color: COLORS.orangeDoux }} />}
                              </p>
                              {prod.reference && (
                                <p className="text-xs" style={{ color: COLORS.olive }}>
                                  Réf: {prod.reference}
                                </p>
                              )}
                            </div>

                            <p 
                              className="text-sm font-semibold"
                              style={{ color: COLORS.orangeDoux }}
                            >
                              {(prod.prix_vente_total || 0).toFixed(2)} €
                            </p>
                          </button>
                        );
                      })}

                      {filteredProduits.length === 0 && (
                        <p 
                          className="text-sm text-center py-4"
                          style={{ color: COLORS.olive }}
                        >
                          Aucun produit trouvé
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ===== SECTION: Récapitulatif financier ===== */}
              {selectedProduits.length > 0 && (
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
                        {totalRevient.toFixed(2)} €
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
                        {totalHT.toFixed(2)} €
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
                        style={{ color: getMargeColor(margeEuros) }}
                      >
                        {margeEuros.toFixed(2)} €
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
                          style={{ backgroundColor: getMargeBadgeColor(margePourcent) }}
                        >
                          {margePourcent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Formules explicatives */}
                  <div 
                    className="space-y-1 text-xs" 
                    style={{ color: COLORS.olive }}
                  >
                    <p>Prix de revient = Composants (coût) + Main d'œuvre</p>
                    <p>Marge = Prix vente - Prix revient</p>
                  </div>
                </section>
              )}

              {/* ===== SECTION: Catégorie ===== */}
              <section>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.olive }}
                >
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
                    setFormData({ ...formData, categorie_id: value || null });
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
                  <option value="__manage__" style={{ color: COLORS.olive }}>
                    ⚙ Gérer les catégories...
                  </option>
                </select>
                
                {/* Preview pastille couleur */}
                {formData.categorie_id && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: categories.find((c) => c.id === formData.categorie_id)?.color || COLORS.orangeChaud,
                      }}
                    />
                    <span className="text-sm" style={{ color: COLORS.olive }}>
                      {categories.find((c) => c.id === formData.categorie_id)?.name}
                    </span>
                  </div>
                )}
              </section>

              {/* ===== Bouton Supprimer ===== */}
              {mode === "edit" && (
                <section>
                  <button
                    type="button"
                    onClick={() => setConfirmationModal({ type: "delete-project" })}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border-2 hover:bg-red-50 disabled:opacity-50"
                    style={{
                      backgroundColor: COLORS.ivoire,
                      color: COLORS.rougeDoux,
                      borderColor: COLORS.rougeDoux,
                    }}
                  >
                  <Trash2 size={18} />
                  Supprimer ce projet
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
              onClick={async () => {
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                await handleSubmit(fakeEvent);
              }}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: COLORS.orangeDoux }}
            >
              {isSubmitting 
                ? (mode === "edit" ? 'Modification...' : 'Création...') 
                : (mode === "edit" ? 'Modifier le projet' : 'Créer le projet')
              }
            </button>
          </div>
        </div>
      </div>

      {/* Popup confirmation SUPPRESSION PROJET */}
      {confirmationModal?.type === "delete-project" && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmationModal(null);
            }
          }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
        >
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
              Supprimer ce projet ?
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
                  handleDelete();
                  setConfirmationModal(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50"
                style={{ backgroundColor: COLORS.rougeDoux }}
              >
                {isSubmitting ? "Suppression..." : "Supprimer"}
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

      {/* ⚠️ Popup confirmation RETRAIT PRODUIT */}
      {confirmationModal?.type === "delete-product" && (
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
              Retirer ce produit ?
            </h3>
            <p 
              className="text-center text-sm mb-6" 
              style={{ color: COLORS.olive }}
            >
              Voulez-vous retirer <strong>{confirmationModal.productName}</strong> de ce projet ?
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
                  if (confirmationModal.productIndex !== undefined) {
                    handleRemoveProduitByIndex(confirmationModal.productIndex);
                  }
                  setConfirmationModal(null);
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
          <div 
            className="rounded-xl max-w-md w-full p-6"
            style={{ backgroundColor: COLORS.ivoire }}
          >
            <h3 
              className="text-xl font-bold mb-4"
              style={{ color: COLORS.noir }}
            >
              {mode === "edit" ? "Modifications non enregistrées" : "Création en cours"}
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
                disabled={isSubmitting}
                className="w-full px-6 py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: COLORS.orangeDoux }}
              >
                <SaveIcon className="w-5 h-5" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer et fermer"}
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
    </Fragment>
  );
}
