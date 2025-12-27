-- ============================================
-- Fix RLS pour statuts_projet
-- Permet l'accès complet aux utilisateurs anonymes
-- (pour environnement de dev sans auth)
-- ============================================

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Statuts visibles publiquement" ON statuts_projet;
DROP POLICY IF EXISTS "Statuts visibles par tous les utilisateurs authentifiés" ON statuts_projet;
DROP POLICY IF EXISTS "Statuts modifiables par tous les utilisateurs authentifiés" ON statuts_projet;

-- Policy lecture publique
CREATE POLICY "Statuts lecture publique"
ON statuts_projet FOR SELECT
TO anon, authenticated
USING (true);

-- Policy insertion publique
CREATE POLICY "Statuts insertion publique"
ON statuts_projet FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy modification publique
CREATE POLICY "Statuts modification publique"
ON statuts_projet FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy suppression publique
CREATE POLICY "Statuts suppression publique"
ON statuts_projet FOR DELETE
TO anon, authenticated
USING (true);

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'statuts_projet';
