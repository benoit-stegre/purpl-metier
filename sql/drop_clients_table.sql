-- ================================================
-- Suppression de l'ancienne table "clients"
-- Migration vers "clients_pro" terminée
-- À exécuter dans Supabase > SQL Editor
-- ================================================

-- 1. Vérifier s'il reste des données dans clients
SELECT 'Données dans clients:' as info, COUNT(*) as nb FROM clients;

-- 2. Vérifier les clés étrangères pointant vers clients
SELECT 
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
AND ccu.table_name = 'clients';

-- 3. Si aucune dépendance, supprimer la table
-- ⚠️ DÉCOMMENTER APRÈS VÉRIFICATION
-- DROP TABLE IF EXISTS clients CASCADE;

-- 4. Vérifier la suppression
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'clients';





