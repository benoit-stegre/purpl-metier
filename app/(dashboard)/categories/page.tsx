import { Suspense } from "react";
import { CategoriesManager } from "@/components/categories/CategoriesManager";

export const metadata = {
  title: "Catégories - PURPL Métier",
  description: "Gestion des catégories",
};

export default function CategoriesPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Suspense fallback={<div>Chargement...</div>}>
        <CategoriesManager />
      </Suspense>
    </div>
  );
}

