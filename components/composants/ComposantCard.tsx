"use client";

import Image from "next/image";
import { EditIcon, DuplicateIcon, DeleteIcon, ToolIcon, WeightIcon } from "@/components/ui/Icons";
import type { Database } from "@/types/database.types";

type Composant = Database["public"]["Tables"]["composants"]["Row"] & {
  categorie: Database["public"]["Tables"]["categories_composants"]["Row"] | null;
};

interface ComposantCardProps {
  composant: Composant;
  onEdit: (composant: Composant) => void;
  onDelete: (composant: Composant) => void;
}

export function ComposantCard({ composant, onEdit, onDelete }: ComposantCardProps) {
  // Calcul du prix de vente si nécessaire (déjà calculé en BDD normalement)
  const prixVente = composant.prix_vente || composant.prix_achat * (1 + composant.marge_pourcent / 100);

  // Handler pour le clic sur la card
  const handleCardClick = () => {
    onEdit(composant);
  };

  // Handler pour empêcher propagation sur les boutons
  const handleButtonClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation(); // Empêche l'ouverture de la fiche

    if (action === "edit") {
      onEdit(composant);
    } else if (action === "delete") {
      onDelete(composant);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image ou icône */}
      <div className="h-48 bg-purpl-ecru flex items-center justify-center relative">
        {composant.photo_url ? (
          <Image
            src={composant.photo_url}
            alt={composant.name}
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />
        ) : (
          <ToolIcon className="w-6 h-6 text-purpl-green" />
        )}

      </div>

      <div className="p-4">
        {/* Nom */}
        <h3 className="font-semibold text-lg text-purpl-black mb-1">
          {composant.name}
        </h3>

        {/* Badge catégorie */}
        {composant.categorie && (
          <div className="mt-2">
            <span
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
              style={
                (composant.categorie as any).color
                  ? {
                      backgroundColor: `${(composant.categorie as any).color}15`,
                      color: (composant.categorie as any).color,
                      border: `1px solid ${(composant.categorie as any).color}30`,
                    }
                  : {
                      backgroundColor: "#76715A15",
                      color: "#76715A",
                      border: "1px solid #76715A30",
                    }
              }
            >
              {composant.categorie.name}
            </span>
          </div>
        )}

        {/* Référence */}
        {composant.reference && (
          <p className="text-sm text-purpl-green mb-3">
            Réf: {composant.reference}
          </p>
        )}

        {/* Caractéristiques physiques */}
        {(composant.poids || composant.largeur || composant.hauteur || composant.profondeur) && (
          <div className="text-xs text-purpl-green mb-3 flex items-center gap-2 flex-wrap">
            {composant.poids && (
              <div className="flex items-center gap-1">
                <WeightIcon className="w-4 h-4" />
                <span>{composant.poids}</span>
              </div>
            )}
            {(composant.largeur || composant.hauteur || composant.profondeur) && (
              <div className="flex items-center gap-1">
                <span>|</span>
                {composant.largeur && <span>{composant.largeur}cm</span>}
                {composant.hauteur && <span> × {composant.hauteur}cm</span>}
                {composant.profondeur && <span> × {composant.profondeur}cm</span>}
              </div>
            )}
          </div>
        )}

        {/* Prix */}
        <div className="flex justify-between items-center pt-3 border-t border-purpl-ecru">
          <div>
            <p className="text-xs text-purpl-green">Prix achat</p>
            <p className="text-sm text-purpl-black">
              {composant.prix_achat.toFixed(2)} €
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-purpl-green">Marge {composant.marge_pourcent}%</p>
            <p className="text-lg font-semibold text-purpl-orange">
              {prixVente.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* Actions - Avec stopPropagation */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={(e) => handleButtonClick(e, "edit")}
            className="p-2 hover:bg-purpl-ecru rounded-md transition-colors group"
            title="Modifier"
          >
            <EditIcon className="w-5 h-5 text-purpl-green group-hover:text-purpl-orange transition-colors" />
          </button>
          <button
            onClick={(e) => handleButtonClick(e, "duplicate")}
            className="p-2 hover:bg-purpl-ecru rounded-md transition-colors group"
            title="Dupliquer"
          >
            <DuplicateIcon className="w-5 h-5 text-purpl-green group-hover:text-purpl-orange transition-colors" />
          </button>
          <button
            onClick={(e) => handleButtonClick(e, "delete")}
            className="p-2 hover:bg-red-100 rounded-md transition-colors group"
            title="Supprimer"
          >
            <DeleteIcon className="w-5 h-5 text-purpl-green group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

