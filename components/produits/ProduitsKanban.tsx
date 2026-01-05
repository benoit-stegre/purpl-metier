"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Package, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { WeightIcon } from "@/components/ui/Icons";
import type { ProduitKanban, CategoryProduit } from "@/types";

// Alias pour compatibilité
type Produit = ProduitKanban;
type Category = CategoryProduit;

interface ProduitsKanbanProps {
  produits: Produit[];
  categories: Category[];
  onProduitClick?: (produit: Produit) => void;
  onNewProduit?: () => void;
}

// Composant colonne avec flèches verticales
function KanbanColumn({
  column,
  produits,
  onProduitClick,
}: {
  column: { id: string; name: string; color: string };
  produits: Produit[];
  onProduitClick?: (produit: Produit) => void;
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
            <KanbanProduitCard
              key={produit.id}
              produit={produit}
              onClick={() => onProduitClick?.(produit)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Carte produit pour le Kanban
function KanbanProduitCard({
  produit,
  onClick,
}: {
  produit: Produit;
  onClick?: () => void;
}) {
  // Utiliser directement prix_vente_total de la BDD (calculé et sauvegardé correctement)
  const prixVenteTotal = produit.prix_vente_total ?? 0

  const formattedPrix = prixVenteTotal.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  })

  // Calcul du poids total = Σ (composant.poids × quantité)
  // Ignorer les composants sans poids (null, undefined, 0)
  const poidsTotal = produit.produits_composants?.reduce((total, pc) => {
    if (!pc.composant || !pc.composant.poids) return total;
    return total + (pc.composant.poids * pc.quantite);
  }, 0) || 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-[#76715A]/30 transition-all duration-200"
    >
      {/* Image ou placeholder */}
      <div className="w-full h-20 bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center">
        {produit.photo_url ? (
          <img
            src={produit.photo_url}
            alt={produit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-[#2F2F2E] text-sm truncate">
        {produit.name}
      </h3>

      {/* Référence */}
      {produit.reference && (
        <p className="text-xs text-gray-500 truncate">
          Réf: {produit.reference}
        </p>
      )}

      {/* Poids total */}
      {poidsTotal > 0 && (
        <div className="text-xs text-[#76715A] mt-2 flex items-center gap-1">
          <WeightIcon className="w-4 h-4" />
          <span>{poidsTotal.toFixed(2)}</span>
        </div>
      )}

      {/* Prix */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm font-medium text-[#76715A]">
          <span>{formattedPrix}</span>
        </div>
      </div>

    </div>
  );
}

export function ProduitsKanban({
  produits,
  categories,
  onProduitClick,
  onNewProduit,
}: ProduitsKanbanProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);

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
    </div>
  );
}

