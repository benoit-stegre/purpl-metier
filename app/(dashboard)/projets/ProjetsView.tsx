"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProjetsGrid } from "@/components/projets/ProjetsGrid";
import { ProjetsKanban } from "@/components/projets/ProjetsKanban";
import { ProjetModal } from "@/components/projets/ProjetModal";
import { usePageHeader } from "@/contexts/PageHeaderContext";

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

// Types pour ProjetsGrid (format existant)
interface ProjetGrid {
  id: string;
  name: string;
  reference: string | null;
  description: string | null;
  client_id: string | null;
  status: string; // Statut dynamique depuis statuts_projet
  date_debut: string | null;
  date_fin: string | null;
  budget: number | null;
  photo_url: string | null;
  categorie_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_ht: number | null;
  categories_projets: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  clients_pro: {
    id: string;
    raison_sociale: string;
  } | null;
}

// Types pour ProjetsKanban (vue_projets_details)
interface ProjetKanban {
  id: string;
  nom: string;
  reference: string | null;
  statut: string | null;
  date_debut: string | null;
  created_at: string | null;
  client_id: string | null;
  client_nom: string | null;
  total_ht: number | null;
  total_revient: number | null;
}

// Type brut depuis Supabase (projets avec relations)
interface ProjetRaw {
  id: string;
  nom: string;
  reference: string | null;
  description: string | null;
  client_id: string | null;
  statut: string | null;
  date_debut: string | null;
  date_fin: string | null;
  budget: number | null;
  photo_url: string | null;
  categorie_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  categories_projets: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
  clients_pro: {
    id: string;
    raison_sociale: string;
  } | null;
}

// Type brut depuis vue_projets_details
interface ProjetDetailRaw {
  id: string | null;
  nom: string | null;
  reference: string | null;
  statut: string | null;
  client_id: string | null;
  client_nom: string | null;
  total_ht: number | null;
  total_revient: number | null;
  created_at: string | null;
  nb_produits_differents: number | null;
  quantite_totale: number | null;
}

interface ProjetsViewProps {
  projets: ProjetRaw[];
  projetsDetails: ProjetDetailRaw[];
}

