"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NavLink } from "@/components/navigation/NavLink";
import { UserInfo } from "@/components/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/composants", label: "Composants" },
  { href: "/produits", label: "Produits" },
  { href: "/clients", label: "Clients" },
  { href: "/projets", label: "Projets" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-purpl-ecru">
      {/* Header Navigation - Fixed */}
      <header className="bg-purpl-green text-white sticky top-0 z-50 shadow-md">
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">{children}</main>
    </div>
  );
}


