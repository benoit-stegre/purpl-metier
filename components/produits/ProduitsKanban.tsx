"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Package, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { ProduitCard } from "./ProduitCard";
import type { ProduitKanban, CategoryProduit } from "@/types";

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
}

// Alias pour compatibilité
type Produit = ProduitKanban;
type Category = CategoryProduit;

interface ProduitsKanbanProps {
  produits: Produit[];
  categories: Category[];
  onProduitClick?: (produit: Produit) => void;
  onProduitDuplicate?: (produit: Produit) => void;
  onProduitDelete?: (produit: Produit) => void;
  onNewProduit?: () => void;
}

// Composant colonne avec flèches verticales
function KanbanColumn({
  column,
  produits,
  onProduitClick,
  onProduitDuplicate,
  onProduitDelete,
}: {
  column: { id: string; name: string; color: string };
  produits: Produit[];
  onProduitClick?: (produit: Produit) => void;
  onProduitDuplicate?: (produit: Produit) => void;
  onProduitDelete?: (produit: Produit) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopArrow, setShowTopArrow] = useState(false);
  const [showBottomArrow, setShowBottomArrow] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowTopArrow(scrollTop > 0);
    setShowBottomArrow(scrollTop < scrollHeight - clientHeight - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [produits]);

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -200, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 min-w-[260px] max-w-[320px] bg-[#EDEAE3]/50 rounded-lg flex flex-col relative">
      {/* Header colonne */}
      <div
        className="px-4 py-3 rounded-t-lg"
        style={{ backgroundColor: column.color }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-wide text-white truncate">
            {column.name.toUpperCase()}
          </h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
            {produits.length}
          </span>
        </div>
      </div>

      {/* Flèche haut */}
      {showTopArrow && (
        <button
          onClick={scrollUp}
          className="absolute left-1/2 -translate-x-1/2 top-16 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-100"
          style={{ backgroundColor: "rgba(243, 209, 182, 0.75)" }}
          aria-label="Défiler vers le haut"
        >
          <ChevronUp className="w-5 h-5" style={{ color: "#76715A" }} />
        </button>
      )}

      {/* Flèche bas */}
      {showBottomArrow && (
        <button
          onClick={scrollDown}
          className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-100"
          style={{ backgroundColor: "rgba(243, 209, 182, 0.75)" }}
          aria-label="Défiler vers le bas"
        >
          <ChevronDown className="w-5 h-5" style={{ color: "#76715A" }} />
        </button>
      )}

      {/* Liste des produits */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {produits.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm italic">
            Aucun produit
          </div>
        ) : (
          produits.map((produit) => (
            <ProduitCard
              key={produit.id}
              produit={produit}
              variant="kanban"
              onClick={() => onProduitClick?.(produit)}
              onDuplicate={() => onProduitDuplicate?.(produit)}
              onDelete={() => onProduitDelete?.(produit)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function ProduitsKanban({
  produits,
  categories,
  onProduitClick,
  onProduitDuplicate,
  onProduitDelete,
  onNewProduit,
}: ProduitsKanbanProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    produit: Produit | null;
  }>({
    open: false,
    produit: null,
  });

  // Grouper par catégorie
  const produitsByCategory = useMemo(() => {
    const grouped: Record<string, Produit[]> = {};

    // Initialiser "Sans catégorie"
    grouped["sans_categorie"] = [];

    // Initialiser toutes les catégories
    categories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    // Répartir les produits
    produits.forEach((produit) => {
      if (produit.categorie_id && grouped[produit.categorie_id]) {
        grouped[produit.categorie_id].push(produit);
      } else {
        grouped["sans_categorie"].push(produit);
      }
    });

    return grouped;
  }, [produits, categories]);

  // Colonnes à afficher
  const columnsToShow = useMemo(() => {
    const cols: { id: string; name: string; color: string }[] = [];

    categories.forEach((cat) => {
      if (produitsByCategory[cat.id]?.length > 0) {
        cols.push({
          id: cat.id,
          name: cat.name,
          color: cat.color || "#76715A",
        });
      }
    });

    // Ajouter "Sans catégorie" si nécessaire
    if (produitsByCategory["sans_categorie"]?.length > 0) {
      cols.push({
        id: "sans_categorie",
        name: "Sans catégorie",
        color: "#9CA3AF",
      });
    }

    return cols;
  }, [categories, produitsByCategory]);

  // Gestion du scroll et des flèches
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    // Centrer seulement si le contenu ne dépasse pas la largeur
    setShouldCenter(scrollWidth <= clientWidth);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [columnsToShow]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleDeleteClick = (produit: Produit) => {
    setDeleteConfirm({
      open: true,
      produit: produit,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.produit) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("produits")
        .delete()
        .eq("id", deleteConfirm.produit.id);

      if (error) throw error;

      toast.success("Produit supprimé");
      router.refresh();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ open: false, produit: null });
    }
  };

  return (
    <div className="relative">
      {/* Flèche gauche */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-100"
          style={{ backgroundColor: "rgba(243, 209, 182, 0.75)" }}
          aria-label="Défiler vers la gauche"
        >
          <ChevronLeft className="w-6 h-6" style={{ color: "#76715A" }} />
        </button>
      )}

      {/* Flèche droite */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-100"
          style={{ backgroundColor: "rgba(243, 209, 182, 0.75)" }}
          aria-label="Défiler vers la droite"
        >
          <ChevronRight className="w-6 h-6" style={{ color: "#76715A" }} />
        </button>
      )}

      {/* Colonnes Kanban */}
      <div
        ref={scrollContainerRef}
        className={`flex gap-4 overflow-x-auto pb-4 items-start scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${shouldCenter ? 'justify-center' : 'justify-start'}`}
      >
        {columnsToShow.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            produits={produitsByCategory[column.id] || []}
            onProduitClick={onProduitClick}
            onProduitDuplicate={onProduitDuplicate}
            onProduitDelete={handleDeleteClick}
          />
        ))}

        {/* Message si aucune colonne */}
        {columnsToShow.length === 0 && (
          <div className="flex-1 text-center py-12 text-gray-400">
            <Package className="w-6 h-6 mx-auto mb-4 opacity-50" />
            <p>Aucun produit à afficher</p>
          </div>
        )}
      </div>

      {/* Popup confirmation suppression produit */}
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
    </div>
  );
}

