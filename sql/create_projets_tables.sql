-- Création des tables pour les projets
-- À exécuter dans Supabase > SQL Editor

-- ============================================
-- 1. TABLE categories_projets
-- ============================================

CREATE TABLE IF NOT EXISTS categories_projets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#76715A',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_projets_updated_at
  BEFORE UPDATE ON categories_projets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_categories_projets_slug ON categories_projets(slug);

-- Désactiver RLS (comme les autres categories_*)
ALTER TABLE categories_projets DISABLE ROW LEVEL SECURITY;

-- Données initiales
INSERT INTO categories_projets (name, slug, color) VALUES
  ('Aménagement urbain', 'amenagement-urbain', '#76715A'),
  ('Mobilier public', 'mobilier-public', '#ED693A'),
  ('Signalétique', 'signaletique', '#99B8E1'),
  ('Aires de jeux', 'aires-de-jeux', '#FCE789')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. TABLE projets
-- ============================================

CREATE TABLE IF NOT EXISTS projets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  reference TEXT,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'en_cours', -- 'draft' | 'en_cours' | 'termine' | 'annule'
  date_debut DATE,
  date_fin DATE,
  budget DECIMAL(10, 2),
  photo_url TEXT,
  categorie_id UUID REFERENCES categories_projets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER update_projets_updated_at
  BEFORE UPDATE ON projets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_projets_client ON projets(client_id);
CREATE INDEX IF NOT EXISTS idx_projets_categorie ON projets(categorie_id);
CREATE INDEX IF NOT EXISTS idx_projets_status ON projets(status);
CREATE INDEX IF NOT EXISTS idx_projets_active ON projets(is_active);

-- RLS Policies
ALTER TABLE projets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all projets"
ON projets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert projets"
ON projets FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projets"
ON projets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projets"
ON projets FOR DELETE
TO authenticated
USING (true);



