# PRD - PURPL MÉTIER

> **Version:** 1.1 | **Date:** 2025-12-25
> **Chemin:** `C:\Users\ben\Documents\#Benoit\PURPL_METIER\purpl-metier`

---

## 1. CONTEXTE

Application interne de gestion pour PURPL Solutions (mobilier urbain personnalisable).

**Fonctionnalités principales:**
- Gérer un catalogue de **composants** (matières premières, pièces)
- Assembler des **produits** à partir de composants
- Gérer les **clients professionnels** et leurs contacts
- Créer des **projets/devis** combinant plusieurs produits
- Exporter **devis** et **bons de commande** Excel

---

## 2. STACK TECHNIQUE

| Technologie | Version | Rôle |
|-------------|---------|------|
| Next.js | 14.x | Framework React, App Router |
| React | 18.x | Interface utilisateur |
| TypeScript | 5.x | Typage statique |
| Tailwind CSS | 3.x | Styling utility-first |
| Supabase | Latest | BDD PostgreSQL + Auth + Storage |
| Lucide React | Latest | Icônes |
| xlsx (SheetJS) | Latest | Export Excel |

---

## 3. STRUCTURE DOSSIERS

```
purpl-metier/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Header navigation
│   │   ├── dashboard/page.tsx
│   │   ├── composants/page.tsx
│   │   ├── produits/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── projets/page.tsx
│   │   └── categories/page.tsx
│   └── api/
├── components/
│   ├── categories/
│   │   ├── CategoriesManager.tsx
│   │   ├── CategoryManagerModal.tsx
│   │   └── CategoryModal.tsx
│   ├── clients/
│   │   ├── ClientsGrid.tsx
│   │   └── ClientModal.tsx
│   ├── composants/
│   │   ├── ComposantsGrid.tsx
│   │   ├── ComposantCard.tsx
│   │   └── ComposantModal.tsx
│   ├── produits/
│   │   ├── ProduitsGrid.tsx
│   │   ├── ProduitCard.tsx
│   │   └── ProduitModal.tsx
│   ├── projets/
│   │   ├── ProjetsKanban.tsx
│   │   ├── ProjetCard.tsx
│   │   └── ProjetModal.tsx
│   ├── navigation/
│   │   └── NavLink.tsx
│   └── ui/
│       └── Icons.tsx
├── lib/
│   ├── constants/colors.ts
│   ├── exports/
│   │   ├── projetExports.ts
│   │   └── bonCommandeExports.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils/cn.ts
├── types/
│   └── database.types.ts
└── public/
```

---

## 4. BASE DE DONNÉES

### 4.1 Table `composants`

```sql
CREATE TABLE composants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  reference TEXT,
  photo_url TEXT,
  categorie_id UUID REFERENCES categories_composants(id),
  poids NUMERIC,                    -- kg
  largeur NUMERIC,                  -- cm
  hauteur NUMERIC,                  -- cm
  profondeur NUMERIC,               -- cm
  prix_achat NUMERIC NOT NULL,      -- € HT
  marge_pourcent NUMERIC DEFAULT 30,
  prix_vente NUMERIC,               -- CALCULÉ
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Table `produits`

```sql
CREATE TABLE produits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  reference TEXT,
  photo_url TEXT,
  categorie_id UUID REFERENCES categories_produits(id),
  description TEXT,
  prix_heure NUMERIC DEFAULT 45,
  nombre_heures NUMERIC,
  prix_vente_total NUMERIC,         -- CALCULÉ
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Table `produits_composants` (pivot)

