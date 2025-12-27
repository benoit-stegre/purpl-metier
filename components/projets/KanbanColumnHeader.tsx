"use client";

import { useState, useRef, useEffect } from "react";
import { GripVertical, MoreVertical, Pencil, Palette, Trash2, Check, X } from "lucide-react";
import type { StatutProjet } from "@/types/database.types";

// Palette couleurs PURPL (charte graphique PRD)
const PURPL_COLORS = [
  "#76715A", // Vert PURPL - Principal
  "#ED693A", // Orange chaud - CTA
  "#E77E55", // Orange doux - Accent
  "#D6CCAF", // Sable - Secondaire
  "#C6846C", // Rouge beige - Tertiaire
  "#2F2F2E", // Noir PURPL - Texte
];

interface KanbanColumnHeaderProps {
  statut: StatutProjet;
  projetCount: number;
  onRename: (id: string, newName: string) => void;
  onChangeColor: (id: string, newColor: string) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function KanbanColumnHeader({
  statut,
  projetCount,
  onRename,
  onChangeColor,
  onDelete,
  dragHandleProps,
}: KanbanColumnHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Formater le label pour l'affichage (en_cours -> En cours)
  const formatLabel = (nom: string) => {
    return nom
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowColorPicker(false);
        setShowDeleteConfirm(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Focus sur l'input quand on passe en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Initialiser editValue avec le label formaté quand on entre en édition
  const startEditing = () => {
    setEditValue(formatLabel(statut.nom));
    setIsEditing(true);
  };

  // Handler pour valider le renommage
  const handleRenameSubmit = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== statut.nom) {
      onRename(statut.id, trimmedValue);
    }
    setIsEditing(false);
    setEditValue(statut.nom);
  };

  // Handler pour annuler le renommage
  const handleRenameCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  // Handler pour la suppression
  const handleDelete = () => {
    if (projetCount === 0) {
      onDelete(statut.id);
      setShowMenu(false);
      setShowDeleteConfirm(false);
    }
  };

  // Formater le label pour l'affichage (EN MAJUSCULES)
  const displayLabel = statut.nom
    .replace(/_/g, " ")
    .toUpperCase();

  // Si c'est une colonne système (brouillon), affichage simple
  if (statut.is_system) {
    return (
      <div
        className="px-4 py-3 rounded-t-lg"
        style={{ backgroundColor: statut.couleur }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-wide text-white">
            {displayLabel}
          </h2>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white"
          >
            {projetCount}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-3 rounded-t-lg relative"
      style={{ backgroundColor: statut.couleur }}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab hover:bg-white/20 rounded p-0.5 transition-colors"
        >
          <GripVertical className="w-4 h-4 text-white/80" />
        </div>

        {/* Nom ou Input d'édition */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") handleRenameCancel();
                }}
                className="w-full px-2 py-0.5 text-sm font-bold rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleRenameSubmit}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={handleRenameCancel}
                className="p-1 rounded hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <h2 className="font-bold text-sm tracking-wide text-white truncate">
              {displayLabel}
            </h2>
          )}
        </div>

        {/* Badge count */}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
          {projetCount}
        </span>

        {/* Menu button */}
        {!isEditing && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                {/* Renommer */}
                <button
                  onClick={() => {
                    startEditing();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Renommer
                </button>

                {/* Couleur */}
                <div>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    Couleur
                    <div 
                      className="w-4 h-4 rounded-full ml-auto border border-gray-300"
                      style={{ backgroundColor: statut.couleur }}
                    />
                  </button>

                  {/* Color picker inline */}
                  {showColorPicker && (
                    <div className="px-3 py-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {PURPL_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              onChangeColor(statut.id, color);
                              setShowColorPicker(false);
                              setShowMenu(false);
                            }}
                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0 ${
                              statut.couleur === color
                                ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-200 my-1" />

                {/* Supprimer */}
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => {
                      if (projetCount === 0) {
                        setShowDeleteConfirm(true);
                      }
                    }}
                    disabled={projetCount > 0}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      projetCount > 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                    title={projetCount > 0 ? "Impossible de supprimer une colonne contenant des projets" : ""}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                    {projetCount > 0 && (
                      <span className="text-xs text-gray-400 ml-auto">
                        ({projetCount} projet{projetCount > 1 ? "s" : ""})
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-700 mb-2">
                      Supprimer cette colonne ?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

