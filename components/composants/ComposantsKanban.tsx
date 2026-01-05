"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Euro, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { WeightIcon } from "@/components/ui/Icons";
import type { Composant, CategoryComposant } from "@/types";

// Alias pour compatibilité
type Category = CategoryComposant;

interface ComposantsKanbanProps {
  composants: Composant[];
  categories: Category[];
  onComposantClick?: (composant: Composant) => void;
  onNewComposant?: () => void;
}

// Composant colonne avec flèches verticales
function KanbanColumn({
  column,
  composants,
  onComposantClick,
}: {
  column: { id: string; name: string; color: string };
  composants: Composant[];
  onComposantClick?: (composant: Composant) => void;
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
  }, [composants]);

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
            {composants.length}
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

      {/* Liste des composants */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {composants.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm italic">
            Aucun composant
          </div>
        ) : (
          composants.map((composant) => (
            <KanbanComposantCard
              key={composant.id}
              composant={composant}
              onClick={() => onComposantClick?.(composant)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Carte composant pour le Kanban
function KanbanComposantCard({
  composant,
  onClick,
}: {
  composant: Composant;
  onClick?: () => void;
}) {
  const formattedPrixVente = composant.prix_vente
    ? composant.prix_vente.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      })
    : "0,00 €";

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
        {composant.photo_url ? (
          <img
            src={composant.photo_url}
            alt={composant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {/* Nom */}
      <h3 className="font-semibold text-[#2F2F2E] text-sm truncate">
        {composant.name}
      </h3>

      {/* Référence */}
      {composant.reference && (
        <p className="text-xs text-gray-500 truncate">
          Réf: {composant.reference}
        </p>
      )}

      {/* Prix + Poids */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-sm font-medium text-[#76715A]">
          <Euro className="w-4 h-4" />
          <span>{formattedPrixVente}</span>
        </div>
        {composant.poids && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <WeightIcon className="w-4 h-4" />
            <span>{composant.poids}</span>
          </div>
        )}
      </div>

    </div>
  );
}

export function ComposantsKanban({
  composants,
  categories,
  onComposantClick,
  onNewComposant,
}: ComposantsKanbanProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);

  // Grouper par catégorie
  const composantsByCategory = useMemo(() => {
    const grouped: Record<string, Composant[]> = {};

    // Initialiser "Sans catégorie"
    grouped["sans_categorie"] = [];

    // Initialiser toutes les catégories
    categories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    // Répartir les composants
    composants.forEach((composant) => {
      if (composant.categorie_id && grouped[composant.categorie_id]) {
        grouped[composant.categorie_id].push(composant);
      } else {
        grouped["sans_categorie"].push(composant);
      }
    });

    return grouped;
  }, [composants, categories]);

  // Colonnes à afficher (catégories avec au moins 1 composant + "Sans catégorie" si nécessaire)
  const columnsToShow = useMemo(() => {
    const cols: { id: string; name: string; color: string }[] = [];

    categories.forEach((cat) => {
      if (composantsByCategory[cat.id]?.length > 0) {
        cols.push({
          id: cat.id,
          name: cat.name,
          color: cat.color || "#76715A",
        });
      }
    });

    // Ajouter "Sans catégorie" si nécessaire
    if (composantsByCategory["sans_categorie"]?.length > 0) {
      cols.push({
        id: "sans_categorie",
        name: "Sans catégorie",
        color: "#9CA3AF",
      });
    }

    return cols;
  }, [categories, composantsByCategory]);

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
            composants={composantsByCategory[column.id] || []}
            onComposantClick={onComposantClick}
          />
        ))}

        {/* Message si aucune colonne */}
        {columnsToShow.length === 0 && (
          <div className="flex-1 text-center py-12 text-gray-400">
            <Package className="w-6 h-6 mx-auto mb-4 opacity-50" />
            <p>Aucun composant à afficher</p>
          </div>
        )}
      </div>
    </div>
  );
}

