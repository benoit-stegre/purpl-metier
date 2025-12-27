-- Vérification et création de la colonne categorie_id dans produits
-- À exécuter dans Supabase > SQL Editor

-- ============================================
-- 1. VÉRIFIER SI LA COLONNE EXISTE
-- ============================================

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'produits' 
  AND column_name = 'categorie_id';

-- ============================================
-- 2. CRÉER LA COLONNE SI ELLE N'EXISTE PAS
-- ============================================

-- Si la colonne n'existe pas, exécuter cette commande:
-- ALTER TABLE produits 
-- ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories_produits(id);

-- ============================================
-- 3. VÉRIFIER LES CONTRAINTES FOREIGN KEY
-- ============================================

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'produits'
  AND kcu.column_name = 'categorie_id';

-- ============================================
-- 4. VÉRIFIER LES DONNÉES EXISTANTES
-- ============================================

-- Voir les produits avec leurs catégories
SELECT 
  p.id,
  p.name,
  p.categorie_id,
  cp.name as categorie_name,
  cp.color as categorie_color
FROM produits p
LEFT JOIN categories_produits cp ON p.categorie_id = cp.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- 5. VÉRIFIER LES INDEX
-- ============================================

-- Vérifier s'il y a un index sur categorie_id (pour performance)
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'produits'
  AND indexdef LIKE '%categorie_id%';

-- Si pas d'index, créer un index pour améliorer les performances:
-- CREATE INDEX IF NOT EXISTS idx_produits_categorie_id ON produits(categorie_id);




