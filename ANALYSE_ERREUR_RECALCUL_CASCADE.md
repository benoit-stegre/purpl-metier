# Analyse - Erreurs 400 sur Table `produits` lors de la modification d'un composant

## 🔍 Problème Identifié

Quand vous modifiez un composant, le code déclenche un recalcul en cascade qui tente de mettre à jour la table `produits` avec des colonnes qui **n'existent pas** dans votre base de données Supabase.

---

## 📍 Code Déclenché

### 1. Point d'entrée : `ComposantModal.tsx`

**Fichier :** `components/composants/ComposantModal.tsx`

**Lignes 308-317 :** Après la sauvegarde d'un composant modifié, si le prix_achat ou la marge a changé :

```typescript
// Recalcul cascade si prix_achat ou marge a changé
if (
  formData.prix_achat !== originalData.prix_achat ||
  formData.marge_pourcent !== originalData.marge_pourcent
) {
  // Appel asynchrone sans bloquer la sauvegarde principale
  cascadeDepuisComposant(editingComposantId).catch((err) =>
    console.error("Erreur recalcul cascade:", err)
  );
}
```

### 2. Fonction cascade : `recalculCascade.ts`

**Fichier :** `lib/utils/recalculCascade.ts`

**Fonction :** `cascadeDepuisComposant()` (lignes 13-45)
- Trouve tous les produits utilisant le composant modifié
- Pour chaque produit, appelle `recalculerProduit()` (ligne 36)

**Fonction :** `recalculerProduit()` (lignes 50-104)
- **Lignes 54-69 :** Récupère le produit avec SELECT utilisant :
  - `heures_travail` ❌
  - `tarif_horaire` ❌
- **Lignes 96-103 :** Fait un UPDATE avec :
  - `cout_composants` ❌
  - `cout_main_oeuvre` ❌
  - `prix_vente_total` ✅ (existe)

---

## ❌ Colonnes Utilisées par le Code (qui n'existent PAS)

Dans `lib/utils/recalculCascade.ts`, le code essaie d'utiliser :

1. **`heures_travail`** (ligne 58, 90)
   - ❌ N'existe pas dans votre BDD
   - ✅ Votre BDD a : `nombre_heures`

2. **`tarif_horaire`** (ligne 59, 90)
   - ❌ N'existe pas dans votre BDD
   - ✅ Votre BDD a : `prix_heure`

3. **`cout_composants`** (ligne 99)
   - ❌ N'existe pas dans votre BDD

4. **`cout_main_oeuvre`** (ligne 100)
   - ❌ N'existe pas dans votre BDD

---

## ✅ Colonnes qui EXISTENT dans votre BDD

D'après `types/database.types.ts` (lignes 291-333), votre table `produits` contient :

```typescript
produits: {
  Row: {
    id: string
    name: string
    reference: string | null
    photo_url: string | null
    categorie_id: string | null
    description: string | null
    nombre_heures: number | null        // ✅ Existe (pas heures_travail)
    prix_heure: number | null            // ✅ Existe (pas tarif_horaire)
    prix_vente_total: number | null      // ✅ Existe
    is_active: boolean | null
    created_at: string | null
    updated_at: string | null
  }
}
```

