"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { SearchIcon, DeleteIcon, UserIcon } from "@/components/ui/Icons";
import { ClientModal } from "./ClientModal";
import CategoryManagerModal from "@/components/categories/CategoryManagerModal";
import { usePageHeader } from "@/contexts/PageHeaderContext";

// Type Client basé sur clients_pro
interface Client {
  id: string;
  raison_sociale: string;
  siret: string | null;
  num_tva: string | null;
  contact_nom: string | null;
  contact_prenom: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
  adresse_ligne1: string | null;
  adresse_ligne2: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  categorie_id: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  categories_clients: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

interface ClientsGridProps {
  initialClients: Client[];
}

export function ClientsGrid({ initialClients }: ClientsGridProps) {
  const router = useRouter();
  const {
    setPageTitle,
    setViewMode,
    setShowNewButton,
    setNewButtonLabel,
    setOnNewClick,
  } = usePageHeader();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    clientId: string | null;
    clientName: string;
  }>({
    open: false,
    clientId: null,
    clientName: "",
  });

  const handleSuccess = () => {
    router.refresh();
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.clientId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients_pro")
        .update({ is_active: false }) // Soft delete
        .eq("id", deleteConfirm.clientId);

      if (error) throw error;

      router.refresh();
      setDeleteConfirm({ open: false, clientId: null, clientName: "" });
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteClick = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({
      open: true,
      clientId: client.id,
      clientName: client.raison_sociale,
    });
  };

  const handleNewClient = useCallback(() => {
    setEditingClient(null);
    setIsModalOpen(true);
  }, []);

  // Configuration du header via le Context
  useEffect(() => {
    setPageTitle("Clients");
    setViewMode(null); // Pas de toggle Kanban/Grille
    setShowNewButton(true);
    setNewButtonLabel("Nouveau client");
    setOnNewClick(() => handleNewClient);

    // Cleanup : réinitialiser le header quand on quitte la page
    return () => {
      setPageTitle("");
      setViewMode(null);
      setShowNewButton(false);
      setNewButtonLabel("Nouveau");
      setOnNewClick(null);
    };
  }, [setPageTitle, setViewMode, setShowNewButton, setNewButtonLabel, setOnNewClick, handleNewClient]);

  // Fetch catégories pour les filtres
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories_clients")
        .select("*")
        .order("name");

      if (data) {
        setCategories(data);
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  // Filtrage côté client
  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // Filtre recherche
      const matchesSearch =
        searchTerm === "" ||
        client.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contact_email &&
          client.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.ville &&
          client.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.siret &&
          client.siret.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.contact_nom &&
          client.contact_nom.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtre catégorie
      const matchesCategory =
        selectedCategory === "all" ||
        client.categorie_id === selectedCategory;

      // Filtre statut
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = client.is_active === true;
      } else if (statusFilter === "archived") {
        matchesStatus = client.is_active === false;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialClients, searchTerm, selectedCategory, statusFilter]);

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Barre de recherche */}
        <div className="w-full md:flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white"
          />
        </div>

        {/* Dropdown catégories */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "__manage__") {
              setShowCategoryManager(true);
              return;
            }
            setSelectedCategory(value);
          }}
          className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
          <option disabled>────────────────</option>
          <option value="__manage__" style={{ color: "#76715A" }}>
            ⚙ Gérer les catégories...
          </option>
        </select>

        {/* Dropdown statut */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purpl-green bg-white cursor-pointer"
        >
          <option value="all">Tous les clients</option>
          <option value="active">Actifs uniquement</option>
          <option value="archived">Archivés uniquement</option>
        </select>
      </div>

      {/* Compteur résultats */}
      {filteredClients.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {filteredClients.length} client{filteredClients.length > 1 ? "s" : ""}
          {selectedCategory !== "all" && " dans cette catégorie"}
        </div>
      )}

      {/* Grille de clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => handleEdit(client)}
            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${!client.is_active ? 'opacity-60' : ''}`}
          >
            {/* Icône utilisateur + Bouton suppression */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purpl-green/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-purpl-green" />
              </div>
              <button
                onClick={(e) => handleDeleteClick(client, e)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                type="button"
              >
                <DeleteIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Raison sociale */}
            <h3 className="font-semibold text-gray-900 mb-1">{client.raison_sociale}</h3>

            {/* Badge catégorie */}
            {client.categories_clients && (
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
                  style={{
                    backgroundColor: `${client.categories_clients.color || "#76715A"}15`,
                    color: client.categories_clients.color || "#76715A",
                    border: `1px solid ${client.categories_clients.color || "#76715A"}30`,
                  }}
                >
                  {client.categories_clients.name}
                </span>
              </div>
            )}

            {/* Contact */}
            {(client.contact_prenom || client.contact_nom) && (
              <p className="text-sm text-gray-600 mt-2">
                {[client.contact_prenom, client.contact_nom].filter(Boolean).join(" ")}
              </p>
            )}

            {/* Localisation */}
            {(client.ville || client.pays) && (
              <p className="text-sm text-gray-500 mb-1">
                {client.ville && `${client.ville}, `}
                {client.pays}
              </p>
            )}

            {/* Email */}
            {client.contact_email && (
              <p className="text-sm text-gray-600 truncate mb-2">
                {client.contact_email}
              </p>
            )}

            {/* Badge Archivé + Date */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              {!client.is_active && (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  Archivé
                </span>
              )}
              <span className={`text-xs text-gray-400 ${client.is_active ? '' : 'ml-auto'}`}>
                {client.created_at && new Date(client.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Message si aucun résultat */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12 text-purpl-green">
          <p className="text-lg">Aucun client trouvé</p>
        </div>
      )}

      {/* Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        client={editingClient}
      />

      {/* Modal gestion catégories */}
      {showCategoryManager && (
        <CategoryManagerModal
          type="clients"
          onClose={() => setShowCategoryManager(false)}
          onUpdate={fetchCategories}
        />
      )}

      {/* Popup Confirmation Suppression */}
      {deleteConfirm.open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() =>
            setDeleteConfirm({ open: false, clientId: null, clientName: "" })
          }
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-purpl-black mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-purpl-green mb-6">
              Êtes-vous sûr de vouloir supprimer le client{" "}
              <strong className="text-purpl-black">{deleteConfirm.clientName}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteConfirm({ open: false, clientId: null, clientName: "" })
                }
                className="px-4 py-2 border-2 border-purpl-ecru rounded-lg hover:bg-purpl-ecru transition-colors text-purpl-black"
                type="button"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                type="button"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
