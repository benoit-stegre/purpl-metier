# 🎨 DESIGN SYSTEM - Kanban & Grille PURPL Métier

> **Version:** 1.0  
> **Date:** 2025-01-07  
> **Projet:** PURPL Métier  
> **Référence:** Page Produits (ProduitsView, ProduitsKanban, ProduitCard)

---

## 📋 TABLE DES MATIÈRES

1. [Couleurs PURPL](#-couleurs-purpl)
2. [Design des Cartes](#-design-des-cartes)
3. [Design du Kanban](#-design-du-kanban)
4. [Design de la Grille](#-design-de-la-grille)
5. [Popup de Confirmation](#-popup-de-confirmation)
6. [Fonctionnalités Standard](#-fonctionnalités-standard)
7. [Méthodologie d'Implémentation](#-méthodologie-dimplémentation)
8. [Templates de Code](#-templates-de-code)

---

## 📑 TABLE DES MATIÈRES COMPLÈTE

1. [Couleurs PURPL](#-couleurs-purpl)
2. [Design des Cartes](#-design-des-cartes)
3. [Design du Kanban](#-design-du-kanban)
4. [Design de la Grille](#-design-de-la-grille)
5. [Modal d'Édition](#-modal-dédition)
6. [Popup de Confirmation Suppression](#-popup-de-confirmation-suppression)
7. [Popup Changements Non Sauvegardés](#-popup-changements-non-sauvegardés)
8. [Fonctionnalités Standard](#-fonctionnalités-standard)
9. [Méthodologie d'Implémentation](#-méthodologie-dimplémentation)
10. [Templates de Code](#-templates-de-code)

---

## 🎨 COULEURS PURPL

### Palette Principale

```typescript
const COLORS = {
  // Fonds
  ivoire: '#FFFEF5',      // Fond cartes, modals
  ecru: '#EDEAE3',        // Bordures, séparateurs, badges neutres
  
  // Textes
  noir: '#2F2F2E',        // Texte principal
  olive: '#76715A',       // Texte secondaire, labels, bouton dupliquer
  
  // Accents
  orangeDoux: '#E77E55',  // Prix, accents positifs
  orangeChaud: '#ED693A', // Marge 0-15%, alertes douces
  
  // États
  rouge: '#C23C3C',       // Suppression, erreurs, marge négative
  rougeDoux: '#C23C3C',   // Alias pour cohérence
  vert: '#409143',        // Succès, marge > 30%
}
```

### Couleurs Spécifiques

```typescript
// Fond photo (zone image sans photo)
const PHOTO_BG = '#F3F4F6'        // bg-gray-100
const PHOTO_ICON = '#D1D5DB'      // text-gray-300 (icône placeholder)

// Overlay modal
const OVERLAY_BG = 'bg-black/70'  // 70% opacité
```

### Badges Marge (%)

| Condition | Couleur | Code |
|-----------|---------|------|
| > 30% | Vert | `#409143` |
| 15-30% | Orange doux | `#E77E55` |
| 0-15% | Orange chaud | `#ED693A` |
| < 0% | Rouge | `#C23C3C` |

---

## 🃏 DESIGN DES CARTES

### Structure Générale

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │      ZONE PHOTO             │ │  ← h-[140px] grille, h-[100px] kanban
│ │  [Badge Catégorie]  [Actions]│ │  ← Actions visibles au hover
│ └─────────────────────────────┘ │
│                                 │
│  Nom du produit                 │  ← font-semibold, COLORS.noir
│  Référence                      │  ← text-xs, COLORS.olive
│  Poids (kanban)                 │  ← text-xs, COLORS.olive + WeightIcon
│                          Prix € │  ← text-lg font-bold, COLORS.orangeDoux
│                                 │
│  ─────────────────────────────  │  ← borderTop: COLORS.ecru
│  Marge    +XX.XX €    XX.X%     │  ← Badge coloré selon %
└─────────────────────────────────┘
```

### Zone Photo

```tsx
// Avec photo
<img src={photoUrl} className="w-full h-full object-cover" />

// Sans photo (placeholder)
<div style={{ backgroundColor: '#F3F4F6' }}>
  <ImageIcon style={{ color: '#76715A' }} className="w-10 h-10" />
</div>
```

### Badge Catégorie (haut gauche)

```tsx
<div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm">
  <span 
    className="w-2 h-2 rounded-full" 
    style={{ backgroundColor: category.color || COLORS.orangeChaud }}
  />
  <span className="text-xs font-medium" style={{ color: COLORS.noir }}>
    {category.name}
  </span>
</div>
```

### Actions (haut droite, visibles au hover)

```tsx
<div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
  {/* Bouton Dupliquer */}
  <button
    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-transform"
    style={{ backgroundColor: COLORS.olive, color: 'white' }}
  >
    <DuplicateIcon className="w-4 h-4" />
  </button>
  
  {/* Bouton Supprimer */}
  <button
    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md hover:scale-110 transition-all border"
    style={{ 
      backgroundColor: 'white', 
      borderColor: COLORS.rouge 
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.rouge}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
  >
    <DeleteIcon style={{ color: COLORS.rouge }} className="w-4 h-4" />
  </button>
</div>
```

### Variantes

| Prop | Grille | Kanban |
|------|--------|--------|
| `variant` | `"grid"` | `"kanban"` |
| Hauteur photo | `h-[140px]` | `h-[100px]` |
| Affichage poids | Non | Oui (si > 0) |

---

## 📊 DESIGN DU KANBAN

### Structure Globale

```
┌──────────────────────────────────────────────────────────────────┐
│ [← Flèche gauche]                              [Flèche droite →] │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ TITRE COL 1 │  │ TITRE COL 2 │  │ TITRE COL 3 │   ...        │
│  │ (nb items)  │  │ (nb items)  │  │ (nb items)  │              │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤              │
│  │     [↑]     │  │     [↑]     │  │     [↑]     │  ← Scroll up │
│  │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │              │
│  │  │ Card  │  │  │  │ Card  │  │  │  │ Card  │  │              │
│  │  └───────┘  │  │  └───────┘  │  │  └───────┘  │              │
│  │  ┌───────┐  │  │  ┌───────┐  │  │             │              │
│  │  │ Card  │  │  │  │ Card  │  │  │             │              │
│  │  └───────┘  │  │  └───────┘  │  │             │              │
│  │     [↓]     │  │     [↓]     │  │     [↓]     │  ← Scroll down│
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### Titre de Colonne

```tsx
<div 
  className="px-4 py-3 rounded-t-xl"
  style={{ backgroundColor: '#FFFEF5' }}  // Ivoire
>
  <div className="flex items-center gap-2">
    <span 
      className="w-3 h-3 rounded-full" 
      style={{ backgroundColor: category.color }}
    />
    <span className="font-semibold" style={{ color: '#2F2F2E' }}>
      {category.name}
    </span>
    <span 
      className="ml-auto text-sm px-2 py-0.5 rounded-full"
      style={{ backgroundColor: '#EDEAE3', color: '#76715A' }}
    >
      {count}
    </span>
  </div>
</div>
```

### Zone Cartes (scrollable)

```tsx
<div 
  className="flex-1 overflow-y-auto p-2 space-y-3"
  style={{ 
    scrollbarWidth: 'none',  // Firefox
    msOverflowStyle: 'none'  // IE
  }}
  // CSS: [&::-webkit-scrollbar]:hidden
>
  {produits.map(p => <ProduitCard variant="kanban" ... />)}
</div>
```

### Flèches de Navigation

```tsx
// Flèches verticales (par colonne)
<button className="w-full py-1 flex justify-center hover:bg-gray-100 rounded">
  <ChevronUp size={16} style={{ color: '#76715A' }} />
</button>

// Flèches horizontales (colonnes)
<button 
  className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/80 rounded-r-lg shadow flex items-center justify-center hover:bg-white"
>
  <ChevronLeft size={20} style={{ color: '#76715A' }} />
</button>
```

### Colonne "Sans Catégorie"

- Titre : "Sans catégorie"
- Couleur pastille : `#9CA3AF` (gray-400)
- Contient les items avec `categorie_id === null`

---

## 🔲 DESIGN DE LA GRILLE

### Container

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {filteredItems.map(item => (
    <Card key={item.id} ... />
  ))}
</div>
```

### Filtres

```tsx
<div className="flex flex-col md:flex-row gap-4 mb-1.5">
  {/* Barre de recherche */}
  <div className="w-full md:flex-1 relative">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      placeholder="Rechercher..."
      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white"
    />
  </div>

  {/* Dropdown catégories */}
  <select className="w-full md:w-auto px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#76715A] bg-white cursor-pointer">
    <option value="all">Toutes les catégories</option>
    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
    <option disabled>────────────────</option>
    <option value="__manage__">⚙ Gérer les catégories...</option>
  </select>
</div>
```

---

## 📝 MODAL D'ÉDITION

### Structure Générale

```
┌─────────────────────────────────────────────────────────────┐
│  [Titre Modal]                                          [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   COLONNE GAUCHE    │  │   COLONNE DROITE    │          │
│  │   - Nom *           │  │   - Upload photo    │          │
│  │   - Référence       │  │   - Preview         │          │
│  │   - Catégorie       │  │   - Dimensions      │          │
│  │   - Prix achat *    │  │   - Poids           │          │
│  │   - Marge % *       │  │   - Notes           │          │
│  └─────────────────────┘  └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ZONE CALCULÉE (fond écru, lecture seule)           │   │
│  │  Prix de vente: XX.XX €                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [☑ Archiver ce composant] (visible uniquement si édition) │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Abandonner]        [Continuer]           [Enregistrer]    │
└─────────────────────────────────────────────────────────────┘
```

### Props Interface

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  item?: ItemType           // Si présent = mode édition, sinon = création
  categories: Category[]
  onSuccess?: () => void    // Callback après sauvegarde réussie
}
```

### Header Modal

```tsx
<div 
  className="flex items-center justify-between p-6 border-b"
  style={{ borderColor: COLORS.ecru }}
>
  <h2 
    className="text-xl font-semibold"
    style={{ color: COLORS.noir }}
  >
    {item ? 'Modifier le composant' : 'Nouveau composant'}
  </h2>
  <button
    onClick={handleClose}
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
  >
    <CloseIcon style={{ color: COLORS.olive }} className="w-5 h-5" />
  </button>
</div>
```

### Zone Calculée (fond écru)

```tsx
<div 
  className="p-4 rounded-lg mt-4"
  style={{ backgroundColor: COLORS.ecru }}
>
  <label 
    className="block text-sm font-medium mb-1"
    style={{ color: COLORS.olive }}
  >
    Prix de vente (calculé automatiquement)
  </label>
  <div 
    className="text-2xl font-bold"
    style={{ color: COLORS.orangeDoux }}
  >
    {prixVente.toFixed(2)} €
  </div>
</div>
```

### Checkbox Archiver (mode édition uniquement)

```tsx
{item && (
  <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: COLORS.ecru }}>
    <input
      type="checkbox"
      id="archive"
      checked={isArchived}
      onChange={(e) => setIsArchived(e.target.checked)}
      className="w-4 h-4 rounded"
      style={{ accentColor: COLORS.rouge }}
    />
    <label 
      htmlFor="archive" 
      className="text-sm"
      style={{ color: COLORS.rouge }}
    >
      Archiver ce composant
    </label>
  </div>
)}
```

### Footer - 3 Boutons Action (OBLIGATOIRES)

```tsx
<div 
  className="flex justify-between items-center p-6 border-t"
  style={{ borderColor: COLORS.ecru }}
>
  {/* 1. ABANDONNER (gauche) */}
  <button
    onClick={handleClose}
    className="px-6 py-3 border-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
    style={{ 
      borderColor: COLORS.olive, 
      color: COLORS.olive 
    }}
  >
    <BackIcon className="w-5 h-5" />
    Abandonner
  </button>

  <div className="flex gap-3">
    {/* 2. CONTINUER (centre) */}
    <button
      onClick={handleSaveAndContinue}
      disabled={isLoading}
      className="px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium text-white disabled:opacity-50"
      style={{ backgroundColor: COLORS.olive }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.orangeDoux}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.olive}
    >
      <SaveIcon className="w-5 h-5" />
      Continuer
    </button>

    {/* 3. ENREGISTRER (droite - bouton principal) */}
    <button
      onClick={handleSaveAndClose}
      disabled={isLoading}
      className="px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium text-white disabled:opacity-50"
      style={{ backgroundColor: COLORS.orangeDoux }}
    >
      <SaveIcon className="w-5 h-5" />
      {isLoading ? 'Enregistrement...' : 'Enregistrer'}
    </button>
  </div>
</div>
```

### Comportement des Boutons

| Bouton | Position | Couleur | Action |
|--------|----------|---------|--------|
| **Abandonner** | Gauche | Border olive | Ferme modal (popup si changements) |
| **Continuer** | Centre | Fond olive → orange au hover | Sauvegarde + garde modal ouvert (reset form) |
| **Enregistrer** | Droite | Fond orange (CTA) | Sauvegarde + ferme modal |

### Overlay Modal

```tsx
<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
  <div 
    className="rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
    style={{ backgroundColor: COLORS.ivoire }}
  >
    {/* Contenu modal */}
  </div>
</div>
```

### Upload Photo avec Preview

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium" style={{ color: COLORS.noir }}>
    Photo
  </label>
  
  {/* Zone preview/upload */}
  <div 
    className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-solid transition-all"
    style={{ 
      borderColor: COLORS.ecru,
      backgroundColor: '#F3F4F6'  // bg-gray-100
    }}
    onClick={() => fileInputRef.current?.click()}
  >
    {photoUrl ? (
      <>
        <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
        <button
          onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
        >
          <CloseIcon className="w-4 h-4" style={{ color: COLORS.rouge }} />
        </button>
      </>
    ) : (
      <div className="text-center">
        <UploadIcon className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.olive }} />
        <span className="text-sm" style={{ color: COLORS.olive }}>
          Cliquer pour ajouter
        </span>
      </div>
    )}
  </div>
  
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="hidden"
  />
</div>
```

### Validation Champs Requis

```tsx
// State erreurs
const [errors, setErrors] = useState<Record<string, string>>({})

// Validation
const validate = () => {
  const newErrors: Record<string, string> = {}
  
  if (!name.trim()) newErrors.name = 'Le nom est requis'
  if (!prixAchat || prixAchat <= 0) newErrors.prixAchat = 'Prix invalide'
  if (marge === undefined || marge < 0) newErrors.marge = 'Marge invalide'
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

// Affichage erreur sur input
<input
  className={`w-full px-4 py-2 border-2 rounded-lg ${errors.name ? 'border-red-500' : ''}`}
  style={{ borderColor: errors.name ? COLORS.rouge : COLORS.ecru }}
/>
{errors.name && (
  <span className="text-sm" style={{ color: COLORS.rouge }}>
    {errors.name}
  </span>
)}
```

---

## ⚠️ POPUP DE CONFIRMATION SUPPRESSION

### Structure

```tsx
{deleteConfirm.open && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
    <div 
      className="rounded-xl w-full max-w-sm p-6" 
      style={{ backgroundColor: '#FFFEF5' }}
    >
      {/* Icône */}
      <div className="flex justify-center mb-4">
        <AlertTriangle size={40} style={{ color: '#C23C3C' }} />
      </div>
      
      {/* Titre */}
      <h3 
        className="text-xl font-semibold text-center mb-2" 
        style={{ color: '#C23C3C' }}
      >
        Supprimer ce [item] ?
      </h3>
      
      {/* Description */}
      <p 
        className="text-center text-sm mb-6" 
        style={{ color: '#2F2F2E' }}
      >
        Cette action est irréversible. Toutes les données associées seront perdues.
      </p>
      
      {/* Boutons */}
      <div className="flex gap-3">
        {/* Annuler */}
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 rounded-lg font-medium border-2 transition-colors"
          style={{
            color: '#76715A',
            borderColor: '#76715A',
            backgroundColor: '#FFFEF5',
          }}
        >
          Annuler
        </button>
        
        {/* Confirmer */}
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50"
          style={{ backgroundColor: '#C23C3C' }}
        >
          {isDeleting ? "Suppression..." : "Supprimer définitivement"}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 🔄 POPUP CHANGEMENTS NON SAUVEGARDÉS

### Déclencheur

S'affiche quand l'utilisateur clique "Abandonner" ou le bouton X **ET** qu'il y a des modifications non enregistrées.

### Détection des Changements

```typescript
const [initialValues, setInitialValues] = useState<FormValues | null>(null)

// Au montage du modal
useEffect(() => {
  if (isOpen) {
    setInitialValues({ name, reference, prixAchat, marge, ... })
  }
}, [isOpen])

// Vérification changements
const hasChanges = useMemo(() => {
  if (!initialValues) return false
  return (
    name !== initialValues.name ||
    reference !== initialValues.reference ||
    prixAchat !== initialValues.prixAchat ||
    marge !== initialValues.marge
    // ... autres champs
  )
}, [name, reference, prixAchat, marge, initialValues])
```

### Structure Popup

```
┌─────────────────────────────────────┐
│  Modifications non enregistrées     │
│                                     │
│  Vous avez des modifications non    │
│  enregistrées. Que souhaitez-vous   │
│  faire ?                            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💾 Enregistrer et fermer    │    │  ← Orange (principal)
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ ✏️ Continuer l'édition      │    │  ← Vert border
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🗑️ Abandonner modifications │    │  ← Rouge border
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Code Complet

```tsx
{showConfirmClose && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4">
    <div 
      className="rounded-xl w-full max-w-sm p-6"
      style={{ backgroundColor: COLORS.ivoire }}
    >
      {/* Titre */}
      <h3 
        className="text-lg font-semibold mb-2"
        style={{ color: COLORS.noir }}
      >
        Modifications non enregistrées
      </h3>
      
      {/* Description */}
      <p 
        className="text-sm mb-6"
        style={{ color: COLORS.olive }}
      >
        Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?
      </p>
      
      {/* Boutons en colonne */}
      <div className="flex flex-col gap-3">
        {/* 1. Enregistrer et fermer (principal) */}
        <button
          onClick={handleSaveAndClose}
          disabled={isLoading}
          className="w-full px-6 py-3 rounded-lg font-medium transition-colors text-white disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: COLORS.orangeDoux }}
        >
          <SaveIcon className="w-5 h-5" />
          {isLoading ? 'Enregistrement...' : 'Enregistrer et fermer'}
        </button>
        
        {/* 2. Continuer l'édition */}
        <button
          onClick={() => setShowConfirmClose(false)}
          className="w-full px-6 py-3 border-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          style={{ 
            borderColor: COLORS.olive, 
            color: COLORS.olive,
            backgroundColor: COLORS.ivoire 
          }}
        >
          <BackIcon className="w-5 h-5" />
          Continuer l'édition
        </button>
        
        {/* 3. Abandonner (destructif) */}
        <button
          onClick={() => {
            setShowConfirmClose(false)
            onClose()
          }}
          className="w-full px-6 py-3 border-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          style={{ 
            borderColor: COLORS.rouge, 
            color: COLORS.rouge,
            backgroundColor: COLORS.ivoire 
          }}
        >
          <DeleteIcon className="w-5 h-5" />
          Abandonner les modifications
        </button>
      </div>
    </div>
  </div>
)}
```

### Logique handleClose

```typescript
const handleClose = () => {
  if (hasChanges) {
    setShowConfirmClose(true)  // Affiche popup
  } else {
    onClose()  // Ferme directement
  }
}
```

---

## ⚡ FONCTIONNALITÉS STANDARD

### Actions sur les Cartes

| Action | Déclencheur | Comportement |
|--------|-------------|--------------|
| **Voir/Éditer** | Clic sur la carte | Ouvre le modal d'édition |
| **Dupliquer** | Bouton olive (hover) | Ouvre modal avec données pré-remplies + "(copie)" |
| **Supprimer** | Bouton rouge (hover) | Ouvre popup de confirmation |

### State Pattern pour Suppression

```typescript
// State
const [deleteConfirm, setDeleteConfirm] = useState<{
  open: boolean
  item: ItemType | null
}>({ open: false, item: null })
const [isDeleting, setIsDeleting] = useState(false)

// Ouvrir popup
const handleDeleteClick = (item: ItemType) => {
  setDeleteConfirm({ open: true, item })
}

// Confirmer suppression
const handleConfirmDelete = async () => {
  if (!deleteConfirm.item) return
  setIsDeleting(true)
  try {
    await supabase.from('table').delete().eq('id', deleteConfirm.item.id)
    await fetchItems()
    setDeleteConfirm({ open: false, item: null })
    toast.success('Supprimé avec succès')
  } catch (error) {
    toast.error('Erreur lors de la suppression')
  } finally {
    setIsDeleting(false)
  }
}

// Annuler
const handleCancelDelete = () => {
  setDeleteConfirm({ open: false, item: null })
}
```

### State Pattern pour Duplication

```typescript
const handleDuplicate = (item: ItemType) => {
  setEditingItem({ 
    ...item, 
    id: '',  // Important: vider l'ID pour créer un nouveau
    name: `${item.name} (copie)` 
  })
  setIsModalOpen(true)
}
```

---

## 🔧 MÉTHODOLOGIE D'IMPLÉMENTATION

### Étape 1 : Analyser l'Existant

Avant de toucher au code, **TOUJOURS** :

1. Identifier les fichiers existants de la page cible
2. Lister les fonctionnalités spécifiques à cette page
3. Identifier les différences avec le design de base

**Questions à poser :**
- Quelles colonnes dans le Kanban ? (basé sur quoi ?)
- Quelles infos afficher sur les cartes ?
- Y a-t-il des calculs spécifiques ? (marge, poids, etc.)
- Y a-t-il des actions supplémentaires ?

### Étape 2 : Créer un HTML de Validation

Créer un fichier HTML statique avec :
- Les couleurs PURPL
- Le design proposé
- Les données mockées

**But :** Valider visuellement AVANT de coder.

### Étape 3 : Prompt Cursor

Seulement après validation du HTML, créer le prompt Cursor avec :
- Référence au design validé
- Instructions précises fichier par fichier
- Règle 1 fichier = 1 test

---

## 📝 TEMPLATES DE CODE

### Template Card Component

```tsx
'use client'

import { useMemo } from 'react'
import { ImageIcon, DuplicateIcon, DeleteIcon } from '@/components/ui/Icons'
import type { ItemType } from '@/types'

const COLORS = {
  ivoire: '#FFFEF5',
  ecru: '#EDEAE3',
  noir: '#2F2F2E',
  olive: '#76715A',
  orangeDoux: '#E77E55',
  orangeChaud: '#ED693A',
  rouge: '#C23C3C',
  vert: '#409143',
}

interface ItemCardProps {
  item: ItemType
  variant?: 'grid' | 'kanban'
  onClick?: () => void
  onDuplicate?: () => void
  onDelete?: (item: ItemType) => void
}

export function ItemCard({ 
  item, 
  variant = 'grid',
  onClick,
  onDuplicate,
  onDelete 
}: ItemCardProps) {
  // ... logique
  
  return (
    <div 
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
      style={{ backgroundColor: COLORS.ivoire }}
      onClick={onClick}
    >
      {/* Photo + Actions + Badge */}
      {/* Contenu */}
    </div>
  )
}
```

### Template View Component (avec switch Grille/Kanban)

```tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ItemKanban } from './ItemKanban'
import { ItemCard } from './ItemCard'
import { ItemModal } from './ItemModal'
import { usePageHeader } from '@/contexts/PageHeaderContext'
import type { ItemType, CategoryType } from '@/types'

const COLORS = {
  ivoire: '#FFFEF5',
  noir: '#2F2F2E',
  olive: '#76715A',
  rougeDoux: '#C23C3C',
}

export function ItemsView({ initialItems, ... }) {
  const { viewMode, setViewMode, ... } = usePageHeader()
  
  // States
  const [localItems, setLocalItems] = useState(initialItems)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null })
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Handlers
  const handleDeleteClick = (item) => { ... }
  const handleConfirmDelete = async () => { ... }
  const handleDuplicate = (item) => { ... }
  
  return (
    <>
      {viewMode === 'kanban' ? (
        <ItemKanban ... />
      ) : (
        {/* Filtres + Grille */}
      )}
      
      {/* Modal */}
      <ItemModal ... />
      
      {/* Popup Suppression */}
      {deleteConfirm.open && ( ... )}
    </>
  )
}
```

---

## 📂 FICHIERS DE RÉFÉRENCE

| Fichier | Description |
|---------|-------------|
| `components/produits/ProduitCard.tsx` | Carte produit (référence design carte) |
| `components/produits/ProduitsKanban.tsx` | Vue Kanban (référence colonnes + scroll) |
| `components/produits/ProduitsView.tsx` | Vue principale (switch grille/kanban) |
| `components/produits/ProduitModal.tsx` | Modal d'édition (popup suppression) |

---

## ✅ CHECKLIST AVANT IMPLÉMENTATION

- [ ] Fichiers existants analysés
- [ ] Fonctionnalités spécifiques listées
- [ ] HTML de preview créé
- [ ] HTML validé par l'utilisateur
- [ ] Prompt Cursor préparé
- [ ] Backup automatique prévu dans le script

---

**Document maintenu par:** PURPL Solutions  
**Dernière mise à jour:** 2025-01-07