**Colonnes MANQUANTES :**
- ❌ `cout_composants` (calculé, n'existe pas)
- ❌ `cout_main_oeuvre` (calculé, n'existe pas)
- ❌ `heures_travail` (vous avez `nombre_heures`)
- ❌ `tarif_horaire` (vous avez `prix_heure`)

---

## 📋 Fichiers Concernés

1. **`lib/utils/recalculCascade.ts`** - Fichier principal qui fait les requêtes PATCH
   - Ligne 58 : SELECT `heures_travail` (devrait être `nombre_heures`)
   - Ligne 59 : SELECT `tarif_horaire` (devrait être `prix_heure`)
   - Ligne 90 : Utilise `heures_travail` et `tarif_horaire`
   - Ligne 99 : UPDATE `cout_composants` (colonne n'existe pas)
   - Ligne 100 : UPDATE `cout_main_oeuvre` (colonne n'existe pas)

2. **`components/composants/ComposantModal.tsx`** - Appelle la cascade
   - Ligne 314 : `cascadeDepuisComposant(editingComposantId)`

---

## 💡 Solutions Possibles

### Option 1 : Désactiver le recalcul cascade (TEMPORAIRE)

**Modification dans :** `components/composants/ComposantModal.tsx` (lignes 308-317)

**Action :** Commenter l'appel à `cascadeDepuisComposant()`

```typescript
// Recalcul cascade si prix_achat ou marge a changé
// TEMPORAIREMENT DÉSACTIVÉ - À corriger plus tard
/*
if (
  formData.prix_achat !== originalData.prix_achat ||
  formData.marge_pourcent !== originalData.marge_pourcent
) {
  cascadeDepuisComposant(editingComposantId).catch((err) =>
    console.error("Erreur recalcul cascade:", err)
  );
}
*/
```

**Avantages :** 
- ✅ Résout immédiatement les erreurs 400
- ✅ Permet de continuer à modifier des composants
- ⚠️ Le recalcul automatique ne fonctionnera plus

**Inconvénients :**
- ❌ Les prix des produits ne seront pas recalculés automatiquement
- ❌ Les projets brouillon ne seront pas mis à jour

---

### Option 2 : Corriger le code pour utiliser les bonnes colonnes (RECOMMANDÉ)

**Modifications nécessaires :**

#### A. Corriger les noms de colonnes dans `recalculCascade.ts`

- Remplacer `heures_travail` → `nombre_heures`
- Remplacer `tarif_horaire` → `prix_heure`
- Supprimer `cout_composants` et `cout_main_oeuvre` de l'UPDATE (ces colonnes n'existent pas)

#### B. Modifier la logique de UPDATE

Au lieu de stocker `cout_composants` et `cout_main_oeuvre`, ne mettre à jour que `prix_vente_total` :

```typescript
// Au lieu de :
await supabase
  .from("produits")
  .update({
    cout_composants: coutComposants,      // ❌ N'existe pas
    cout_main_oeuvre: coutMainOeuvre,     // ❌ N'existe pas
    prix_vente_total: prixVenteTotal,
  })

// Utiliser :
await supabase
  .from("produits")
  .update({
    prix_vente_total: prixVenteTotal,     // ✅ Existe
  })
```

**Avantages :**
- ✅ Corrige définitivement le problème
- ✅ Le recalcul fonctionne avec votre schéma actuel
- ✅ Compatible avec votre structure BDD

---

### Option 3 : Ajouter les colonnes manquantes dans Supabase

**SQL à exécuter dans Supabase :**

```sql
-- Ajouter les colonnes calculées (si vous voulez les stocker)
ALTER TABLE produits 
  ADD COLUMN IF NOT EXISTS cout_composants NUMERIC,
  ADD COLUMN IF NOT EXISTS cout_main_oeuvre NUMERIC;

-- OU renommer les colonnes existantes pour correspondre au code
ALTER TABLE produits 
  RENAME COLUMN nombre_heures TO heures_travail;
  
ALTER TABLE produits 
  RENAME COLUMN prix_heure TO tarif_horaire;
```

**⚠️ ATTENTION :** Cette option peut casser d'autres parties du code qui utilisent `nombre_heures` et `prix_heure` !

---

## 📊 Résumé - Colonnes à Corriger

| Colonne dans le Code | Colonne dans votre BDD | Action |
|---------------------|----------------------|--------|
| `heures_travail` | `nombre_heures` | Remplacer dans recalculCascade.ts |
| `tarif_horaire` | `prix_heure` | Remplacer dans recalculCascade.ts |
| `cout_composants` | ❌ N'existe pas | Supprimer de l'UPDATE |
| `cout_main_oeuvre` | ❌ N'existe pas | Supprimer de l'UPDATE |
| `prix_vente_total` | ✅ Existe | OK, garder |

---

## 🎯 Recommandation

**Option 2 (Corriger le code)** est la meilleure solution car :
1. ✅ Respecte votre schéma actuel
2. ✅ Ne nécessite pas de migration BDD
3. ✅ Corrige définitivement le problème
4. ✅ Compatible avec le reste du code qui utilise `nombre_heures` et `prix_heure`

---

## 📝 Prochaines Étapes

1. Choisir une option (recommandation : Option 2)
2. Je peux appliquer les corrections si vous voulez
3. Tester la modification d'un composant pour vérifier que les erreurs 400 ont disparu


