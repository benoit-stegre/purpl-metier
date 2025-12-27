"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package, Euro, Plus } from "lucide-react";
import { WeightIcon } from "@/components/ui/Icons";
import type { Database } from "@/types/database.types";

type Composant = Database["public"]["Tables"]["composants"]["Row"] & {
  categorie: Database["public"]["Tables"]["categories_composants"]["Row"] | null;
};

type Category = Database["public"]["Tables"]["categories_composants"]["Row"];

interface ComposantsKanbanProps {
  composants: Composant[];
  categories: Category[];
  onComposantClick?: (composant: Composant) => void;
  onNewComposant?: () => void;
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
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer
        hover:shadow-md hover:border-[#76715A]/30 transition-all duration-200
        ${!composant.is_active ? "opacity-60" : ""}`}
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

      {/* Badge archivé */}
      {!composant.is_active && (
        <div className="mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            Archivé
          </span>
        </div>
      )}
    </div>
  );
}

export function ComposantsKanban({
  composants,
  categories,
  onComposantClick,
  onNewComposant,
}: ComposantsKanbanProps) {
  const [showArchived, setShowArchived] = useState(false);

  // Filtrer les composants (actifs seulement par défaut)
  const filteredComposants = useMemo(() => {
    if (showArchived) return composants;
    return composants.filter((c) => c.is_active !== false);
  }, [composants, showArchived]);

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
    filteredComposants.forEach((composant) => {
      if (composant.categorie_id && grouped[composant.categorie_id]) {
        grouped[composant.categorie_id].push(composant);
      } else {
        grouped["sans_categorie"].push(composant);
      }
    });

    return grouped;
  }, [filteredComposants, categories]);

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

  return (
    <div className="relative">
      {/* Header avec bouton nouveau + toggle archivés */}
      <div className="flex justify-between items-center mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-[#76715A] focus:ring-[#76715A]"
          />
          Afficher les archivés
        </label>

        {onNewComposant && (
          <button
            onClick={onNewComposant}
            className="flex items-center gap-2 px-4 py-2 bg-[#ED693A] text-white rounded-lg hover:bg-[#d85a2a] transition-colors font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nouveau composant
          </button>
        )}
      </div>

      {/* Colonnes Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columnsToShow.map((column) => (
          <div
            key={column.id}
            className="flex-1 min-w-[260px] max-w-[320px] bg-[#EDEAE3]/50 rounded-lg flex flex-col"
          >
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
                  {composantsByCategory[column.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Liste des composants */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {composantsByCategory[column.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm italic">
                  Aucun composant
                </div>
              ) : (
                composantsByCategory[column.id]?.map((composant) => (
                  <KanbanComposantCard
                    key={composant.id}
                    composant={composant}
                    onClick={() => onComposantClick?.(composant)}
                  />
                ))
              )}
            </div>
          </div>
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

