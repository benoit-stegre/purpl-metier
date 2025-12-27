This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 📋 CONVENTIONS - PURPL Métier

## 🗄️ BASE DE DONNÉES - NOMS COLONNES

### ⚠️ RÈGLE ABSOLUE

**La BDD Supabase utilise des noms ANGLAIS.**
**Le code TypeScript DOIT utiliser ces noms ANGLAIS.**

### ❌ INTERDIT
```typescript
produit.nom           // JAMAIS
produit.actif         // JAMAIS
composant.nom         // JAMAIS
client.raison_sociale // OK (exception française)
```

### ✅ OBLIGATOIRE
```typescript
produit.name          // TOUJOURS
produit.is_active     // TOUJOURS
composant.name        // TOUJOURS
composant.prix_vente  // TOUJOURS
```

### 🔍 Mapping Français → Anglais

| ❌ Français | ✅ Anglais | Type |
|------------|-----------|------|
| `nom` | `name` | Tous |
| `actif` | `is_active` | Tous |
| `date_creation` | `created_at` | Tous |
| `date_maj` | `updated_at` | Tous |

**Exceptions :** Certains champs métier restent en français (raison_sociale, siret, etc.)

### 🔍 En cas de doute

1. **Vérifier** `types/database.types.ts`
2. **Chercher** la définition du type dans ce fichier
3. **Utiliser** exactement le nom de propriété qui y figure

### 🚨 Si erreur TypeScript "Property does not exist"

**Exemple d'erreur :**
```
Property 'nom' does not exist on type 'Produit'
```

**Solution :**
1. Ouvre `types/database.types.ts`
2. Cherche `Tables['produits']`
3. Utilise le nom exact de la propriété (probablement `name`)

---

## 🎨 CHARTE GRAPHIQUE

### Couleurs PURPL
```css
--purpl-green: #76715A    /* Vert principal */
--purpl-orange: #ED693A   /* Orange accent */
--purpl-ecru: #EDEAE3     /* Écru - fonds */
--purpl-sable: #D9D4C8    /* Sable - borders */
--purpl-black: #000000    /* Noir - texte */
```

### Usage
- **Boutons principaux:** `bg-purpl-green hover:bg-purpl-orange`
- **Boutons CTA:** `bg-purpl-orange hover:bg-purpl-orange/90`
- **Zones calculées:** `bg-purpl-ecru`
- **Borders:** `border-purpl-sable`

---

## 🧩 COMPOSANTS

### Pattern Modal Standard
- Overlay cliquable (`handleOverlayClick`)
- Header avec CloseIcon
- Form avec validation
- 3 boutons : Annuler | Continuer | Enregistrer
- Popup confirmation si changements non sauvegardés

### Icônes (components/ui/Icons.tsx)
- Toutes en SVG stroke-based
- Tailles : w-4/5/6 (petit/moyen/grand)
- Transitions hover obligatoires

---

## 📝 TYPESCRIPT

### Règles strictes
- ❌ Jamais de `any`
- ✅ Types explicites partout
- ✅ Imports depuis `types/database.types.ts`
- ✅ Null-safe avec `?.` et `??`

### Convention nommage
- **Fichiers composants:** PascalCase (`ProduitModal.tsx`)
- **Variables:** camelCase (`prixVente`, `isLoading`)
- **Constantes:** SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types:** PascalCase (`Produit`, `Database`)

---

**Dernière mise à jour :** 21 décembre 2025