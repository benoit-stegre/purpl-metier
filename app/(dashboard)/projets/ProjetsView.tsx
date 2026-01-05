"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjetsGrid } from "@/components/projets/ProjetsGrid";
import { ProjetsKanban } from "@/components/projets/ProjetsKanban";
import { ProjetModal } from "@/components/projets/ProjetModal";
import { usePageHeader } from "@/contexts/PageHeaderContext";

// Types pour ProjetsGrid (format existant)
interface ProjetGrid {
  id: string;
  name: string;
  reference: string | null;
  description: string | null;
  client_id: string | null;
  status: "draft" | "en_cours" | "termine" | "annule";
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
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProjet, setEditingProjet] = useState<ProjetForModal | null>(null);
  
  // État local pour les projets Kanban (permet mise à jour optimiste)
  const [localProjetsDetails, setLocalProjetsDetails] = useState(projetsDetails);

  // Mapper les données pour ProjetsGrid (adapte nom → name, statut → status)
  const projetsForGrid: ProjetGrid[] = projets.map((p) => {
    // Récupérer le total_ht depuis les détails du projet
    const details = localProjetsDetails.find((d) => d.id === p.id);
    
    return {
      id: p.id,
      name: p.nom,
      reference: p.reference,
      description: p.description,
      client_id: p.client_id,
      status: (p.statut === "brouillon" ? "draft" : p.statut || "draft") as ProjetGrid["status"],
      date_debut: p.date_debut,
      date_fin: p.date_fin,
      budget: p.budget,
      photo_url: p.photo_url,
      categorie_id: p.categorie_id,
      is_active: p.is_active ?? true,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
      total_ht: details?.total_ht ?? null,
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
        />
      ) : (
        <ProjetsGrid projets={projetsForGrid} />
      )}

      {/* Modal projet (création ou édition) */}
      {showModal && (
        <ProjetModal
          mode={modalMode}
          projet={editingProjet || undefined}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            handleStatusChange();
          }}
        />
      )}
    </>
  );
}

