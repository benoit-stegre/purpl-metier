// Couleurs de la charte graphique PURPL
// Référence: PURPL_CHARTE_GRAPHIQUE_compressed.pdf

export const PURPL_COLORS = [
  // Palette de base
  { name: 'Vert principal', hex: '#76715A', usage: 'Actions principales, nature' },
  { name: 'Orange chaud', hex: '#ED693A', usage: 'Dynamisme, urgence' },
  { name: 'Orange doux', hex: '#E77E55', usage: 'Douceur, chaleur' },
  { name: 'Sable', hex: '#D6CCAF', usage: 'Tons naturels' },
  { name: 'Rouge beige', hex: '#C6846C', usage: 'Terre, matériaux' },
  
  // Palette secondaire POP
  { name: 'Bleu sérénité', hex: '#99B8E1', usage: 'Calme, confiance' },
  { name: 'Jaune joie', hex: '#FCE789', usage: 'Énergie, positivité' },
  { name: 'Terre crue', hex: '#F3D1B6', usage: 'Douceur, naturel' },
]

// Couleurs par défaut selon contexte
export const DEFAULT_COLORS = {
  composants: '#76715A',  // Vert (nature, matériaux)
  produits: '#ED693A',    // Orange (dynamisme, produits)
  clients: '#99B8E1',     // Bleu (confiance, relations)
  projets: '#76715A',     // Vert (nature, projets)
}

