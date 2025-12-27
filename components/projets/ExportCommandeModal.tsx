"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { X, Download, Check } from "lucide-react";
import { exportProjetCommande } from "@/lib/exports/projetExports";

// Types
interface CategorieComposant {
  id: string;
  name: string;
  color: string | null;
}

interface ExportCommandeModalProps {
  projetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportCommandeModal({
  projetId,
  isOpen,
  onClose,
}: ExportCommandeModalProps) {
  const [categories, setCategories] = useState<CategorieComposant[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Charger les catégories de composants au mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories_composants")
        .select("id, name, color")
        .order("name");

      if (error) throw error;

      if (data) {
        setCategories(data);
        // Par défaut, toutes les catégories sont sélectionnées
        setSelectedCategories(new Set(data.map((c) => c.id)));
        setAllSelected(true);
      }
    } catch (error) {
      console.error("Erreur chargement catégories:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer le toggle "Toutes les catégories"
  const handleToggleAll = () => {
    if (allSelected) {
      // Décocher tout
      setSelectedCategories(new Set());
      setAllSelected(false);
    } else {
      // Cocher tout
      setSelectedCategories(new Set(categories.map((c) => c.id)));
      setAllSelected(true);
    }
  };

  // Gérer le toggle d'une catégorie individuelle
  const handleToggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories);

    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }

    setSelectedCategories(newSelected);
    // Mettre à jour l'état "Toutes"
    setAllSelected(newSelected.size === categories.length);
  };

  // Exporter le bon de commande
  const handleExport = async () => {
    if (selectedCategories.size === 0) {
      toast.error("Veuillez sélectionner au moins une catégorie");
      return;
    }

    setIsExporting(true);

    try {
      // Pour l'instant, on exporte toutes les catégories
      // TODO: Modifier exportProjetCommande pour accepter un filtre
      const result = await exportProjetCommande(
        projetId,
        allSelected ? undefined : Array.from(selectedCategories)
      );

      if (result.success) {
        toast.success("Bon de commande exporté avec succès");
        onClose();
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export du bon de commande");
    } finally {
      setIsExporting(false);
    }
  };

  // Ne pas afficher si fermé
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        style={{ backgroundColor: "#FFFEF5" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#2F2F2E]">
            Exporter bon de commande
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#76715A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez les catégories de composants à inclure dans le bon de commande :
              </p>

              {/* Checkbox "Toutes les catégories" */}
              <label
                className="flex items-center gap-3 p-3 rounded-lg bg-white border-2 border-[#76715A]/20 hover:border-[#76715A]/40 transition-colors cursor-pointer mb-3"
                onClick={handleToggleAll}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                    allSelected
                      ? "bg-[#76715A] border-[#76715A]"
                      : "bg-white border-2 border-gray-300"
                  }`}
                >
                  {allSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="font-medium text-[#2F2F2E]">
                  Toutes les catégories
                </span>
                <span className="ml-auto text-sm text-gray-500">
                  ({categories.length})
                </span>
              </label>

              {/* Séparateur */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  ou sélectionnez
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Liste des catégories */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 italic">
                    Aucune catégorie de composants
                  </p>
                ) : (
                  categories.map((category) => {
                    const isSelected = selectedCategories.has(category.id);

                    return (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                        onClick={() => handleToggleCategory(category.id)}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-2"
                              : "bg-white border-2 border-gray-300"
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? category.color || "#76715A"
                              : "white",
                            borderColor: isSelected
                              ? category.color || "#76715A"
                              : undefined,
                          }}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* Badge couleur catégorie */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color || "#76715A" }}
                        />

                        <span className="text-[#2F2F2E]">{category.name}</span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Résumé sélection */}
              {selectedCategories.size > 0 && !allSelected && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  {selectedCategories.size} catégorie{selectedCategories.size > 1 ? "s" : ""} sélectionnée{selectedCategories.size > 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-white/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedCategories.size === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            style={{ backgroundColor: "#ED693A" }}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

