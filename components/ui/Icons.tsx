/**
 * Icônes PURPL MÉTIER - Wrappers Lucide React
 * 
 * Conventions :
 * - strokeWidth: 2 (défaut Lucide)
 * - strokeLinecap: round (défaut Lucide)
 * - strokeLinejoin: round (défaut Lucide)
 * - Tailles standard: w-4 h-4 (petit), w-5 h-5 (moyen), w-6 h-6 (grand)
 */

import {
  Pencil,
  Copy,
  Trash2,
  Plus,
  X,
  Search,
  Image,
  Download,
  ArrowLeft,
  Package,
  Clock,
  Building2,
  User,
  Tag,
  FolderOpen,
  Settings,
  Briefcase,
  Weight,
  Wrench,
} from "lucide-react";

// Wrapper pour garantir les props par défaut
type IconProps = {
  className?: string;
  strokeWidth?: number;
};

// Modifier/Éditer
export function EditIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Pencil className={className} strokeWidth={strokeWidth} />;
}

// Dupliquer
export function DuplicateIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Copy className={className} strokeWidth={strokeWidth} />;
}

// Supprimer
export function DeleteIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Trash2 className={className} strokeWidth={strokeWidth} />;
}

// Ajouter
export function PlusIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Plus className={className} strokeWidth={strokeWidth} />;
}

// Fermer
export function CloseIcon({ className = "w-6 h-6", strokeWidth = 2 }: IconProps) {
  return <X className={className} strokeWidth={strokeWidth} />;
}

// Recherche
export function SearchIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Search className={className} strokeWidth={strokeWidth} />;
}

// Image
export function ImageIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Image className={className} strokeWidth={strokeWidth} />;
}

// Sauvegarder/Télécharger
export function SaveIcon({ className = "w-6 h-6", strokeWidth = 2 }: IconProps) {
  return <Download className={className} strokeWidth={strokeWidth} />;
}

// Retour/Annuler
export function BackIcon({ className = "w-6 h-6", strokeWidth = 2 }: IconProps) {
  return <ArrowLeft className={className} strokeWidth={strokeWidth} />;
}

// Package/Box
export function PackageIcon({ className = "w-4 h-4", strokeWidth = 2 }: IconProps) {
  return <Package className={className} strokeWidth={strokeWidth} />;
}

// Clock/Time
export function ClockIcon({ className = "w-4 h-4", strokeWidth = 2 }: IconProps) {
  return <Clock className={className} strokeWidth={strokeWidth} />;
}

// Building/Company
export function BuildingIcon({ className = "w-6 h-6", strokeWidth = 2 }: IconProps) {
  return <Building2 className={className} strokeWidth={strokeWidth} />;
}

// User/Person
export function UserIcon({ className = "w-6 h-6", strokeWidth = 2 }: IconProps) {
  return <User className={className} strokeWidth={strokeWidth} />;
}

// Tag/Category
export function TagIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Tag className={className} strokeWidth={strokeWidth} />;
}

// Folder
export function FolderIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <FolderOpen className={className} strokeWidth={strokeWidth} />;
}

// Settings/Paramètres
export function SettingsIcon({ className = "w-4 h-4", strokeWidth = 2 }: IconProps) {
  return <Settings className={className} strokeWidth={strokeWidth} />;
}

// Briefcase/Projets
export function BriefcaseIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Briefcase className={className} strokeWidth={strokeWidth} />;
}

// Weight/Poids - Weight (poids de gym)
export function WeightIcon({ className = "w-4 h-4", strokeWidth = 2 }: IconProps) {
  return <Weight className={className} strokeWidth={strokeWidth} />;
}

// Tool/Outils
export function ToolIcon({ className = "w-5 h-5", strokeWidth = 2 }: IconProps) {
  return <Wrench className={className} strokeWidth={strokeWidth} />;
}