```sql
CREATE TABLE produits_composants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  composant_id UUID NOT NULL REFERENCES composants(id) ON DELETE CASCADE,
  quantite INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 Table `clients_pro`

```sql
CREATE TABLE clients_pro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raison_sociale TEXT NOT NULL,     -- ⚠️ SEUL CHAMP OBLIGATOIRE
  siret TEXT,                       -- optionnel
  num_tva TEXT,
  contact_nom TEXT,
  contact_prenom TEXT,
  contact_email TEXT,
  contact_telephone TEXT,
  adresse_ligne1 TEXT,
  adresse_ligne2 TEXT,
  code_postal TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'France',
  categorie_id UUID REFERENCES categories_clients(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 Table `projets`

```sql
CREATE TABLE projets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  reference TEXT,
  client_id UUID NOT NULL REFERENCES clients_pro(id),
  categorie_id UUID REFERENCES categories_projets(id),
  statut TEXT DEFAULT 'brouillon',  -- brouillon | en_cours | termine | annule
  description TEXT,
  budget NUMERIC,
  date_debut DATE,
  date_fin DATE,
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 Table `projets_produits` (pivot)

```sql
CREATE TABLE projets_produits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
  produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
  quantite INTEGER DEFAULT 1,
  prix_unitaire_fige NUMERIC,       -- Prix figé si projet hors brouillon
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.7 Tables catégories (même structure)

```sql
-- categories_composants, categories_produits, categories_clients, categories_projets
CREATE TABLE categories_[module] (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#76715A',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. FORMULES DE CALCUL

### Prix de vente composant
```typescript
prix_vente = prix_achat * (1 + marge_pourcent / 100)
```

### Prix de vente produit
```typescript
const sousTotal = composants.reduce((sum, c) => sum + c.prix_vente * c.quantite, 0)
const mainOeuvre = prix_heure * nombre_heures
prix_vente_total = sousTotal + mainOeuvre
```

### Total projet
```typescript
total_ht = produits.reduce((sum, p) => sum + p.prix_vente_total * p.quantite, 0)
```

---

## 6. RÈGLE RECALCUL AUTOMATIQUE

### ⚠️ RÈGLE CRITIQUE

| Statut projet | Comportement |
|---------------|--------------|
| `brouillon` | ✅ Recalcul automatique (composant → produit → projet) |
| `en_cours` | 🔒 Prix figés (historique préservé) |
| `termine` | 🔒 Prix figés |
| `annule` | 🔒 Prix figés |

**Cascade de recalcul (brouillon uniquement):**
1. Composant change de prix → `prix_vente` recalculé
2. → Produits utilisant ce composant → `prix_vente_total` recalculé
3. → Projets en "brouillon" → `total_ht` recalculé

**Prix figés = Devis déjà transmis au client = Ne pas modifier**

---

## 7. MODULES FONCTIONNELS

### 7.1 Module Composants

**Card composant affiche:**
- Image ou placeholder
- Nom + Référence
- Badge Catégorie
- **Picto poids (kg)** ← OBLIGATOIRE
- Prix achat / Marge % / Prix vente
- Actions : Modifier, Dupliquer, Supprimer

**Modal ComposantModal:**
- Photo (drag & drop)
- Nom ✅ obligatoire
- Référence
- Catégorie (select + bouton "+")
- Prix d'achat ✅ obligatoire
- Marge % (default 30)
- Prix de vente 🔒 calculé
- Poids (kg)
- Dimensions L × H × P (cm)
- Notes

### 7.2 Module Produits

**Comme composants + section Composants:**
- Liste composants avec quantités
- Bouton "+ Ajouter" composant
- Sous-total composants
- Prix horaire × Nombre heures
- Prix vente total = Composants + Main d'œuvre

### 7.3 Module Clients

**Modal ClientModal:**
- Raison sociale ✅ **SEUL CHAMP OBLIGATOIRE**
- SIRET (optionnel)
- N° TVA
- Contact (nom, prénom, email, téléphone)
- Adresse complète
- Catégorie
- Notes

### 7.4 Module Projets

**Vue par défaut: KANBAN**

Colonnes par statut: BROUILLON | EN COURS | TERMINÉ | ANNULÉ

**Bouton "+" nouveau statut:**
- Dans un cercle
- À droite du titre de la dernière colonne
- Style cohérent avec l'interface
- Clic → Crée nouveau statut (comme catégorie)

**Card projet:**
- Nom + Client
- Total HT
- Date
- Actions : modifier, dupliquer, supprimer, exporter

**Modal ProjetModal:**
- Informations générales (nom, référence, client, catégorie, statut)
- Dates & Budget
- Produits du projet (quantités)
- Notes
- **Actions:** Exporter devis, Exporter bon de commande, Dupliquer

---

## 8. EXPORTS EXCEL

### 8.1 Export Devis projet

**Fichier:** `Projet_[NomProjet]_[Date].xlsx`

- Feuille 1: Informations projet
- Feuille 2: Détail produits (produit, ref, qté, prix unit, total)
- Feuille 3: Détail composants (optionnel)

### 8.2 Export Bon de commande par catégorie

**Fichier:** `BonCommande_[NomProjet]_[Date].xlsx`

**Modal de sélection:**
```
┌─────────────────────────────────────┐
│  Exporter bon de commande           │
├─────────────────────────────────────┤
│  ☑ Toutes les catégories            │
│  ─────────────────────────          │
│  ☐ Visserie                         │
│  ☐ Planches                         │
│  ☐ Quincaillerie                    │
│  ☐ Peinture                         │
├─────────────────────────────────────┤
│  [Annuler]     [Exporter Excel]     │
└─────────────────────────────────────┘
```

**Contenu fichier:**
```
CATÉGORIE : Bois
- Planche chêne 200x30     × 4     Réf: BOIS-001
- Tasseaux pin             × 12    Réf: BOIS-002

CATÉGORIE : Quincaillerie
- Vis inox M6              × 32    Réf: QUIN-001
- Écrous M6                × 32    Réf: QUIN-002
```

**Comportement:**
- "Toutes les catégories" coché → Exporte tous les composants
- Catégories individuelles cochées → Exporte uniquement celles-ci
- Quantités agrégées si même composant dans plusieurs produits

---

## 9. DESIGN SYSTEM

### Couleurs PURPL

```typescript
const colors = {
  purplVert: '#76715A',      // Principal, header, liens
  purplOrangeDoux: '#E77E55', // Accent, warning
  purplOrangeChaud: '#ED693A', // CTA, bouton principal
  purplEcru: '#EDEAE3',      // Fond page
  purplIvoire: '#FFFEF5',    // Fond très clair
  purplNoir: '#2F2F2E',      // Texte principal
  purplSable: '#D6CCAF',     // Accent secondaire
  purplRougeBeige: '#C6846C', // Accent tertiaire
}
```

### Typographies

- **Titres:** New Order (Semi-Bold)
- **Corps:** Albert Sans (Regular/Medium)

### Icônes

- Type: Stroke (trait, pas rempli)
- Épaisseur: 2px
- Coins: Arrondis
- Taille: 20×20px ou 24×24px

---

## 10. CONVENTIONS CODE

### Nommage

```typescript
// Variables et fonctions : camelCase
const prixVente = 32.50
function calculerPrixVente(prixAchat: number, marge: number) {}

// Composants : PascalCase
function ComposantCard({ composant }: Props) {}

// Constantes : SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024
const DEFAULT_MARGE = 30
```

### Requêtes Supabase

```typescript
// Client-side
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

const { data, error } = await supabase
  .from('composants')
  .select('*, categories_composants(*)')
  .eq('is_active', true)
  .order('name')
```

### Gestion erreurs

```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  console.error('Erreur:', error)
  toast.error('Une erreur est survenue')
  return null
}
```

---

## 11. VALEURS PAR DÉFAUT

| Paramètre | Valeur | Modifiable |
|-----------|--------|------------|
| Marge composant | 30% | Par composant |
| Prix horaire | 45€ | Global ou par produit |
| Pays | France | Oui |
| Statut projet | brouillon | Oui |
| is_active | true | Oui |

---

## 12. SUPABASE

- **Project ID:** `anodesfypwifqxpsqmpt`
- **Région:** West EU (Paris)

**Régénérer types:**
```bash
npx supabase gen types typescript --project-id anodesfypwifqxpsqmpt > types/database.types.ts
```

---

## CHANGELOG

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 2025-12-25 | Création initiale |
| 1.1 | 2025-12-25 | Picto poids, raison sociale seul obligatoire, Kanban par défaut + bouton cercle, règle prix figés, export bon de commande |


