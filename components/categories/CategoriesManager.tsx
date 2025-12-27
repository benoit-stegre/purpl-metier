"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { DeleteIcon } from "@/components/ui/Icons";
import { CategoryModal } from "./CategoryModal";
import { usePageHeader } from "@/contexts/PageHeaderContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type CategoryType = "composants" | "produits" | "clients" | "projets";

export function CategoriesManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    setPageTitle,
    setViewMode,
    setShowNewButton,
    setNewButtonLabel,
    setOnNewClick,
  } = usePageHeader();
  const [activeTab, setActiveTab] = useState<CategoryType>("composants");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    categoryId: string | null;
    categoryName: string;
  }>({
    open: false,
    categoryId: null,
    categoryName: "",
  });

  // Ouvrir le bon tab selon le paramètre URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "composants" || tab === "produits" || tab === "clients" || tab === "projets") {
      setActiveTab(tab as CategoryType);
    }
  }, [searchParams]);

  // Fetch catégories selon le tab actif
  useEffect(() => {
    fetchCategories();
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const tableName = `categories_${activeTab}`;
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  const handleSuccess = () => {
    router.refresh();
    fetchCategories();
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.categoryId) return;

    try {
      const supabase = createClient();
      const tableName = `categories_${activeTab}`;
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", deleteConfirm.categoryId);

      if (error) throw error;

      router.refresh();
      fetchCategories();
      setDeleteConfirm({ open: false, categoryId: null, categoryName: "" });
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteClick = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      open: true,
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleNewCategory = useCallback(() => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }, []);

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Catégories");
    setViewMode(null); // Pas de toggle Kanban/Grille
    setShowNewButton(true);
    setNewButtonLabel("Nouvelle catégorie");
    setOnNewClick(() => handleNewCategory);

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
      setNewButtonLabel("Nouveau");
      setOnNewClick(null);
    };
  }, [setPageTitle, setViewMode, setShowNewButton, setNewButtonLabel, setOnNewClick, handleNewCategory]);

  return (
    <>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        <button
          onClick={() => setActiveTab("composants")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "composants"
              ? "border-purpl-green text-purpl-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          type="button"
        >
          Composants
        </button>
        <button
          onClick={() => setActiveTab("produits")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "produits"
              ? "border-purpl-orange text-purpl-orange"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          type="button"
        >
          Produits
        </button>
        <button
          onClick={() => setActiveTab("clients")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "clients"
              ? "border-purpl-green text-purpl-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          type="button"
        >
          Clients
        </button>
        <button
          onClick={() => setActiveTab("projets")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "projets"
              ? "border-purpl-green text-purpl-green"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          type="button"
        >
          Projets
        </button>
      </div>

      {/* Grille de catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleEdit(cat)}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              {/* Pastille couleur */}
              <div
                className="w-10 h-10 rounded-full border-2 border-gray-200"
                style={{
                  backgroundColor: cat.color || "#76715A",
                }}
              />

              {/* Bouton supprimer */}
              <button
                onClick={(e) => handleDeleteClick(cat, e)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                type="button"
              >
                <DeleteIcon className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-semibold text-purpl-black">{cat.name}</h3>
            <p className="text-sm text-gray-500">/{cat.slug}</p>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {categories.length === 0 && (
        <div className="text-center py-12 text-purpl-green">
          <p className="text-lg">Aucune catégorie trouvée</p>
        </div>
      )}

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        category={editingCategory}
        type={activeTab}
      />

      {/* Popup Confirmation Suppression */}
      {deleteConfirm.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() =>
            setDeleteConfirm({ open: false, categoryId: null, categoryName: "" })
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
              Êtes-vous sûr de vouloir supprimer la catégorie{" "}
              <strong className="text-purpl-black">
                {deleteConfirm.categoryName}
              </strong>{" "}
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    categoryId: null,
                    categoryName: "",
                  })
                }
                className="px-4 py-2 border-2 border-purpl-ecru rounded-lg hover:bg-purpl-ecru transition-colors text-purpl-black"
                type="button"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                type="button"
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

