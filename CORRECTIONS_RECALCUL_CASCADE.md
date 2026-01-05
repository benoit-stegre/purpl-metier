# Corrections Appliquées - recalculCascade.ts

## ✅ Modifications Effectuées

### Fichier : `lib/utils/recalculCascade.ts`

### 1. Correction des noms de colonnes dans le SELECT (lignes 58-59)

**Avant :**
```typescript
.select(`
  id,
  heures_travail,      // ❌ N'existe pas
  tarif_horaire,       // ❌ N'existe pas
  ...
`)
```

**Après :**
```typescript
.select(`
  id,
  nombre_heures,       // ✅ Colonne correcte
  prix_heure,          // ✅ Colonne correcte
  ...
`)
```

### 2. Correction des variables dans le calcul (ligne 90)

**Avant :**
```typescript
const coutMainOeuvre = (produit.heures_travail || 0) * (produit.tarif_horaire || 0);
```

**Après :**
```typescript
const coutMainOeuvre = (produit.nombre_heures || 0) * (produit.prix_heure || 0);
```

### 3. Nettoyage de l'UPDATE (lignes 96-101)

**Avant :**
```typescript
await supabase
  .from("produits")
  .update({
    cout_composants: coutComposants,      // ❌ Colonne n'existe pas
    cout_main_oeuvre: coutMainOeuvre,     // ❌ Colonne n'existe pas
    prix_vente_total: prixVenteTotal,
  })
```

**Après :**
```typescript
await supabase
  .from("produits")
  .update({
    prix_vente_total: prixVenteTotal,     // ✅ Seule colonne existante
  })
```

---

## 📋 Résumé des Changements

| Élément | Avant | Après | Status |
|---------|-------|-------|--------|
| SELECT colonne heures | `heures_travail` | `nombre_heures` | ✅ Corrigé |
| SELECT colonne tarif | `tarif_horaire` | `prix_heure` | ✅ Corrigé |
| Variable calcul heures | `produit.heures_travail` | `produit.nombre_heures` | ✅ Corrigé |
| Variable calcul tarif | `produit.tarif_horaire` | `produit.prix_heure` | ✅ Corrigé |
| UPDATE colonne | `cout_composants`, `cout_main_oeuvre`, `prix_vente_total` | `prix_vente_total` uniquement | ✅ Nettoyé |

---

## ✅ Résultat

- ✅ Le code utilise maintenant les bonnes colonnes (`nombre_heures`, `prix_heure`)
- ✅ L'UPDATE ne tente plus de mettre à jour des colonnes inexistantes
- ✅ Le recalcul fonctionne avec votre schéma BDD actuel
- ✅ Aucune erreur TypeScript/ESLint
- ✅ Backup créé : `recalculCascade.ts.backup_20250129`

---

## 🧪 Test Recommandé

1. Modifier un composant (changer le prix_achat ou la marge)
2. Vérifier dans la console qu'il n'y a plus d'erreurs 400
3. Vérifier qu'un produit utilisant ce composant voit son `prix_vente_total` recalculé

---

## 📝 Note

Les variables `coutComposants` et `coutMainOeuvre` sont toujours calculées en mémoire (lignes 77-90), mais ne sont plus stockées en BDD. Seul `prix_vente_total` est mis à jour, ce qui est cohérent avec votre schéma actuel.

