"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { SearchIcon, UserIcon } from "@/components/ui/Icons";
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

interface Contact {
  id: string;
  client_id: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [contactsByClient, setContactsByClient] = useState<Record<string, Contact[]>>({});

  const handleSuccess = () => {
    router.refresh();
    setEditingClient(null);
    // Recharger les contacts après modification
    loadAllContacts();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
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
    loadAllContacts();
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
      }
    } catch (error) {
      console.error("Erreur fetch catégories:", error);
    }
  };

  const loadAllContacts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at");

      if (error) throw error;

      if (data) {
        // Grouper les contacts par client_id
        const grouped: Record<string, Contact[]> = {};
        data.forEach((contact) => {
          if (!grouped[contact.client_id]) {
            grouped[contact.client_id] = [];
          }
          grouped[contact.client_id].push(contact);
        });
        setContactsByClient(grouped);
      }
    } catch (error) {
      console.error("Erreur fetch contacts:", error);
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
          client.contact_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        // Recherche dans les contacts
        (contactsByClient[client.id]?.some((contact) =>
          (contact.prenom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.telephone || "").toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // Filtre catégorie
      const matchesCategory =
        selectedCategory === "all" ||
        client.categorie_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialClients, searchTerm, selectedCategory, contactsByClient]);

  const getClientContacts = (clientId: string): Contact[] => {
    return contactsByClient[clientId] || [];
  };

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-1.5">
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
        {filteredClients.map((client) => {
          const contacts = getClientContacts(client.id);
          const primaryContact = contacts.length > 0 ? contacts[0] : null;

          return (
            <div
              key={client.id}
              onClick={() => handleEdit(client)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Icône utilisateur */}
              <div className="mb-3">
                <div className="w-12 h-12 bg-purpl-green/10 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-purpl-green" />
                </div>
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

              {/* Contact principal */}
              {primaryContact && (
                <div className="mt-2 space-y-1">
                  {(primaryContact.prenom || primaryContact.nom) && (
                    <p className="text-sm text-gray-600">
                      {[primaryContact.prenom, primaryContact.nom].filter(Boolean).join(" ")}
                    </p>
                  )}
                  {primaryContact.email && (
                    <p className="text-sm text-gray-600 truncate">
                      {primaryContact.email}
                    </p>
                  )}
                  {primaryContact.telephone && (
                    <p className="text-sm text-gray-500">
                      {primaryContact.telephone}
                    </p>
                  )}
                  {contacts.length > 1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      +{contacts.length - 1} autre{contacts.length > 2 ? "s" : ""} contact{contacts.length > 2 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Fallback sur anciens champs si pas de contacts */}
              {!primaryContact && (client.contact_prenom || client.contact_nom) && (
                <p className="text-sm text-gray-600 mt-2">
                  {[client.contact_prenom, client.contact_nom].filter(Boolean).join(" ")}
                </p>
              )}

              {!primaryContact && client.contact_email && (
                <p className="text-sm text-gray-600 truncate mb-2">
                  {client.contact_email}
                </p>
              )}

              {/* Localisation */}
              {(client.ville || client.pays) && (
                <p className="text-sm text-gray-500 mb-1">
                  {client.ville && `${client.ville}, `}
                  {client.pays}
                </p>
              )}

              {/* Date */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-400">
                  {client.created_at && new Date(client.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          );
        })}
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

    </>
  );
}
