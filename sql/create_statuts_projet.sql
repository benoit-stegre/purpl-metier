-- ============================================
-- Table statuts_projet
-- Gestion des colonnes Kanban pour les projets
-- ============================================

-- Création de la table
CREATE TABLE statuts_projet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL UNIQUE,
  couleur TEXT NOT NULL DEFAULT '#6B7280',
  ordre INTEGER NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour tri par ordre
CREATE INDEX idx_statuts_projet_ordre ON statuts_projet(ordre);

-- Données initiales
-- Note: brouillon est is_system=true car protégé (logique prix figés)
INSERT INTO statuts_projet (nom, couleur, ordre, is_system) VALUES
  ('brouillon', '#6B7280', 0, true),
  ('en_cours', '#3B82F6', 1, false),
  ('termine', '#10B981', 2, false),
  ('annule', '#EF4444', 3, false);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE statuts_projet ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Statuts visibles par tous les utilisateurs authentifiés"
ON statuts_projet FOR SELECT
TO authenticated
USING (true);

-- Modification pour tous les utilisateurs authentifiés
CREATE POLICY "Statuts modifiables par tous les utilisateurs authentifiés"
ON statuts_projet FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);





