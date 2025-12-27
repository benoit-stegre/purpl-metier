"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { PlusIcon, SearchIcon } from "@/components/ui/Icons";
import { ComposantCard } from "./ComposantCard";
import { ComposantModal } from "./ComposantModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import type { Database } from "@/types/database.types";

type Composant = Database["public"]["Tables"]["composants"]["Row"] & {
  categorie: Database["public"]["Tables"]["categories_composants"]["Row"] | null;
};

type Category = Database["public"]["Tables"]["categories_composants"]["Row"];

interface ComposantsGridProps {
  initialComposants: Composant[];
  categories: Category[];
}

export function ComposantsGrid({
  initialComposants,
  categories,
}: ComposantsGridProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComposant, setEditingComposant] = useState<Composant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  // ✅ State local pour les composants - permet le rechargement après sauvegarde
  const [localComposants, setLocalComposants] = useState<Composant[]>(initialComposants);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    composantId: string | null;
    composantName: string;
  }>({
    open: false,
    composantId: null,
    composantName: "",
  });

  // Mettre à jour localCategories quand categories change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Mettre à jour localComposants quand initialComposants change (navigation)
  useEffect(() => {
    setLocalComposants(initialComposants);
  }, [initialComposants]);

  // Fetch catégories pour rafraîchir
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

  // ✅ Fetch composants pour rafraîchir après sauvegarde
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
    await fetchComposants(); // ✅ Recharge les données depuis Supabase
    setEditingComposant(null);
  };

  const handleEdit = (composant: Composant) => {
    setEditingComposant(composant);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingComposant(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.composantId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("composants")
        .update({ is_active: false }) // Soft delete
        .eq("id", deleteConfirm.composantId);

      if (error) throw error;

      await fetchComposants(); // ✅ Recharge les données depuis Supabase
      setDeleteConfirm({ open: false, composantId: null, composantName: "" });
      toast.success("Composant supprimé");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteClick = (composant: Composant) => {
    setDeleteConfirm({
      open: true,
      composantId: composant.id,
      composantName: composant.name,
    });
  };

  // Filtrage côté client - ✅ Utilise localComposants au lieu de initialComposants
  const filteredComposants = useMemo(() => {
    return localComposants.filter((composant) => {
      // Filtre recherche
      const matchesSearch =
        searchTerm === "" ||
        composant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (composant.reference &&
          composant.reference.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtre catégorie
      const matchesCategory =
        selectedCategory === "all" || composant.categorie?.id === selectedCategory;

      // Filtre statut
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = composant.is_active === true;
      } else if (statusFilter === "archived") {
        matchesStatus = composant.is_active === false;
      }
      // Si 'all', matchesStatus reste true

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [localComposants, searchTerm, selectedCategory, statusFilter]);

  return (
    <>
      {/* Header avec titre et bouton */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Composants</h1>
        <button
          onClick={() => {
            setEditingComposant(null);
            setIsModalOpen(true);
          }}
          className="bg-purpl-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-purpl-orange/90 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau composant
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {/* Barre de recherche */}
        <div className="flex-1 min-w-[300px] relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un composant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white"
          />
        </div>

        {/* Dropdown catégories */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            const value = e.target.value;
            
            // Si option "Gérer les catégories" cliquée
            if (value === '__manage__') {
              setShowCategoryManager(true);
              return;
            }
            
            // Sinon, changer la catégorie normalement
            setSelectedCategory(value);
          }}
          className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Toutes les catégories</option>
          {localCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          
          {/* Séparateur visuel */}
          <option disabled>────────────────</option>
          
          {/* Option gérer avec roue crantée */}
          <option 
            value="__manage__" 
            className="font-semibold"
            style={{ color: '#76715A' }}
          >
            ⚙ Gérer les catégories...
          </option>
        </select>

        {/* Dropdown statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Tous les composants</option>
          <option value="active">Actifs uniquement</option>
          <option value="archived">Archivés uniquement</option>
        </select>
      </div>

      {/* Grille de composants */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredComposants.map((composant) => (
          <ComposantCard
            key={composant.id}
            composant={composant}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredComposants.length === 0 && (
        <div className="text-center py-12 text-purpl-green">
          <p className="text-lg">Aucun composant trouvé</p>
        </div>
      )}

      {/* Modal - Pattern identique à ClientModal */}
      <ComposantModal
        isOpen={isModalOpen}
        onClose={handleClose}
        categories={localCategories}
        onSuccess={handleSuccess}
        composant={editingComposant}
      />

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="composants"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}

      {/* Popup Confirmation Suppression */}
      {deleteConfirm.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() =>
            setDeleteConfirm({ open: false, composantId: null, composantName: "" })
          }
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-purpl-black mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-purpl-green mb-6">
              Êtes-vous sûr de vouloir supprimer le composant{" "}
              <strong className="text-purpl-black">{deleteConfirm.composantName}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({ open: false, composantId: null, composantName: "" })
                }
                className="px-4 py-2 border-2 border-purpl-ecru rounded-lg hover:bg-purpl-ecru transition-colors text-purpl-black"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

