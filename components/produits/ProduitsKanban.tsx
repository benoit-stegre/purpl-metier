"use client";

import { useState, useMemo } from "react";
import { Package, Euro, Plus } from "lucide-react";
import { WeightIcon } from "@/components/ui/Icons";

// Types
interface Produit {
  id: string;
  name: string;
  reference: string | null;
  photo_url: string | null;
  prix_vente_total: number | null;
  is_active: boolean | null;
  categorie_id: string | null;
  categories_produits: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  produits_composants?: Array<{
    id: string;
    quantite: number;
    composant: {
      id: string;
      name: string;
      reference: string | null;
      prix_vente: number;
      photo_url: string | null;
      poids: number | null;
    } | null;
  }>;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface ProduitsKanbanProps {
  produits: Produit[];
  categories: Category[];
  onProduitClick?: (produit: Produit) => void;
  onNewProduit?: () => void;
}

// Carte produit pour le Kanban
function KanbanProduitCard({
  produit,
  onClick,
}: {
  produit: Produit;
  onClick?: () => void;
}) {
  const formattedPrix = produit.prix_vente_total
    ? produit.prix_vente_total.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      })
    : "0,00 €";

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
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer
        hover:shadow-md hover:border-[#76715A]/30 transition-all duration-200
        ${!produit.is_active ? "opacity-60" : ""}`}
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
          <Euro className="w-4 h-4" />
          <span>{formattedPrix}</span>
        </div>
      </div>

      {/* Badge archivé */}
      {!produit.is_active && (
        <div className="mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            Archivé
          </span>
        </div>
      )}
    </div>
  );
}

export function ProduitsKanban({
  produits,
  categories,
  onProduitClick,
  onNewProduit,
}: ProduitsKanbanProps) {
  const [showArchived, setShowArchived] = useState(false);

  // Filtrer les produits (actifs seulement par défaut)
  const filteredProduits = useMemo(() => {
    if (showArchived) return produits;
    return produits.filter((p) => p.is_active !== false);
  }, [produits, showArchived]);

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
    filteredProduits.forEach((produit) => {
      if (produit.categorie_id && grouped[produit.categorie_id]) {
        grouped[produit.categorie_id].push(produit);
      } else {
        grouped["sans_categorie"].push(produit);
      }
    });

    return grouped;
  }, [filteredProduits, categories]);

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

        {onNewProduit && (
          <button
            onClick={onNewProduit}
            className="flex items-center gap-2 px-4 py-2 bg-[#ED693A] text-white rounded-lg hover:bg-[#d85a2a] transition-colors font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nouveau produit
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
                  {produitsByCategory[column.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Liste des produits */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {produitsByCategory[column.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm italic">
                  Aucun produit
                </div>
              ) : (
                produitsByCategory[column.id]?.map((produit) => (
                  <KanbanProduitCard
                    key={produit.id}
                    produit={produit}
                    onClick={() => onProduitClick?.(produit)}
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
            <p>Aucun produit à afficher</p>
          </div>
        )}
      </div>
    </div>
  );
}

