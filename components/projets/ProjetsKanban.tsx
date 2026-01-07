"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Calendar, Building2, Euro, GripVertical, Plus, X, FileText, ShoppingCart, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { DuplicateIcon, DeleteIcon } from "@/components/ui/Icons";
import { gererChangementStatut } from "@/lib/utils/projetPricing";
import { exportProjetDevis, exportProjetCommande } from "@/lib/exports/projetExports";
import { KanbanColumnHeader } from "./KanbanColumnHeader";
import { ProjetCard } from "./ProjetCard";
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
  total_revient?: number | null;
}

interface ProjetsKanbanProps {
  projets: ProjetKanban[];
  onProjetClick?: (projetId: string) => void;
  onStatusChange?: () => void;
  onOptimisticStatusChange?: (projetId: string, newStatut: string) => void;
  onNewProjet?: () => void;
  onDuplicate?: (projetId: string) => void;
  onDelete?: (projetId: string) => void;
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

// Couleurs PURPL pour boutons hover
const COLORS = {
  ivoire: "#FFFEF5",
  olive: "#76715A",
  rougeDoux: "#C23C3C",
};

// Statuts par défaut (fallback si BDD vide)
const DEFAULT_STATUTS: StatutProjet[] = [
  { id: "default-brouillon", nom: "brouillon", couleur: "#6B7280", ordre: 0, is_system: true, created_at: "" },
  { id: "default-en_cours", nom: "en_cours", couleur: "#3B82F6", ordre: 1, is_system: false, created_at: "" },
  { id: "default-termine", nom: "termine", couleur: "#10B981", ordre: 2, is_system: false, created_at: "" },
  { id: "default-annule", nom: "annule", couleur: "#EF4444", ordre: 3, is_system: false, created_at: "" },
];

// ============================================
// Composant carte projet draggable
// (Supprimé - utilise maintenant ProjetCard.tsx)
// ============================================

// ============================================
// Composant carte sortable (wrapper dnd-kit)
// ============================================
interface SortableProjetCardProps {
  projet: ProjetKanban;
  columnStatut?: string; // Statut de la colonne (source de vérité pour le badge)
  columnStatutColor?: string; // Couleur du statut de la colonne
  columnStatutLabel?: string; // Label du statut de la colonne
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function SortableProjetCard({ projet, columnStatut, columnStatutColor, columnStatutLabel, onClick, onDuplicate, onDelete }: SortableProjetCardProps) {
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
      duration: 250,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  } as React.CSSProperties;

  // Utiliser le statut de la colonne si fourni (source de vérité dans le Kanban), sinon projet.statut
  const statutToDisplay = columnStatut || projet.statut;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjetCard 
        projet={{
          id: projet.id,
          nom: projet.nom,
          reference: projet.reference,
          statut: statutToDisplay, // Utiliser le statut de la colonne (source de vérité)
          client_nom: projet.client_nom,
          total_ht: projet.total_ht,
          total_revient: projet.total_revient,
          date_debut: projet.date_debut,
          created_at: projet.created_at,
        }}
        variant="kanban"
        onClick={onClick} 
        isDragging={isDragging}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        statutColor={columnStatutColor} // Passer la couleur du statut de la colonne
        statutLabel={columnStatutLabel} // Passer le label du statut de la colonne
      />
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
  onDuplicate?: (projetId: string) => void;
  onDeleteProjet?: (projetId: string) => void;
}

function SortableKanbanColumn({
  statut,
  projets,
  onProjetClick,
  onRename,
  onChangeColor,
  onDelete,
  onDuplicate,
  onDeleteProjet,
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
  }, [projets]);

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
        ref={(node) => {
          setDroppableRef(node);
          scrollContainerRef.current = node;
        }}
        className={`flex-1 p-2 sm:p-3 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-280px)] transition-all duration-200 ease-out relative scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isOver ? "ring-2 ring-[#ED693A] ring-inset bg-[#EDEAE3] scale-[1.01]" : ""
        }`}
      >
        {/* Flèche haut */}
        {showTopArrow && (
          <button
            onClick={scrollUp}
            className="absolute left-1/2 -translate-x-1/2 top-2 z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-100"
            style={{ backgroundColor: "rgba(243, 209, 182, 0.75)" }}
            aria-label="Défiler vers le haut"
            type="button"
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
            type="button"
          >
            <ChevronDown className="w-5 h-5" style={{ color: "#76715A" }} />
          </button>
        )}

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
                columnStatut={statut.nom} // Passer le statut de la colonne (source de vérité pour le badge)
                columnStatutColor={statut.couleur} // Passer la couleur du statut de la colonne
                columnStatutLabel={statut.nom.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} // Formater le nom du statut pour le label
                onClick={() => onProjetClick?.(projet.id)}
                onDuplicate={() => onDuplicate?.(projet.id)}
                onDelete={() => onDeleteProjet?.(projet.id)}
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
  onDuplicate,
  onDelete,
}: ProjetsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"projet" | "column" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [columns, setColumns] = useState<StatutProjet[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(true);
  const [showNewStatusModal, setShowNewStatusModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);

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
        // 1. Mettre à jour le statut du projet EN PREMIER (priorité métier)
        const { error } = await supabase
          .from("projets")
          .update({ statut: targetColumn, updated_at: new Date().toISOString() })
          .eq("id", activeProjetId);

        if (error) throw error;

        const targetLabel = columns.find((c) => c.nom === targetColumn)?.nom.replace(/_/g, " ").toUpperCase() || targetColumn;
        toast.success(`Projet déplacé vers "${targetLabel}"`);

        // 2. Gérer le figement/défigement des prix APRÈS (best-effort, non-bloquant)
        try {
          const figementResult = await gererChangementStatut(
            activeProjetId,
            currentColumn || "brouillon",
            targetColumn
          );

          if (!figementResult.success) {
            console.warn("Avertissement figement prix:", figementResult.error);
            toast.error("Attention : les prix n'ont pas pu être figés/défigés");
          }
        } catch (figementError) {
          console.warn("Erreur figement prix (non-bloquant):", figementError);
        }

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
    if (!container || !isMounted) return;

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [columns, isMounted]);

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
          <div
            ref={scrollContainerRef}
            className={`flex gap-3 sm:gap-4 overflow-x-auto pb-4 items-start scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${shouldCenter ? 'justify-center' : 'justify-start'}`}
          >
            {columns.map((statut) => (
              <SortableKanbanColumn
                key={statut.id}
                statut={statut}
                projets={projetsByStatus[statut.nom] || []}
                onProjetClick={onProjetClick}
                onRename={handleRenameColumn}
                onChangeColor={handleChangeColor}
                onDelete={handleDeleteColumn}
                onDuplicate={onDuplicate}
                onDeleteProjet={onDelete}
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
            <ProjetCard 
              projet={{
                id: activeProjet.id,
                nom: activeProjet.nom,
                reference: activeProjet.reference,
                statut: activeProjet.statut,
                client_nom: activeProjet.client_nom,
                total_ht: activeProjet.total_ht,
                total_revient: activeProjet.total_revient,
                date_debut: activeProjet.date_debut,
                created_at: activeProjet.created_at,
              }}
              variant="kanban"
              isDragging={true}
            />
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
