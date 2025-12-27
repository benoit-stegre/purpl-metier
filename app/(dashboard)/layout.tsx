"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Home, Layout, Package, Users, FolderKanban, LucideIcon, LayoutGrid, Columns3 } from "lucide-react";
import { NavLink } from "@/components/navigation/NavLink";
import { UserInfo } from "@/components/auth";
import { PageHeaderProvider, usePageHeader } from "@/contexts/PageHeaderContext";
import { PlusIcon } from "@/components/ui/Icons";

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/composants", label: "Composants", icon: Layout },
  { href: "/produits", label: "Produits", icon: Package },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projets", label: "Projets", icon: FolderKanban },
];

function HeaderContent() {
  const {
    pageTitle,
    viewMode,
    setViewMode,
    showNewButton,
    newButtonLabel,
    onNewClick,
  } = usePageHeader();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-purpl-green text-white sticky top-0 z-50 shadow-md">
      {/* Première ligne : Logo + Navigation */}
      <div className="container mx-auto px-4 sm:px-6 pt-3 pb-3 sm:pt-4 sm:pb-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center" onClick={closeMobileMenu}>
            <Image 
              src="/logo-purpl.svg" 
              alt="PURPL" 
              width={180} 
              height={60} 
              className="h-10 sm:h-12 md:h-[60px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex gap-4 lg:gap-6 items-center">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                <span className="flex items-center gap-2">
                  {item.icon && <item.icon className="w-5 h-5" />}
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          {/* User Info & Mobile Menu Button */}
          <div className="flex items-center gap-4">
            {/* User Info (Desktop only) */}
            <div className="hidden md:block">
              <UserInfo />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={2} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-3 border-t border-white/20 pt-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink key={item.href} href={item.href} onClick={closeMobileMenu}>
                  <span className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-white/10 transition-colors">
                    {item.icon && <item.icon className="w-5 h-5" />}
                    {item.label}
                  </span>
                </NavLink>
              ))}
              {/* User Info in mobile menu */}
              <div className="pt-2 border-t border-white/20 mt-2">
                <UserInfo />
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Seconde ligne : Titre + Toggle + Bouton Nouveau */}
      {(pageTitle || viewMode !== null || showNewButton) && (
        <div className="bg-[#EDEAE3] border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Titre */}
              {pageTitle && (
                <h1 className="text-xl font-semibold" style={{ color: "#76715A" }}>
                  {pageTitle}
                </h1>
              )}

              {/* Toggle + Bouton Nouveau */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Toggle vue */}
                {viewMode !== null && (
                  <div className="flex items-center bg-[#EDEAE3] rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("kanban")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "kanban"
                          ? "bg-white text-[#76715A] shadow-sm"
                          : "text-gray-500 hover:text-[#76715A]"
                      }`}
                      title="Vue Kanban"
                    >
                      <Columns3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        viewMode === "grid"
                          ? "bg-white text-[#76715A] shadow-sm"
                          : "text-gray-500 hover:text-[#76715A]"
                      }`}
                      title="Vue Grille"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Grille</span>
                    </button>
                  </div>
                )}

                {/* Bouton Nouveau */}
                {showNewButton && onNewClick && (
                  <button
                    onClick={onNewClick}
                    className="bg-[#ED693A] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#d85a2a] transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    {newButtonLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageHeaderProvider>
      <div className="min-h-screen bg-purpl-ecru">
        <HeaderContent />

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">{children}</main>
      </div>
    </PageHeaderProvider>
  );
}

