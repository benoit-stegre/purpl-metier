-- =====================================================
-- TABLE : user_roles
-- Description : Gestion sécurisée des rôles utilisateurs
-- =====================================================

-- Créer la table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activer Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs authentifiés peuvent voir leur propre rôle
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy : Seules les routes API admin (service_role) peuvent modifier les rôles
-- Les utilisateurs normaux ne peuvent PAS modifier leur propre rôle

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Insérer le rôle admin pour l'utilisateur principal
-- IMPORTANT : Remplacer 'benoit@purplsolutions.com' par votre email si différent
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'benoit@purplsolutions.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Ajouter un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
