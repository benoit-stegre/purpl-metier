-- ============================================
-- Mise à jour de la vue vue_projets_details
-- Prise en compte du prix_unitaire_fige
-- ============================================
--
-- Logique :
-- - Si prix_unitaire_fige est défini → utiliser ce prix (historique figé)
-- - Sinon → utiliser le prix_vente_total du produit (dynamique)
--
-- À exécuter dans Supabase > SQL Editor

-- Supprimer la vue existante (nécessaire car les colonnes changent)
DROP VIEW IF EXISTS vue_projets_details;

-- Recréer la vue avec la nouvelle logique
CREATE VIEW vue_projets_details AS
SELECT 
  p.id,
  p.nom,
  p.reference,
  p.statut,
  p.client_id,
  c.raison_sociale AS client_nom,
  p.created_at,
  -- Nombre de produits différents
  COUNT(DISTINCT pp.produit_id) AS nb_produits_differents,
  -- Quantité totale
  COALESCE(SUM(pp.quantite), 0) AS quantite_totale,
  -- Total HT : utilise le prix figé si disponible, sinon le prix actuel du produit
  COALESCE(
    SUM(
      pp.quantite * COALESCE(pp.prix_unitaire_fige, prod.prix_vente_total)
    ), 
    0
  ) AS total_ht
FROM projets p
LEFT JOIN clients_pro c ON p.client_id = c.id
LEFT JOIN projets_produits pp ON p.id = pp.projet_id
LEFT JOIN produits prod ON pp.produit_id = prod.id
WHERE p.is_active = true
GROUP BY p.id, p.nom, p.reference, p.statut, p.client_id, c.raison_sociale, p.created_at;

-- Commentaire sur la vue
COMMENT ON VIEW vue_projets_details IS 
'Vue détaillée des projets avec calcul du total_ht utilisant le prix figé si disponible';

