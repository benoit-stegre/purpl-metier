"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ComposantsKanban } from "./ComposantsKanban";
import { ComposantCard } from "./ComposantCard";
import { ComposantModal } from "./ComposantModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { SearchIcon } from "@/components/ui/Icons";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import type { Database } from "@/types/database.types";

type Composant = Database["public"]["Tables"]["composants"]["Row"] & {
  categorie: Database["public"]["Tables"]["categories_composants"]["Row"] | null;
};

type Category = Database["public"]["Tables"]["categories_composants"]["Row"];

interface ComposantsViewProps {
  initialComposants: Composant[];
  categories: Category[];
}

type ViewMode = "kanban" | "grid";

export function ComposantsView({
  initialComposants,
  categories,
}: ComposantsViewProps) {
  const router = useRouter();
  const {
    setPageTitle,
    viewMode,
    setViewMode,
    setShowNewButton,
    setNewButtonLabel,
    setOnNewClick,
  } = usePageHeader();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposant, setEditingComposant] = useState<Composant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [localComposants, setLocalComposants] = useState<Composant[]>(initialComposants);

  const handleNewComposant = useCallback(() => {
    setEditingComposant(null);
    setIsModalOpen(true);
  }, []);

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Composants");
    setViewMode("kanban");
    setShowNewButton(true);
    setNewButtonLabel("Nouveau");
    setOnNewClick(() => handleNewComposant);

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
      setNewButtonLabel("Nouveau");
      setOnNewClick(null);
    };
  }, [setPageTitle, setViewMode, setShowNewButton, setNewButtonLabel, setOnNewClick, handleNewComposant]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setLocalComposants(initialComposants);
  }, [initialComposants]);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories_composants")
        .select("*")
        .order("name");

      if (data) {
        setLocalCategories(data);
      }
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  const fetchComposants = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("composants")
        .select(`
          *,
          categorie:categories_composants(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setLocalComposants(data as Composant[]);
      }
    } catch (error) {
      console.error("Erreur fetch composants:", error);
    }
  };

  const handleSuccess = async () => {
    await fetchComposants();
    setEditingComposant(null);
    setIsModalOpen(false);
  };

  const handleEdit = (composant: Composant) => {
    setEditingComposant(composant);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingComposant(null);
  };

  // Filtrage pour la vue grille
  const filteredComposants = localComposants.filter((composant) => {
    const matchesSearch =
      searchTerm === "" ||
      composant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (composant.reference &&
        composant.reference.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      composant.categorie_id === selectedCategory;

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = composant.is_active === true;
    } else if (statusFilter === "archived") {
      matchesStatus = composant.is_active === false;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      {/* Vue Kanban */}
      {viewMode === "kanban" ? (
        <ComposantsKanban
          composants={localComposants}
          categories={localCategories}
          onComposantClick={handleEdit}
          onNewComposant={handleNewComposant}
        />
      ) : (
        /* Vue Grille */
        <>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Barre de recherche */}
            <div className="w-full md:flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un composant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white"
              />
            </div>

            {/* Dropdown catégories */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__manage__") {
                  setShowCategoryManager(true);
                  return;
                }
                setSelectedCategory(value);
              }}
              className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white cursor-pointer"
            >
              <option value="all">Toutes les catégories</option>
              {localCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option disabled>────────────────</option>
              <option value="__manage__" style={{ color: "#76715A" }}>
                ⚙ Gérer les catégories...
              </option>
            </select>

            {/* Dropdown statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs uniquement</option>
              <option value="archived">Archivés uniquement</option>
            </select>
          </div>

          {/* Grille */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredComposants.map((composant) => (
              <ComposantCard
                key={composant.id}
                composant={composant}
                onEdit={handleEdit}
                onDelete={async () => {
                  await fetchComposants();
                }}
              />
            ))}
          </div>

          {filteredComposants.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Aucun composant trouvé</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <ComposantModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        composant={editingComposant}
        categories={localCategories}
      />

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="composants"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}
    </>
  );
}

