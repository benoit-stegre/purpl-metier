# Régénération des types Supabase

## Instructions

1. **Connectez-vous à Supabase** (dans un terminal interactif) :
   ```bash
   npx supabase login
   ```
   Ou si vous avez Supabase CLI installé globalement :
   ```bash
   supabase login
   ```

2. **Exécutez le script** :
   ```powershell
   powershell -ExecutionPolicy Bypass -File regenerate-types.ps1
   ```

## Alternative : Utiliser un token d'accès

Si vous avez un token d'accès Supabase, vous pouvez le définir comme variable d'environnement :

```powershell
$env:SUPABASE_ACCESS_TOKEN = "votre-token-ici"
powershell -ExecutionPolicy Bypass -File regenerate-types.ps1
```

## Ce que fait le script

1. ✅ Crée un backup du fichier actuel (`types/database.types.ts.backup`)
2. ✅ Vérifie/installe Supabase CLI (via npx si nécessaire)
3. ✅ Supprime l'ancien fichier
4. ✅ Génère les types depuis Supabase
5. ✅ Valide que le fichier contient `export interface Database`
6. ✅ Assure l'encodage UTF-8







