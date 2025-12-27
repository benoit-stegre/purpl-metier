-- Correction des couleurs des catégories clients selon charte PURPL
-- À exécuter dans Supabase > SQL Editor

-- Mettre à jour les couleurs des catégories clients selon charte PURPL

UPDATE categories_clients 
SET color = '#99B8E1'  -- Bleu sérénité
WHERE name = 'Public';

UPDATE categories_clients 
SET color = '#76715A'  -- Vert principal
WHERE name = 'Bailleur';

UPDATE categories_clients 
SET color = '#ED693A'  -- Orange chaud
WHERE name = 'ETP';

UPDATE categories_clients 
SET color = '#FCE789'  -- Jaune joie
WHERE name = 'Particulier';

-- Vérifier les résultats
SELECT id, name, color 
FROM categories_clients 
ORDER BY name;




