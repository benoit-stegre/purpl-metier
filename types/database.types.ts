export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories_clients: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories_composants: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories_produits: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories_projets: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clients_pro: {
        Row: {
          adresse_ligne1: string | null
          adresse_ligne2: string | null
          categorie_id: string | null
          code_postal: string | null
          contact_email: string | null
          contact_nom: string | null
          contact_prenom: string | null
          contact_telephone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          num_tva: string | null
          pays: string | null
          raison_sociale: string
          siret: string | null
          updated_at: string | null
          ville: string | null
        }
        Insert: {
          adresse_ligne1?: string | null
          adresse_ligne2?: string | null
          categorie_id?: string | null
          code_postal?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_prenom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          num_tva?: string | null
          pays?: string | null
          raison_sociale: string
          siret?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Update: {
          adresse_ligne1?: string | null
          adresse_ligne2?: string | null
          categorie_id?: string | null
          code_postal?: string | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_prenom?: string | null
          contact_telephone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          num_tva?: string | null
          pays?: string | null
          raison_sociale?: string
          siret?: string | null
          updated_at?: string | null
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_pro_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      composants: {
        Row: {
          categorie_id: string | null
          created_at: string | null
          hauteur: number | null
          id: string
          is_active: boolean | null
          largeur: number | null
          marge_pourcent: number
          name: string
          notes: string | null
          photo_url: string | null
          poids: number | null
          prix_achat: number
          prix_vente: number | null
          profondeur: number | null
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string | null
          hauteur?: number | null
          id?: string
          is_active?: boolean | null
          largeur?: number | null
          marge_pourcent?: number
          name: string
          notes?: string | null
          photo_url?: string | null
          poids?: number | null
          prix_achat: number
          prix_vente?: number | null
          profondeur?: number | null
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          categorie_id?: string | null
          created_at?: string | null
          hauteur?: number | null
          id?: string
          is_active?: boolean | null
          largeur?: number | null
          marge_pourcent?: number
          name?: string
          notes?: string | null
          photo_url?: string | null
          poids?: number | null
          prix_achat?: number
          prix_vente?: number | null
          profondeur?: number | null
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "composants_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_composants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      produits: {
        Row: {
          categorie_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          nombre_heures: number | null
          photo_url: string | null
          prix_heure: number | null
          prix_vente_total: number | null
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nombre_heures?: number | null
          photo_url?: string | null
          prix_heure?: number | null
          prix_vente_total?: number | null
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nombre_heures?: number | null
          photo_url?: string | null
          prix_heure?: number | null
          prix_vente_total?: number | null
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_produits"
            referencedColumns: ["id"]
          },
        ]
      }
      produits_composants: {
        Row: {
          composant_id: string
          created_at: string | null
          id: string
          produit_id: string
          quantite: number
        }
        Insert: {
          composant_id: string
          created_at?: string | null
          id?: string
          produit_id: string
          quantite?: number
        }
        Update: {
          composant_id?: string
          created_at?: string | null
          id?: string
          produit_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "produits_composants_composant_id_fkey"
            columns: ["composant_id"]
            isOneToOne: false
            referencedRelation: "composants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_composants_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produits_composants_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_details"
            referencedColumns: ["id"]
          },
        ]
      }
      projets: {
        Row: {
          budget: number | null
          categorie_id: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          date_debut: string | null
          date_fin: string | null
          description: string | null
          id: string
          is_active: boolean | null
          nom: string
          notes: string | null
          photo_url: string | null
          reference: string | null
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          categorie_id?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nom: string
          notes?: string | null
          photo_url?: string | null
          reference?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          categorie_id?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          date_debut?: string | null
          date_fin?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          nom?: string
          notes?: string | null
          photo_url?: string | null
          reference?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projets_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_projets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_pro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "vue_projets_details"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "projets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      projets_produits: {
        Row: {
          created_at: string | null
          id: string
          prix_unitaire_fige: number | null
          produit_id: string
          projet_id: string
          quantite: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          prix_unitaire_fige?: number | null
          produit_id: string
          projet_id: string
          quantite?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          prix_unitaire_fige?: number | null
          produit_id?: string
          projet_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "projets_produits_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projets_produits_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "vue_produits_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projets_produits_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projets_produits_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "vue_projets_details"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vue_produits_details: {
        Row: {
          categorie_name: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          nb_composants: number | null
          photo_url: string | null
          prix_vente_total: number | null
          reference: string | null
        }
        Relationships: []
      }
      vue_projets_details: {
        Row: {
          client_id: string | null
          client_nom: string | null
          created_at: string | null
          id: string | null
          nb_produits_differents: number | null
          nom: string | null
          quantite_totale: number | null
          reference: string | null
          statut: string | null
          total_ht: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ============================================
// Types personnalisés (hors génération Supabase)
// ============================================

/**
 * Statut de projet pour les colonnes Kanban
 * Table: statuts_projet
 */
export interface StatutProjet {
  id: string;
  nom: string;
  couleur: string;
  ordre: number;
  is_system: boolean;
  created_at: string;
}