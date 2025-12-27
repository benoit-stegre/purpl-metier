"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Calendar, Building2, Euro, GripVertical, Plus, X, FileText, ShoppingCart } from "lucide-react";
import { gererChangementStatut } from "@/lib/utils/projetPricing";
import { exportProjetDevis, exportProjetCommande } from "@/lib/exports/projetExports";
import { KanbanColumnHeader } from "./KanbanColumnHeader";
import type { StatutProjet } from "@/types/database.types";

// Types
interface ProjetKanban {
  id: string;
  nom: string;
  reference: string | null;
  statut: string | null;
  date_debut: string | null;
  created_at: string | null;
  client_id: string | null;
  client_nom: string | null;
  total_ht: number | null;
}

interface ProjetsKanbanProps {
  projets: ProjetKanban[];
  onProjetClick?: (projetId: string) => void;
  onStatusChange?: () => void;
  onOptimisticStatusChange?: (projetId: string, newStatut: string) => void;
  onNewProjet?: () => void;
}

// Couleurs disponibles pour les nouvelles colonnes (charte PURPL)
const COLUMN_COLORS = [
  "#76715A", // Vert PURPL - Principal
  "#ED693A", // Orange chaud - CTA
  "#E77E55", // Orange doux - Accent
  "#D6CCAF", // Sable - Secondaire
  "#C6846C", // Rouge beige - Tertiaire
  "#2F2F2E", // Noir PURPL - Texte
];

// Statuts par défaut (fallback si BDD vide)
const DEFAULT_STATUTS: StatutProjet[] = [
  { id: "default-brouillon", nom: "brouillon", couleur: "#6B7280", ordre: 0, is_system: true, created_at: "" },
  { id: "default-en_cours", nom: "en_cours", couleur: "#3B82F6", ordre: 1, is_system: false, created_at: "" },
  { id: "default-termine", nom: "termine", couleur: "#10B981", ordre: 2, is_system: false, created_at: "" },
  { id: "default-annule", nom: "annule", couleur: "#EF4444", ordre: 3, is_system: false, created_at: "" },
];

// ============================================
// Composant carte projet draggable
// ============================================
interface ProjetCardProps {
  projet: ProjetKanban;
  onClick?: () => void;
  isDragging?: boolean;
}

