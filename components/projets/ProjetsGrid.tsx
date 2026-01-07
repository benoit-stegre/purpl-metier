"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProjetModal } from "./ProjetModal";
import { ExportCommandeModal } from "./ExportCommandeModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { ProjetCard } from "./ProjetCard";
import { SearchIcon, DuplicateIcon, DeleteIcon } from "@/components/ui/Icons";
import { toast } from "react-hot-toast";
import { exportProjetDevis } from "@/lib/exports/projetExports";
import type { StatutProjet } from "@/types/database.types";

// Couleurs PURPL
const COLORS = {
  ivoire: "#FFFEF5",
  olive: "#76715A",
  rougeDoux: "#C23C3C",
};

// Statuts par défaut (fallback si BDD vide)
const DEFAULT_STATUTS: StatutProjet[] = [
  { id: "default-brouillon", nom: "brouillon", couleur: "#6B7280", ordre: 0, is_system: true, created_at: "" },
  { id: "default-en_cours", nom: "en_cours", couleur: "#3B82F6", ordre: 1, is_system: false, created_at: "" },
  { id: "default-termine", nom: "termine", couleur: "#10B981", ordre: 2, is_system: false, created_at: "" },
  { id: "default-annule", nom: "annule", couleur: "#EF4444", ordre: 3, is_system: false, created_at: "" },
];