// Type pour le modal (adapté depuis ProjetRaw)
interface ProjetForModal {
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

export function ProjetsView({ projets, projetsDetails }: ProjetsViewProps) {
  const router = useRouter();
  const {
    setPageTitle,
    viewMode,
    setViewMode,
    setShowNewButton,
    setNewButtonLabel,
    setOnNewClick,
  } = usePageHeader();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "duplicate">("create");
  const [editingProjet, setEditingProjet] = useState<ProjetForModal | null>(null);
  
  // État local pour les projets Kanban (permet mise à jour optimiste)
  const [localProjetsDetails, setLocalProjetsDetails] = useState(projetsDetails);

  // Synchroniser localProjetsDetails quand projetsDetails change (après refresh)
  useEffect(() => {
    setLocalProjetsDetails(projetsDetails);
  }, [projetsDetails]);
  
  // States pour la suppression
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    projet: ProjetRaw | null;
  }>({
    open: false,
    projet: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Mapper les données pour ProjetsGrid (adapte nom → name, statut → status)
  const projetsForGrid: ProjetGrid[] = projets.map((p) => {
    // Récupérer le total_ht et total_revient depuis les détails du projet
    const details = localProjetsDetails.find((d) => d.id === p.id);
    
    return {
      id: p.id,
      name: p.nom,
      reference: p.reference,
      description: p.description,
      client_id: p.client_id,
      status: p.statut || "brouillon", // Utiliser directement le statut depuis la BDD (sans mapping)
      date_debut: p.date_debut,
      date_fin: p.date_fin,
      budget: p.budget,
      photo_url: p.photo_url,
      categorie_id: p.categorie_id,
      is_active: p.is_active ?? true,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
      total_ht: details?.total_ht ?? null,
      total_revient: details?.total_revient ?? null, // Ajout du total_revient
      categories_projets: p.categories_projets,
      clients_pro: p.clients_pro,
    };
  });

  // Mapper les données pour ProjetsKanban (utilise l'état local)
  const projetsForKanban: ProjetKanban[] = localProjetsDetails
    .filter((p) => p.id !== null)
    .map((p) => ({
      id: p.id!,
      nom: p.nom || "",
      reference: p.reference,
      statut: p.statut,
      date_debut: null, // Non disponible dans la vue
      created_at: p.created_at,
      client_id: p.client_id,
      client_nom: p.client_nom,
      total_ht: p.total_ht,
      total_revient: p.total_revient,
    }));

  // Callback pour mise à jour optimiste du statut d'un projet
  const handleOptimisticStatusChange = useCallback((projetId: string, newStatut: string) => {
    setLocalProjetsDetails((prev) =>
      prev.map((p) =>
        p.id === projetId ? { ...p, statut: newStatut } : p
      )
    );
  }, []);

  // Callback pour rafraîchir les données en arrière-plan (soft refresh)
  const handleStatusChange = useCallback(() => {
    // Soft refresh via Next.js router (revalide les données serveur sans rechargement complet)
    router.refresh();
  }, [router]);

  // Handler pour ouvrir le modal en mode édition
  const handleProjetClick = (projetId: string) => {
    // Trouver le projet complet par son ID
    const projetRaw = projets.find((p) => p.id === projetId);
    if (!projetRaw) return;

    // Convertir en format attendu par le modal
    const projetForModal: ProjetForModal = {
      id: projetRaw.id,
      nom: projetRaw.nom,
      reference: projetRaw.reference,
      description: projetRaw.description,
      client_id: projetRaw.client_id,
      statut: (projetRaw.statut || "brouillon") as ProjetForModal["statut"],
      date_debut: projetRaw.date_debut,
      date_fin: projetRaw.date_fin,
      budget: projetRaw.budget,
      photo_url: projetRaw.photo_url,
      categorie_id: projetRaw.categorie_id,
      is_active: projetRaw.is_active ?? true,
      created_at: projetRaw.created_at || new Date().toISOString(),
      updated_at: projetRaw.updated_at || new Date().toISOString(),
    };

    setEditingProjet(projetForModal);
    setModalMode("edit");
    setShowModal(true);
  };

  // Handler pour ouvrir le modal en mode création
  const handleNewProjet = useCallback(() => {
    setEditingProjet(null);
    setModalMode("create");
    setShowModal(true);
  }, []);

  // Handler pour fermer le modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProjet(null);
  };

  // Handler pour dupliquer un projet
  const handleDuplicate = (projetId: string) => {
    const projetRaw = projets.find((p) => p.id === projetId);
    if (!projetRaw) return;

    // Convertir en format modal avec "(copie)" ajouté au nom
    const projetForModal: ProjetForModal = {
      id: projetRaw.id, // GARDER l'ID pour que le modal charge les produits
      nom: `${projetRaw.nom} (copie)`,
      reference: projetRaw.reference,
      description: projetRaw.description,
      client_id: projetRaw.client_id,
      statut: (projetRaw.statut || "brouillon") as ProjetForModal["statut"],
      date_debut: projetRaw.date_debut,
      date_fin: projetRaw.date_fin,
      budget: projetRaw.budget,
      photo_url: projetRaw.photo_url,
      categorie_id: projetRaw.categorie_id,
      is_active: projetRaw.is_active ?? true,
      created_at: projetRaw.created_at || new Date().toISOString(),
      updated_at: projetRaw.updated_at || new Date().toISOString(),
    };

    setEditingProjet(projetForModal);
    setModalMode("duplicate"); // Mode duplication
    setShowModal(true);
  };

  // Handler pour ouvrir la popup de confirmation
  const handleDeleteClick = (projetId: string) => {
    const projetRaw = projets.find((p) => p.id === projetId);
    if (projetRaw) {
      setDeleteConfirm({ open: true, projet: projetRaw });
    }
  };

  // Handler pour confirmer la suppression
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.projet) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projets")
        .delete()
        .eq("id", deleteConfirm.projet.id);

      if (error) throw error;

      // Mise à jour optimiste : retirer le projet de localProjetsDetails
      const projetIdToDelete = deleteConfirm.projet.id;
      setLocalProjetsDetails((prev) =>
        prev.filter((p) => p.id !== projetIdToDelete)
      );

      setDeleteConfirm({ open: false, projet: null });
      router.refresh(); // Rafraîchir les données
    } catch (error) {
      console.error("Erreur suppression projet:", error);
      // En cas d'erreur, recharger les données pour restaurer l'état
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Projets");
    setViewMode("kanban");
    setShowNewButton(true);
    setNewButtonLabel("Nouveau");
    setOnNewClick(() => handleNewProjet);

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
      setNewButtonLabel("Nouveau");
      setOnNewClick(null);
    };
  }, [setPageTitle, setViewMode, setShowNewButton, setNewButtonLabel, setOnNewClick, handleNewProjet]);

  return (
    <>
      {/* Vue active */}
      {viewMode === "kanban" ? (
        <ProjetsKanban
          projets={projetsForKanban}
          onStatusChange={handleStatusChange}
          onOptimisticStatusChange={handleOptimisticStatusChange}
          onNewProjet={handleNewProjet}
          onProjetClick={handleProjetClick}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
        />
      ) : (
        <ProjetsGrid 
          projets={projetsForGrid} 
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Modal projet (création ou édition) */}
      {showModal && (
        <ProjetModal
          mode={modalMode === "duplicate" ? "create" : modalMode}
          projet={editingProjet || undefined}
          duplicateFromId={modalMode === "duplicate" ? editingProjet?.id : undefined}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            handleStatusChange();
          }}
        />
      )}

      {/* Popup confirmation suppression projet */}
      {deleteConfirm.open && deleteConfirm.projet && (
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
                onClick={() => setDeleteConfirm({ open: false, projet: null })}
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
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50"
                style={{ backgroundColor: COLORS.rougeDoux }}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