function ProjetCard({ projet, onClick, isDragging }: ProjetCardProps) {
  const [isExporting, setIsExporting] = useState<"devis" | "commande" | null>(null);

  const formattedDate = projet.date_debut
    ? new Date(projet.date_debut).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : projet.created_at
    ? new Date(projet.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const formattedTotal = projet.total_ht
    ? projet.total_ht.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      })
    : "0,00 €";

  // Handler export devis
  const handleExportDevis = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche l'ouverture du modal
    setIsExporting("devis");
    
    const result = await exportProjetDevis(projet.id);
    
    if (result.success) {
      toast.success("Devis exporté avec succès");
    } else {
      toast.error(result.error || "Erreur lors de l'export");
    }
    
    setIsExporting(null);
  };

  // Handler export commande
  const handleExportCommande = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche l'ouverture du modal
    setIsExporting("commande");
    
    const result = await exportProjetCommande(projet.id);
    
    if (result.success) {
      toast.success("Bon de commande exporté");
    } else {
      toast.error(result.error || "Erreur lors de l'export");
    }
    
    setIsExporting(null);
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 sm:p-4 cursor-pointer
        hover:shadow-md hover:border-[#76715A]/30 
        transition-all duration-200 ease-out
        ${isDragging ? "shadow-2xl ring-2 ring-[#ED693A] scale-[1.02]" : ""}
      `}
    >
      {/* Header avec grip */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          {/* Nom du projet */}
          <h3 className="font-semibold text-[#2F2F2E] truncate text-sm">
            {projet.nom}
          </h3>
          {projet.reference && (
            <p className="text-xs text-gray-500 truncate">
              Réf: {projet.reference}
            </p>
          )}
        </div>
      </div>

      {/* Client */}
      {projet.client_nom && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-600">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{projet.client_nom}</span>
        </div>
      )}

      {/* Footer : Total HT + Date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Total HT */}
        <div className="flex items-center gap-1 text-sm font-medium text-[#76715A]">
          <Euro className="w-4 h-4" />
          <span>{formattedTotal}</span>
        </div>

        {/* Date */}
        {formattedDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Boutons export */}
      <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleExportDevis}
          disabled={isExporting !== null}
          className="flex-1 flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 text-xs font-medium text-[#76715A] bg-[#EDEAE3] rounded-md hover:bg-[#D6CCAF] transition-colors disabled:opacity-50"
          title="Télécharger le devis"
        >
          {isExporting === "devis" ? (
            <div className="w-3 h-3 border-2 border-[#76715A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span className="hidden sm:inline">Devis</span>
        </button>
        <button
          onClick={handleExportCommande}
          disabled={isExporting !== null}
          className="flex-1 flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1.5 text-xs font-medium text-white bg-[#ED693A] rounded-md hover:bg-[#d85a2a] transition-colors disabled:opacity-50"
          title="Télécharger le bon de commande"
        >
          {isExporting === "commande" ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span className="hidden sm:inline">Commande</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Composant carte sortable (wrapper dnd-kit)
// ============================================
interface SortableProjetCardProps {
  projet: ProjetKanban;
  onClick?: () => void;
}

function SortableProjetCard({ projet, onClick }: SortableProjetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: projet.id,
    transition: {
      duration: 250, // ms
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // easeOutQuart pour fluidité
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjetCard projet={projet} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

// ============================================
// Composant colonne Kanban sortable
// ============================================
interface SortableKanbanColumnProps {
  statut: StatutProjet;
  projets: ProjetKanban[];
  onProjetClick?: (projetId: string) => void;
  onRename: (id: string, newName: string) => void;
  onChangeColor: (id: string, newColor: string) => void;
  onDelete: (id: string) => void;
}

function SortableKanbanColumn({
  statut,
  projets,
  onProjetClick,
  onRename,
  onChangeColor,
  onDelete,
}: SortableKanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${statut.id}`,
    disabled: statut.is_system, // Brouillon non draggable
  });

  // Rendre la colonne droppable pour recevoir des cartes
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: statut.nom, // On utilise le nom pour matcher avec projets.statut
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      {...attributes}
      className={`flex-1 min-w-[260px] sm:min-w-[280px] max-w-[350px] bg-[#EDEAE3]/50 rounded-lg flex flex-col transition-all ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      {/* Header avec menu contextuel */}
      <KanbanColumnHeader
        statut={statut}
        projetCount={projets.length}
        onRename={onRename}
        onChangeColor={onChangeColor}
        onDelete={onDelete}
        dragHandleProps={statut.is_system ? undefined : listeners}
      />

      {/* Zone droppable pour les projets */}
      <div
        ref={setDroppableRef}
        className={`flex-1 p-2 sm:p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-280px)] transition-all duration-200 ease-out ${
          isOver ? "ring-2 ring-[#ED693A] ring-inset bg-[#EDEAE3] scale-[1.01]" : ""
        }`}
      >
        <SortableContext
          items={projets.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projets.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic">
              Glisser un projet ici
            </div>
          ) : (
            projets.map((projet) => (
              <SortableProjetCard
                key={projet.id}
                projet={projet}
                onClick={() => onProjetClick?.(projet.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ============================================
// Modal pour ajouter un nouveau statut
// ============================================
interface NewStatusModalProps {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
  isLoading: boolean;
}

function NewStatusModal({ onClose, onAdd, isLoading }: NewStatusModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLUMN_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Le nom du statut est requis");
      return;
    }
    onAdd(trimmedName, selectedColor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#2F2F2E]">
            Nouveau statut
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input nom */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du statut
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: En attente, Validé..."
              autoFocus
              disabled={isLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#76715A] focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Sélection couleur */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 disabled:opacity-50 ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-[#2F2F2E] scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#ED693A] text-white rounded-lg hover:bg-[#d85a2a] transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ajout...
                </>
              ) : (
                "Ajouter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Composant principal ProjetsKanban
// ============================================
export function ProjetsKanban({
  projets,
  onProjetClick,
  onStatusChange,
  onOptimisticStatusChange,
  onNewProjet,
}: ProjetsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"projet" | "column" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [columns, setColumns] = useState<StatutProjet[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [showNewStatusModal, setShowNewStatusModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createClient();

  // Fetch des statuts depuis la BDD
  const fetchStatuts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("statuts_projet")
        .select("*")
        .order("ordre");

      if (error) throw error;

      if (data && data.length > 0) {
        setColumns(data as StatutProjet[]);
      } else {
        // Fallback sur les statuts par défaut
        setColumns(DEFAULT_STATUTS);
      }
    } catch (error) {
      console.error("Erreur chargement statuts:", error);
      // Utiliser les statuts par défaut en cas d'erreur
      setColumns(DEFAULT_STATUTS);
    } finally {
      setIsLoadingColumns(false);
    }
  }, [supabase]);

  // Éviter les erreurs d'hydratation SSR avec dnd-kit
  useEffect(() => {
    setIsMounted(true);
    fetchStatuts();
  }, [fetchStatuts]);

  // Configurer les sensors pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Démarrage rapide mais évite clics accidentels
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Grouper les projets par statut (en utilisant le nom du statut)
  const projetsByStatus = useMemo(() => {
    const grouped: Record<string, ProjetKanban[]> = {};

    // Initialiser toutes les colonnes
    columns.forEach((col) => {
      grouped[col.nom] = [];
    });

    // Répartir les projets
    projets.forEach((projet) => {
      const statut = projet.statut || "brouillon";
      if (grouped[statut]) {
        grouped[statut].push(projet);
      } else {
        // Fallback si statut inconnu → brouillon
        grouped["brouillon"]?.push(projet);
      }
    });

    return grouped;
  }, [projets, columns]);

  // Trouver le projet actuellement draggé
  const activeProjet = useMemo(() => {
    if (!activeId || activeType !== "projet") return null;
    return projets.find((p) => p.id === activeId) || null;
  }, [activeId, activeType, projets]);

  // Trouver la colonne actuellement draggée
  const activeColumn = useMemo(() => {
    if (!activeId || activeType !== "column") return null;
    const columnId = activeId.replace("column-", "");
    return columns.find((c) => c.id === columnId) || null;
  }, [activeId, activeType, columns]);

  // Trouver dans quelle colonne est un projet
  const findColumn = (projetId: string): string | null => {
    for (const [status, list] of Object.entries(projetsByStatus)) {
      if (list.some((p) => p.id === projetId)) {
        return status;
      }
    }
    return null;
  };

  // Handler début du drag
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    
    // Déterminer si on drag une colonne ou un projet
    if (id.startsWith("column-")) {
      setActiveType("column");
    } else {
      setActiveType("projet");
    }
  };

  // Handler fin du drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Cas 1 : Drag d'une colonne
    if (activeIdStr.startsWith("column-")) {
      const activeColumnId = activeIdStr.replace("column-", "");
      const overColumnId = overIdStr.replace("column-", "");

      if (activeColumnId === overColumnId) return;

      // Trouver les index
      const oldIndex = columns.findIndex((c) => c.id === activeColumnId);
      const newIndex = columns.findIndex((c) => c.id === overColumnId);

      if (oldIndex === -1 || newIndex === -1) return;

      // Réordonner localement
      const newColumns = arrayMove(columns, oldIndex, newIndex);
      setColumns(newColumns);

      // Mettre à jour les ordres en BDD
      await handleReorderColumns(newColumns);
      return;
    }

    // Cas 2 : Drag d'un projet
    const activeProjetId = activeIdStr;

    // Déterminer la colonne cible
    let targetColumn: string | null = null;

    // Si on drop sur une colonne (son id correspond à un nom de statut)
    if (columns.some((col) => col.nom === overIdStr)) {
      targetColumn = overIdStr;
    } else if (overIdStr.startsWith("column-")) {
      // On a droppé sur le header d'une colonne
      const columnId = overIdStr.replace("column-", "");
      const col = columns.find((c) => c.id === columnId);
      if (col) targetColumn = col.nom;
    } else {
      // Sinon, on a droppé sur un autre projet, trouver sa colonne
      targetColumn = findColumn(overIdStr);
    }

    if (!targetColumn) return;

    // Vérifier si le statut a changé
    const currentColumn = findColumn(activeProjetId);
    if (currentColumn === targetColumn) return;

    // ✨ MISE À JOUR OPTIMISTE : Mettre à jour l'UI immédiatement
    onOptimisticStatusChange?.(activeProjetId, targetColumn);

    // Mettre à jour la BDD en arrière-plan (sans bloquer l'UI)
    (async () => {
      try {
        // 1. Gérer le figement/défigement des prix AVANT le changement de statut
        const figementResult = await gererChangementStatut(
          activeProjetId,
          currentColumn || "brouillon",
          targetColumn
        );

        if (!figementResult.success) {
          throw new Error(figementResult.error || "Erreur lors du figement des prix");
        }

        // 2. Mettre à jour le statut du projet
        const { error } = await supabase
          .from("projets")
          .update({ statut: targetColumn, updated_at: new Date().toISOString() })
          .eq("id", activeProjetId);

        if (error) throw error;

        const targetLabel = columns.find((c) => c.nom === targetColumn)?.nom.replace(/_/g, " ").toUpperCase() || targetColumn;
        toast.success(`Projet déplacé vers "${targetLabel}"`);

        // Soft refresh pour synchroniser les données serveur
        onStatusChange?.();
      } catch (error: unknown) {
        console.error("Erreur mise à jour statut:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut";
        toast.error(errorMessage);
        
        // 🔄 ROLLBACK : Revenir à l'état précédent en cas d'erreur
        onOptimisticStatusChange?.(activeProjetId, currentColumn || "brouillon");
      }
    })();
  };

  // Handler réordonner les colonnes
  const handleReorderColumns = async (newColumns: StatutProjet[]) => {
    setIsUpdating(true);

    try {
      // Mettre à jour l'ordre de chaque colonne
      const updates = newColumns.map((col, index) => ({
        id: col.id,
        ordre: index,
      }));

      // Batch update (on update chaque colonne individuellement car Supabase ne supporte pas le batch update facilement)
      for (const update of updates) {
        // Ne pas mettre à jour les colonnes par défaut (fallback)
        if (update.id.startsWith("default-")) continue;

        const { error } = await supabase
          .from("statuts_projet")
          .update({ ordre: update.ordre })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("Colonnes réorganisées");
    } catch (error) {
      console.error("Erreur réorganisation colonnes:", error);
      toast.error("Erreur lors de la réorganisation");
      // Refetch pour restaurer l'état
      fetchStatuts();
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler renommer une colonne
  const handleRenameColumn = async (id: string, newName: string) => {
    // Ne pas modifier les colonnes par défaut
    if (id.startsWith("default-")) {
      toast.error("Impossible de modifier ce statut (mode fallback)");
      return;
    }

    setIsUpdating(true);

    try {
      // Générer le nouveau nom (slug)
      const newNom = newName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      // Vérifier si le nom existe déjà
      const existing = columns.find((c) => c.nom === newNom && c.id !== id);
      if (existing) {
        toast.error("Ce nom de statut existe déjà");
        return;
      }

      const oldColumn = columns.find((c) => c.id === id);
      if (!oldColumn) return;

      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from("statuts_projet")
        .update({ nom: newNom })
        .eq("id", id);

      if (updateError) throw updateError;

      // Mettre à jour tous les projets qui avaient l'ancien statut
      const { error: projetsError } = await supabase
        .from("projets")
        .update({ statut: newNom })
        .eq("statut", oldColumn.nom);

      if (projetsError) throw projetsError;

      // Mettre à jour le state local
      setColumns((prev) =>
        prev.map((col) => (col.id === id ? { ...col, nom: newNom } : col))
      );

      toast.success(`Statut renommé en "${newName}"`);
      onStatusChange?.();
    } catch (error) {
      console.error("Erreur renommage colonne:", error);
      toast.error("Erreur lors du renommage");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler changer la couleur d'une colonne
  const handleChangeColor = async (id: string, newColor: string) => {
    // Ne pas modifier les colonnes par défaut
    if (id.startsWith("default-")) {
      toast.error("Impossible de modifier ce statut (mode fallback)");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("statuts_projet")
        .update({ couleur: newColor })
        .eq("id", id);

      if (error) throw error;

      // Mettre à jour le state local
      setColumns((prev) =>
        prev.map((col) => (col.id === id ? { ...col, couleur: newColor } : col))
      );

      toast.success("Couleur mise à jour");
    } catch (error) {
      console.error("Erreur changement couleur:", error);
      toast.error("Erreur lors du changement de couleur");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler supprimer une colonne
  const handleDeleteColumn = async (id: string) => {
    // Ne pas supprimer les colonnes par défaut
    if (id.startsWith("default-")) {
      toast.error("Impossible de supprimer ce statut (mode fallback)");
      return;
    }

    const column = columns.find((c) => c.id === id);
    if (!column) return;

    // Vérifier que la colonne est vide
    const projetCount = projetsByStatus[column.nom]?.length || 0;
    if (projetCount > 0) {
      toast.error("Impossible de supprimer une colonne contenant des projets");
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("statuts_projet")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Mettre à jour le state local
      setColumns((prev) => prev.filter((col) => col.id !== id));

      toast.success("Statut supprimé");
    } catch (error) {
      console.error("Erreur suppression colonne:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsUpdating(false);
    }
  };

  // Ajouter un nouveau statut
  const handleAddStatus = async (name: string, color: string) => {
    setIsUpdating(true);

    try {
      // Générer le nom (slug)
      const nom = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      // Vérifier si le nom existe déjà
      if (columns.some((col) => col.nom === nom)) {
        toast.error("Ce statut existe déjà");
        return;
      }

      // Calculer le nouvel ordre
      const maxOrdre = Math.max(...columns.map((c) => c.ordre), -1);
      const newOrdre = maxOrdre + 1;

      const { data, error } = await supabase
        .from("statuts_projet")
        .insert({
          nom,
          couleur: color,
          ordre: newOrdre,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter au state local
      setColumns((prev) => [...prev, data as StatutProjet]);
      setShowNewStatusModal(false);
      toast.success(`Statut "${name}" ajouté`);
    } catch (error) {
      console.error("Erreur ajout statut:", error);
      toast.error("Erreur lors de l'ajout du statut");
    } finally {
      setIsUpdating(false);
    }
  };

  // Afficher un loader pendant l'hydratation ou le chargement
  if (!isMounted || isLoadingColumns) {
    return (
      <div className="relative">
        <div className="flex justify-end mb-4">
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4">
          {DEFAULT_STATUTS.map((col) => (
            <div key={col.id} className="flex-1 min-w-[260px] sm:min-w-[280px] max-w-[350px] bg-[#EDEAE3]/50 rounded-lg">
              <div className="px-4 py-3 rounded-t-lg" style={{ backgroundColor: col.couleur }}>
                <div className="h-5 w-24 bg-white/20 rounded animate-pulse" />
              </div>
              <div className="p-3 min-h-[200px]">
                <div className="h-24 bg-gray-200 rounded-lg animate-pulse mb-3" />
                <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isUpdating ? "opacity-70 pointer-events-none" : ""}`}>
      {/* Header avec bouton Nouveau projet */}
      <div className="flex justify-end mb-4">
        {onNewProjet && (
          <button
            onClick={onNewProjet}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#ED693A] text-white rounded-lg hover:bg-[#d85a2a] transition-colors font-medium shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Conteneur des colonnes avec SortableContext pour le drag des colonnes */}
        <SortableContext
          items={columns.map((c) => `column-${c.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 items-start">
            {columns.map((statut) => (
              <SortableKanbanColumn
                key={statut.id}
                statut={statut}
                projets={projetsByStatus[statut.nom] || []}
                onProjetClick={onProjetClick}
                onRename={handleRenameColumn}
                onChangeColor={handleChangeColor}
                onDelete={handleDeleteColumn}
              />
            ))}

            {/* Bouton ajouter nouveau statut */}
            <div className="flex-shrink-0 flex items-start pt-3">
              <button
                onClick={() => setShowNewStatusModal(true)}
                className="w-10 h-10 rounded-full bg-[#76715A] text-white flex items-center justify-center hover:bg-[#5f5a48] transition-all hover:scale-105 shadow-md"
                title="Ajouter un statut"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </SortableContext>

        {/* Overlay pendant le drag */}
        <DragOverlay>
          {activeProjet ? (
            <ProjetCard projet={activeProjet} isDragging />
          ) : activeColumn ? (
            <div
              className="min-w-[280px] max-w-[350px] rounded-lg shadow-2xl"
              style={{ backgroundColor: activeColumn.couleur }}
            >
              <div className="px-4 py-3 text-white font-bold text-sm">
                {activeColumn.nom.replace(/_/g, " ").toUpperCase()}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Loader pendant la mise à jour */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30">
          <div className="w-8 h-8 border-4 border-[#76715A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Modal nouveau statut */}
      {showNewStatusModal && (
        <NewStatusModal
          onClose={() => setShowNewStatusModal(false)}
          onAdd={handleAddStatus}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