interface Projet {
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
  total_revient?: number | null; // Prix de revient total du projet
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

interface ProjetsGridProps {
  projets: Projet[];
  onDuplicate?: (projetId: string) => void;
  onDelete?: (projetId: string) => void;
}


export function ProjetsGrid({ projets, onDuplicate, onDelete }: ProjetsGridProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProjet, setSelectedProjet] = useState<Projet | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategorie, setFilterCategorie] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showExportCommandeModal, setShowExportCommandeModal] = useState(false);
  const [exportProjetId, setExportProjetId] = useState<string | null>(null);
  
  // State pour les statuts dynamiques
  const [statuts, setStatuts] = useState<StatutProjet[]>(DEFAULT_STATUTS);

  // Charger les statuts depuis statuts_projet
  useEffect(() => {
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
        } else {
          setStatuts(DEFAULT_STATUTS);
        }
      } catch (error) {
        console.error("Erreur chargement statuts:", error);
        setStatuts(DEFAULT_STATUTS);
      }
    };

    loadStatuts();
  }, []);

  // Extraire les catégories uniques depuis les projets
  const uniqueCategories = useMemo(() => {
    const categoriesMap = new Map<
      string,
      { id: string; name: string; color: string | null }
    >();
    projets.forEach((projet) => {
      if (projet.categories_projets) {
        categoriesMap.set(projet.categories_projets.id, {
          id: projet.categories_projets.id,
          name: projet.categories_projets.name,
          color: projet.categories_projets.color,
        });
      }
    });
    return Array.from(categoriesMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [projets]);

  // Extraire les clients uniques depuis les projets
  const uniqueClients = useMemo(() => {
    const clientsMap = new Map<string, { id: string; name: string }>();
    projets.forEach((projet) => {
      if (projet.clients_pro) {
        clientsMap.set(projet.clients_pro.id, {
          id: projet.clients_pro.id,
          name: projet.clients_pro.raison_sociale,
        });
      }
    });
    return Array.from(clientsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [projets]);

  // Fonction de filtrage
  const filteredProjets = useMemo(() => {
    return projets.filter((projet) => {
      // 1. Filtre recherche (insensible casse)
      const matchesSearch =
        searchTerm === "" ||
        projet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (projet.reference &&
          projet.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (projet.description &&
          projet.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (projet.clients_pro &&
          projet.clients_pro.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Filtre catégorie
      const matchesCategorie =
        filterCategorie === "all" ||
        projet.categorie_id === filterCategorie;

      // 3. Filtre status
      const matchesStatus =
        filterStatus === "all" || projet.status === filterStatus;

      // 4. Filtre client
      const matchesClient =
        filterClient === "all" || projet.client_id === filterClient;

      return (
        matchesSearch && matchesCategorie && matchesStatus && matchesClient
      );
    });
  }, [projets, searchTerm, filterCategorie, filterStatus, filterClient]);

  const handleEdit = (projet: Projet) => {
    setSelectedProjet(projet);
    setModalMode("edit");
    setShowModal(true);
  };


  return (
    <>
      {/* Filtres - Style Produits */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Barre de recherche */}
        <div className="w-full md:flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white"
          />
        </div>

        {/* Select statut */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          {statuts.map((statut) => (
            <option key={statut.id} value={statut.nom}>
              {statut.nom.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Select client */}
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white cursor-pointer"
        >
          <option value="all">Tous les clients</option>
          {uniqueClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grille - Style Produits */}
      {filteredProjets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjets.map((projet) => {
            // Trouver le statut correspondant dans la liste des statuts chargés
            const statutInfo = statuts.find((s) => s.nom === projet.status);
            const statutColor = statutInfo?.couleur;
            const statutLabel = statutInfo
              ? statutInfo.nom.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
              : undefined;

            return (
              <ProjetCard
                key={projet.id}
                projet={{
                  id: projet.id,
                  nom: projet.name,
                  reference: projet.reference,
                  statut: projet.status, // Utiliser directement le statut (sans mapping)
                  client_nom: projet.clients_pro?.raison_sociale || null,
                  total_ht: projet.total_ht,
                  total_revient: projet.total_revient ?? null,
                  photo_url: projet.photo_url,
                  date_debut: projet.date_debut,
                  created_at: projet.created_at,
                }}
                variant="grid"
                onClick={() => handleEdit(projet)}
                onDuplicate={onDuplicate ? () => onDuplicate(projet.id) : undefined}
                onDelete={onDelete ? () => onDelete(projet.id) : undefined}
                statutColor={statutColor} // Passer la couleur du statut depuis statuts_projet
                statutLabel={statutLabel} // Passer le label formaté du statut
              />
            );
          })}
        </div>
      )}

      {/* Modal Projet - Utilise key pour forcer le remontage */}
      {showModal && (
        <ProjetModal
          key={selectedProjet?.id || "new"}
          mode={modalMode}
          projet={
            selectedProjet
              ? {
                  id: selectedProjet.id,
                  nom: selectedProjet.name,
                  reference: selectedProjet.reference,
                  description: selectedProjet.description,
                  client_id: selectedProjet.client_id,
                  statut: selectedProjet.status || "brouillon",
                  date_debut: selectedProjet.date_debut,
                  date_fin: selectedProjet.date_fin,
                  budget: selectedProjet.budget,
                  photo_url: selectedProjet.photo_url,
                  categorie_id: selectedProjet.categorie_id,
                  is_active: selectedProjet.is_active,
                  created_at: selectedProjet.created_at,
                  updated_at: selectedProjet.updated_at,
                }
              : undefined
          }
          onClose={() => {
            setShowModal(false);
            setSelectedProjet(null);
          }}
          onSuccess={() => {
            // Callback vers parent pour refresh
            window.location.reload(); // Temporaire, idéalement onRefresh prop
          }}
        />
      )}

      {/* Modal CategoryManager */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="projets"
          onClose={() => {
            setShowCategoryManager(false);
            window.location.reload(); // Temporaire pour refresh catégories
          }}
          onUpdate={() => {
            window.location.reload(); // Temporaire pour refresh catégories
          }}
        />
      )}

      {/* Modal Export Commande */}
      {showExportCommandeModal && exportProjetId && (
        <ExportCommandeModal
          projetId={exportProjetId}
          isOpen={showExportCommandeModal}
          onClose={() => {
            setShowExportCommandeModal(false);
            setExportProjetId(null);
          }}
        />
      )}
    </>
  );
}
