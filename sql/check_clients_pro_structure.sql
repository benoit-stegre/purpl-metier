-- Vérifier la structure de la table clients_pro
-- À exécuter dans Supabase > SQL Editor

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clients_pro'
ORDER BY ordinal_position;






