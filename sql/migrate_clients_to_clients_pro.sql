-- ================================================
-- Migration des données : clients → clients_pro
-- À exécuter dans Supabase > SQL Editor
-- ================================================

-- ========================================
-- ÉTAPE 1 : Diagnostic (exécuter d'abord)
-- ========================================

-- 1.1 Compter les enregistrements dans chaque table
SELECT 'clients (ancienne)' as table_name, COUNT(*) as nb FROM clients
UNION ALL
SELECT 'clients_pro (nouvelle)' as table_name, COUNT(*) as nb FROM clients_pro;

-- 1.2 Voir les données de clients à migrer
SELECT 
    id,
    name as "→ raison_sociale",
    email as "→ contact_email",
    telephone as "→ contact_telephone",
    adresse as "→ adresse_ligne1",
    ville,
    code_postal,
    pays,
    categorie_id,
    is_active
FROM clients
ORDER BY created_at DESC;

-- ========================================
-- ÉTAPE 2 : Migration (après validation)
-- ========================================

-- 2.1 Insérer les clients manquants dans clients_pro
-- (évite les doublons en vérifiant si l'ID existe déjà)

INSERT INTO clients_pro (
    id,
    raison_sociale,
    siret,
    num_tva,
    contact_nom,
    contact_prenom,
    contact_email,
    contact_telephone,
    adresse_ligne1,
    adresse_ligne2,
    ville,
    code_postal,
    pays,
    categorie_id,
    notes,
    is_active,
    created_at,
    updated_at
)
SELECT 
    c.id,
    c.name,                    -- name → raison_sociale
    NULL,                      -- siret (n'existe pas dans clients)
    NULL,                      -- num_tva (n'existe pas dans clients)
    NULL,                      -- contact_nom (n'existe pas dans clients)
    NULL,                      -- contact_prenom (n'existe pas dans clients)
    c.email,                   -- email → contact_email
    c.telephone,               -- telephone → contact_telephone
    c.adresse,                 -- adresse → adresse_ligne1
    NULL,                      -- adresse_ligne2 (n'existe pas dans clients)
    c.ville,
    c.code_postal,
    c.pays,
    c.categorie_id,
    c.notes,
    COALESCE(c.is_active, true),
    COALESCE(c.created_at, NOW()),
    COALESCE(c.updated_at, NOW())
FROM clients c
WHERE NOT EXISTS (
    SELECT 1 FROM clients_pro cp WHERE cp.id = c.id
);

-- 2.2 Vérifier le résultat
SELECT 'Après migration' as info;
SELECT 'clients_pro' as table_name, COUNT(*) as nb FROM clients_pro;

-- ========================================
-- ÉTAPE 3 : Nettoyage (après confirmation)
-- ========================================

-- 3.1 Supprimer l'ancienne table clients
-- ⚠️ DÉCOMMENTER UNIQUEMENT APRÈS AVOIR VÉRIFIÉ LA MIGRATION
-- DROP TABLE IF EXISTS clients CASCADE;

-- 3.2 Vérifier que la table est supprimée
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'clients';

-- ========================================
-- RÉSUMÉ DU MAPPING
-- ========================================
-- clients.name          → clients_pro.raison_sociale
-- clients.email         → clients_pro.contact_email
-- clients.telephone     → clients_pro.contact_telephone
-- clients.adresse       → clients_pro.adresse_ligne1
-- clients.ville         → clients_pro.ville
-- clients.code_postal   → clients_pro.code_postal
-- clients.pays          → clients_pro.pays
-- clients.categorie_id  → clients_pro.categorie_id
-- clients.notes         → clients_pro.notes
-- clients.is_active     → clients_pro.is_active
-- clients.created_at    → clients_pro.created_at
-- clients.updated_at    → clients_pro.updated_at
-- ========================================



