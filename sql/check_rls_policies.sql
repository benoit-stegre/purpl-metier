-- Vérification et création des RLS policies pour les catégories
-- À exécuter dans Supabase > SQL Editor

-- ============================================
-- 1. VÉRIFIER LES POLICIES ACTUELLES
-- ============================================

-- Voir les policies pour categories_composants
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'categories_composants';

-- Voir les policies pour categories_produits
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'categories_produits';

-- Voir les policies pour categories_clients
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'categories_clients';

-- ============================================
-- 2. CRÉER LES POLICIES SI ELLES N'EXISTENT PAS
-- ============================================

-- Policies pour categories_composants
-- SELECT (lecture)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to select categories_composants"
ON categories_composants
FOR SELECT
TO authenticated
USING (true);

-- INSERT (création)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert categories_composants"
ON categories_composants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE (modification)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update categories_composants"
ON categories_composants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE (suppression)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete categories_composants"
ON categories_composants
FOR DELETE
TO authenticated
USING (true);

-- Policies pour categories_produits
-- SELECT (lecture)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to select categories_produits"
ON categories_produits
FOR SELECT
TO authenticated
USING (true);

-- INSERT (création)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert categories_produits"
ON categories_produits
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE (modification)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update categories_produits"
ON categories_produits
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE (suppression)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete categories_produits"
ON categories_produits
FOR DELETE
TO authenticated
USING (true);

-- Policies pour categories_clients
-- SELECT (lecture)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to select categories_clients"
ON categories_clients
FOR SELECT
TO authenticated
USING (true);

-- INSERT (création)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert categories_clients"
ON categories_clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE (modification)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update categories_clients"
ON categories_clients
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE (suppression)
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete categories_clients"
ON categories_clients
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- 3. VÉRIFIER QUE RLS EST ACTIVÉ
-- ============================================

-- Vérifier si RLS est activé pour chaque table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('categories_composants', 'categories_produits', 'categories_clients')
AND schemaname = 'public';

-- Si rowsecurity = false, activer RLS:
-- ALTER TABLE categories_composants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories_produits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories_clients ENABLE ROW LEVEL SECURITY;




