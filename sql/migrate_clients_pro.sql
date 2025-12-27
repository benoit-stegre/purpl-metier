-- ================================================
-- Migration clients_pro : Ajout categorie_id + siret optionnel
-- Exécuté le 2025-12-25
-- ================================================

-- 1. Rendre siret optionnel (supprimer contrainte NOT NULL)
ALTER TABLE clients_pro 
ALTER COLUMN siret DROP NOT NULL;

-- 2. Ajouter la colonne categorie_id avec référence vers categories_clients
ALTER TABLE clients_pro 
ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories_clients(id);

-- 3. Vérifier le résultat
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clients_pro'
ORDER BY ordinal_position;



