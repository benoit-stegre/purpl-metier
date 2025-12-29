"use client";

import { useState, useMemo } from "react";
import { ProjetModal } from "./ProjetModal";
import { ExportCommandeModal } from "./ExportCommandeModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { SearchIcon } from "@/components/ui/Icons";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "react-hot-toast";
import { exportProjetDevis } from "@/lib/exports/projetExports";

interface Projet {
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
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280",
  en_cours: "#3B82F6",
  termine: "#10B981",
  annule: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export function ProjetsGrid({ projets }: ProjetsGridProps) {
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

  const handleExportDevis = async (projetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await exportProjetDevis(projetId);
    if (result.success) {
      toast.success("Devis exporté avec succès");
    } else {
      toast.error(result.error || "Erreur lors de l'export");
    }
  };

  const handleExportCommande = (projetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportProjetId(projetId);
    setShowExportCommandeModal(true);
  };

  // Fonction pour obtenir l'URL publique de la photo
  const getPublicPhotoUrl = (photoUrl: string | null) => {
    if (!photoUrl) return null;

    // Si c'est déjà une URL complète, la retourner telle quelle
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return photoUrl;
    }

    // Sinon, construire l'URL publique depuis le chemin relatif
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    // Extraire le nom du fichier (enlever le chemin si présent)
    const fileName = photoUrl.split("/").pop() || photoUrl;
    return `${supabaseUrl}/storage/v1/object/public/projets-photos/${fileName}`;
  };

  return (
    <>
      {/* Filtres */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {/* Input recherche */}
        <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Select catégorie */}
        <select
          value={filterCategorie}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "__manage__") {
              setShowCategoryManager(true);
              return;
            }
            setFilterCategorie(value);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Toutes les catégories</option>
          {uniqueCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          <option disabled>────────────────</option>
          <option value="__manage__" style={{ color: "#76715A" }}>
            ⚙ Gérer les catégories...
          </option>
        </select>

        {/* Select status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>

        {/* Select client */}
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Tous les clients</option>
          {uniqueClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grille */}
      {filteredProjets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucun projet trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjets.map((projet) => {
            const photoUrl = getPublicPhotoUrl(projet.photo_url);
            const statusColor = STATUS_COLORS[projet.status] || "#6B7280";
            const statusLabel = STATUS_LABELS[projet.status] || "Inconnu";

            return (
              <div
                key={projet.id}
                onClick={() => handleEdit(projet)}
                className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                {/* Photo */}
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt={projet.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e) => {
                      // En cas d'erreur, masquer l'image
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {/* Nom */}
                <h3 className="font-semibold text-lg mb-2">{projet.name}</h3>

                {/* Badges catégorie et status */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* Badge catégorie (si existe) */}
                  {projet.categories_projets && (
                    <span
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${
                          projet.categories_projets.color || "#76715A"
                        }15`,
                        color: projet.categories_projets.color || "#76715A",
                        border: `1px solid ${
                          projet.categories_projets.color || "#76715A"
                        }30`,
                      }}
                    >
                      {projet.categories_projets.name}
                    </span>
                  )}

                  {/* Badge status */}
                  <span
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: `${statusColor}15`,
                      color: statusColor,
                      border: `1px solid ${statusColor}30`,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Référence */}
                {projet.reference && (
                  <p className="text-sm text-gray-500 mt-2">
                    Réf: {projet.reference}
                  </p>
                )}

                {/* Client */}
                {projet.clients_pro && (
                  <p className="text-sm text-gray-600 mt-1">
                    Client: {projet.clients_pro.raison_sociale}
                  </p>
                )}

                {/* Dates */}
                {(projet.date_debut || projet.date_fin) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {projet.date_debut &&
                      `Du ${new Date(projet.date_debut).toLocaleDateString(
                        "fr-FR"
                      )}`}
                    {projet.date_debut && projet.date_fin && " "}
                    {projet.date_fin &&
                      `au ${new Date(projet.date_fin).toLocaleDateString(
                        "fr-FR"
                      )}`}
                  </p>
                )}

                {/* Budget */}
                {projet.budget && (
                  <p className="text-sm font-medium text-gray-700 mt-2">
                    Budget:{" "}
                    {projet.budget.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                )}

                {/* Badge actif/inactif */}
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded mt-2 ${
                    projet.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {projet.is_active ? "Actif" : "Inactif"}
                </span>

                {/* Boutons d'export */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => handleExportDevis(projet.id, e)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#76715A] text-white rounded hover:bg-[#5f5a48] transition-colors text-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    Devis
                  </button>
                  <button
                    onClick={(e) => handleExportCommande(projet.id, e)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#ED693A] text-white rounded hover:bg-[#d85a2a] transition-colors text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Commande
                  </button>
                </div>
              </div>
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
                  statut: (selectedProjet.status === "draft" ? "brouillon" : selectedProjet.status) as "brouillon" | "en_cours" | "termine" | "annule",
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
