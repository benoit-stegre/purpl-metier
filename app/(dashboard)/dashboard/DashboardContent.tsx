"use client";

import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderContext";

interface Stats {
  composants: number;
  produits: number;
  clients: number;
  projets: number;
}

interface DashboardContentProps {
  stats: Stats;
}

function StatsCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-4xl font-bold text-purpl-green">{value}</p>
    </a>
  );
}

export function DashboardContent({ stats }: DashboardContentProps) {
  const {
    setPageTitle,
    setViewMode,
    setShowNewButton,
  } = usePageHeader();

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Dashboard");
    setViewMode(null); // Pas de toggle
    setShowNewButton(false); // Pas de bouton +

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
    };
  }, [setPageTitle, setViewMode, setShowNewButton]);

  return (
    <div>
      {/* Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Composants"
          value={stats.composants}
          href="/composants"
        />
        <StatsCard
          title="Produits"
          value={stats.produits}
          href="/produits"
        />
        <StatsCard
          title="Clients"
          value={stats.clients}
          href="/clients"
        />
        <StatsCard
          title="Projets"
          value={stats.projets}
          href="/projets"
        />
      </div>
    </div>
  );
}

