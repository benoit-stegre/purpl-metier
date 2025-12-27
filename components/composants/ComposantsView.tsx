"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Columns3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ComposantsKanban } from "./ComposantsKanban";
import { ComposantCard } from "./ComposantCard";
import { ComposantModal } from "./ComposantModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { PlusIcon, SearchIcon } from "@/components/ui/Icons";
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
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposant, setEditingComposant] = useState<Composant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [localComposants, setLocalComposants] = useState<Composant[]>(initialComposants);

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

  const handleNewComposant = () => {
    setEditingComposant(null);
    setIsModalOpen(true);
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
      {/* Header avec titre et toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#76715A" }}>
          Composants
        </h1>

        <div className="flex items-center gap-3">
          {/* Toggle vue */}
          <div className="flex items-center bg-[#EDEAE3] rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-[#76715A] shadow-sm"
                  : "text-gray-500 hover:text-[#76715A]"
              }`}
              title="Vue Kanban"
            >
              <Columns3 className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#76715A] shadow-sm"
                  : "text-gray-500 hover:text-[#76715A]"
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grille</span>
            </button>
          </div>
        </div>
      </div>

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

            {/* Bouton nouveau */}
            <button
              onClick={handleNewComposant}
              className="w-full md:w-auto bg-[#ED693A] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#d85a2a] transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Nouveau
            </button>
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

