"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProduitsKanban } from "./ProduitsKanban";
import { ProduitCard } from "./ProduitCard";
import { ProduitModal } from "./ProduitModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { SearchIcon } from "@/components/ui/Icons";
import { AlertTriangle } from "lucide-react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import type { Produit, ProduitKanban, ComposantForProduit, CategoryProduit } from "@/types";

// Couleurs PURPL
const COLORS = {
  ivoire: "#FFFEF5",
  noir: "#2F2F2E",
  olive: "#76715A",
  rougeDoux: "#C23C3C",
}

// Alias pour compatibilité
type Composant = ComposantForProduit;
type Category = CategoryProduit;

interface ProduitsViewProps {
  initialProduits: Produit[];
  availableComposants: Composant[];
}

export function ProduitsView({
  initialProduits,
  availableComposants,
}: ProduitsViewProps) {
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
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [localProduits, setLocalProduits] = useState<Produit[]>(initialProduits);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    produit: Produit | null
  }>({
    open: false,
    produit: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Extraire les catégories des produits
  useEffect(() => {
    const cats = new Map<string, Category>();
    initialProduits.forEach((p) => {
      if (p.categories_produits) {
        cats.set(p.categories_produits.id, p.categories_produits);
      }
    });
    setCategories(Array.from(cats.values()));
  }, [initialProduits]);

  useEffect(() => {
    setLocalProduits(initialProduits);
  }, [initialProduits]);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories_produits")
        .select("*")
        .order("name");

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  const fetchProduits = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("produits")
        .select(`
          *,
          produits_composants (
            id,
            quantite,
            composant:composants (
              id,
              name,
              reference,
              prix_vente,
              photo_url,
              poids
            )
          ),
          categories_produits (
            id,
            name,
            slug,
            color
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setLocalProduits(data as Produit[]);
      }
    } catch (error) {
      console.error("Erreur fetch produits:", error);
    }
  };

  const handleSuccess = async () => {
    await fetchProduits();
    setEditingProduit(null);
    setIsModalOpen(false);
  };

  const handleEdit = (produit: Produit | ProduitKanban) => {
    // ProduitsView utilise toujours Produit complet, donc on peut caster
    setEditingProduit(produit as Produit);
    setIsModalOpen(true);
  };

  const handleDuplicate = (produit: Produit | ProduitKanban) => {
    // Pour la duplication, on ouvre le modal en mode création avec les données du produit
    const fullProduit = localProduits.find((p) => p.id === produit.id);
    if (fullProduit) {
      setEditingProduit({ ...fullProduit, id: '', name: `${fullProduit.name} (copie)` } as Produit);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (produit: Produit | ProduitKanban) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('id', produit.id);

      if (error) throw error;

      await fetchProduits();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleDeleteClick = (produit: Produit | ProduitKanban) => {
    const fullProduit = localProduits.find((p) => p.id === produit.id);
    if (fullProduit) {
      setDeleteConfirm({ open: true, produit: fullProduit });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.produit) return;
    
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('produits')
        .delete()
        .eq('id', deleteConfirm.produit.id);

      if (error) throw error;

      await fetchProduits();
      setDeleteConfirm({ open: false, produit: null });
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProduit(null);
  };

  const handleNewProduit = useCallback(() => {
    setEditingProduit(null);
    setIsModalOpen(true);
  }, []);

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Produits");
    setViewMode("kanban");
    setShowNewButton(true);
    setNewButtonLabel("Nouveau");
    setOnNewClick(() => handleNewProduit);

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
      setNewButtonLabel("Nouveau");
      setOnNewClick(null);
    };
  }, [setPageTitle, setViewMode, setShowNewButton, setNewButtonLabel, setOnNewClick, handleNewProduit]);

  // Filtrage pour la vue grille
  const filteredProduits = useMemo(() => {
    return localProduits.filter((produit) => {
      const matchesSearch =
        searchTerm === "" ||
        produit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (produit.reference &&
          produit.reference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        produit.categorie_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [localProduits, searchTerm, selectedCategory]);

  // Produits pour Kanban (format simplifié)
  const produitsForKanban = useMemo(() => {
    return localProduits.map((p) => ({
      id: p.id,
      name: p.name,
      reference: p.reference,
      photo_url: p.photo_url,
      prix_vente_total: p.prix_vente_total,
      prix_heure: p.prix_heure,
      nombre_heures: p.nombre_heures,
      is_active: p.is_active,
      categorie_id: p.categorie_id,
      categories_produits: p.categories_produits,
      produits_composants: p.produits_composants, // Ajout pour calculer le poids
    }));
  }, [localProduits]);

  return (
    <>
      {/* Vue Kanban */}
      {viewMode === "kanban" ? (
        <ProduitsKanban
          produits={produitsForKanban}
          categories={categories}
          onProduitClick={(p) => {
            const fullProduit = localProduits.find((prod) => prod.id === p.id);
            if (fullProduit) handleEdit(fullProduit);
          }}
          onProduitDuplicate={handleDuplicate}
          onProduitDelete={handleDelete}
          onNewProduit={handleNewProduit}
        />
      ) : (
        /* Vue Grille */
        <>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-1.5">
            {/* Barre de recherche */}
            <div className="w-full md:flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option disabled>────────────────</option>
              <option value="__manage__" style={{ color: "#76715A" }}>
                ⚙ Gérer les catégories...
              </option>
            </select>

          </div>

          {/* Grille */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProduits.map((produit) => (
              <ProduitCard
                key={produit.id}
                produit={produit}
                onEdit={handleEdit}
                onDuplicate={() => handleDuplicate(produit)}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>

          {filteredProduits.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Aucun produit trouvé</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <ProduitModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        editingProduit={editingProduit}
        availableComposants={availableComposants}
      />

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="produits"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}

      {/* Popup Confirmation Suppression */}
      {deleteConfirm.open && deleteConfirm.produit && (
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
              Supprimer ce produit ?
            </h3>
            <p 
              className="text-center text-sm mb-6" 
              style={{ color: COLORS.noir }}
            >
              Cette action est irréversible. Toutes les données associées seront perdues.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, produit: null })}
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
                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

