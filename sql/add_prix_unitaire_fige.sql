-- ============================================
-- Ajout de la colonne prix_unitaire_fige
-- Table: projets_produits
-- ============================================
-- 
-- Contexte:
-- - Quand un projet est en "brouillon" → prix dynamiques (recalculés)
-- - Quand un projet passe à "en_cours", "termine" ou "annule" → prix figés
-- - Cette colonne stocke le prix_vente_total du produit au moment du figement
--
-- À exécuter dans Supabase > SQL Editor

-- Ajout de la colonne (NULL = prix dynamique, valeur = prix figé)
ALTER TABLE projets_produits 
ADD COLUMN IF NOT EXISTS prix_unitaire_fige NUMERIC;

-- Commentaire sur la colonne pour documentation
COMMENT ON COLUMN projets_produits.prix_unitaire_fige IS 
'Prix unitaire figé du produit. NULL = prix dynamique (recalculé), valeur = prix historique préservé lors du passage en_cours/termine/annule';





