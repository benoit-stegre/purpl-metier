// IMPORTANT: Pour les styles Excel (couleurs, bordures), installer xlsx-js-style
// Installation: npm install xlsx-js-style
// Puis remplacer l'import ci-dessous par: import * as XLSX from 'xlsx-js-style'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

/**
 * Helper pour appliquer les styles aux cellules
 * Fonctionne avec xlsx-js-style (les styles seront ignorés avec xlsx standard)
 */
function applyCellStyle(cell: any, style: any) {
  if (cell) {
    if (!cell.s) cell.s = {}
    Object.assign(cell.s, style)
  }
}

/**
 * Export d'un devis projet au format Excel
 * @param projetId - ID du projet à exporter
 * @returns {success: boolean, error?: string}
 */
export async function exportProjetDevis(projetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Charger le projet avec ses produits et informations client
    const { data: projet, error: projetError } = await supabase
      .from('projets')
      .select(`
        *,
        clients_pro (
          id,
          raison_sociale
        ),
        projets_produits (
          quantite,
          produit:produits (
            id,
            name,
            reference,
            prix_vente_total
          )
        )
      `)
      .eq('id', projetId)
      .single()

    if (projetError) throw projetError
    if (!projet) throw new Error('Projet non trouvé')

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // ===== ONGLET "Informations" =====
    const infosData = [
      ['Informations du projet'],
      [],
      ['Nom du projet', projet.nom || ''],
      ['Référence', projet.reference || ''],
      ['Client', (projet.clients_pro as any)?.raison_sociale || ''],
      ['Statut', projet.statut || ''],
      ['Date de début', projet.date_debut ? new Date(projet.date_debut).toLocaleDateString('fr-FR') : ''],
      ['Date de fin', projet.date_fin ? new Date(projet.date_fin).toLocaleDateString('fr-FR') : ''],
      ['Budget', projet.budget ? `${projet.budget.toFixed(2)} €` : ''],
      [],
    ]

    const infosSheet = XLSX.utils.aoa_to_sheet(infosData)
    
    // Largeur colonnes
    infosSheet['!cols'] = [
      { wch: 20 }, // Colonne 1
      { wch: 30 }, // Colonne 2
    ]

    // Style titre (A1)
    const titleCell = infosSheet['A1']
    if (titleCell) {
      applyCellStyle(titleCell, {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '76715A' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      })
    }

    // Style labels (colonnes A, lignes 3-10)
    for (let i = 3; i <= 10; i++) {
      const cell = infosSheet[`A${i}`]
      if (cell) {
        applyCellStyle(cell, {
          font: { bold: true },
        })
      }
    }

    XLSX.utils.book_append_sheet(workbook, infosSheet, 'Informations')

    // ===== ONGLET "Produits" =====
    const produitsHeaders = ['Référence', 'Nom', 'Quantité', 'Prix unitaire HT', 'Total HT']
    const produitsRows: any[][] = [produitsHeaders]

    let totalHT = 0

    // Parcourir les produits du projet
    const projetsProduits = (projet.projets_produits as any[]) || []
    projetsProduits.forEach((pp: any) => {
      const produit = pp.produit
      if (!produit) return

      const quantite = pp.quantite || 0
      const prixUnitaire = produit.prix_vente_total || 0
      const totalLigne = quantite * prixUnitaire
      totalHT += totalLigne

      produitsRows.push([
        produit.reference || '',
        produit.name || '',
        quantite,
        prixUnitaire,
        totalLigne,
      ])
    })

    // Ligne total
    produitsRows.push([])
    produitsRows.push(['', '', '', 'TOTAL HT', totalHT])

    const produitsSheet = XLSX.utils.aoa_to_sheet(produitsRows)

    // Largeur colonnes
    produitsSheet['!cols'] = [
      { wch: 15 }, // Référence
      { wch: 30 }, // Nom
      { wch: 12 }, // Quantité
      { wch: 18 }, // Prix unitaire HT
      { wch: 15 }, // Total HT
    ]

    // Style headers (ligne 1)
    const headerRange = XLSX.utils.decode_range(produitsSheet['!ref'] || 'A1:E1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      const cell = produitsSheet[cellAddress]
      if (cell) {
        applyCellStyle(cell, {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '76715A' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        })
      }
    }

    // Formatage prix (colonnes D et E)
    const lastRow = produitsRows.length - 1
    for (let row = 1; row < lastRow; row++) {
      // Prix unitaire HT (colonne D)
      const cellD = produitsSheet[XLSX.utils.encode_cell({ r: row, c: 3 })]
      if (cellD && typeof cellD.v === 'number') {
        if (!cellD.s) cellD.s = {}
        cellD.s.numFmt = '#,##0.00'
      }

      // Total HT (colonne E)
      const cellE = produitsSheet[XLSX.utils.encode_cell({ r: row, c: 4 })]
      if (cellE && typeof cellE.v === 'number') {
        if (!cellE.s) cellE.s = {}
        cellE.s.numFmt = '#,##0.00'
      }
    }

    // Style ligne total
    const totalRowIndex = lastRow
    const totalLabelCell = produitsSheet[XLSX.utils.encode_cell({ r: totalRowIndex, c: 3 })]
    const totalValueCell = produitsSheet[XLSX.utils.encode_cell({ r: totalRowIndex, c: 4 })]
    
    if (totalLabelCell) {
      applyCellStyle(totalLabelCell, {
        font: { bold: true },
        fill: { fgColor: { rgb: 'ED693A15' } },
        border: {
          top: { style: 'medium', color: { rgb: 'ED693A' } },
          bottom: { style: 'medium', color: { rgb: 'ED693A' } },
          left: { style: 'medium', color: { rgb: 'ED693A' } },
        },
      })
    }

    if (totalValueCell && typeof totalValueCell.v === 'number') {
      if (!totalValueCell.s) totalValueCell.s = {}
      totalValueCell.s.numFmt = '#,##0.00'
      applyCellStyle(totalValueCell, {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: 'ED693A15' } },
        border: {
          top: { style: 'medium', color: { rgb: 'ED693A' } },
          bottom: { style: 'medium', color: { rgb: 'ED693A' } },
          right: { style: 'medium', color: { rgb: 'ED693A' } },
        },
      })
    }

    XLSX.utils.book_append_sheet(workbook, produitsSheet, 'Produits')

    // ===== GÉNÉRATION DU FICHIER =====
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const reference = projet.reference || 'N/A'
    const fileName = `Devis_${reference}_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)

    return { success: true }
  } catch (error: any) {
    console.error('Erreur export devis:', error)
    return { success: false, error: error.message || 'Erreur lors de l\'export du devis' }
  }
}

/**
 * Export d'une commande projet groupée par catégories de composants
 * @param projetId - ID du projet à exporter
 * @param categoryIds - IDs des catégories à inclure (optionnel, toutes si non fourni)
 * @returns {success: boolean, error?: string}
 */
export async function exportProjetCommande(
  projetId: string,
  categoryIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Charger le projet avec produits et leurs composants
    const { data: projet, error: projetError } = await supabase
      .from('projets')
      .select(`
        *,
        projets_produits (
          quantite,
          produit:produits (
            id,
            name,
            reference,
            produits_composants (
              quantite,
              composant:composants (
                id,
                name,
                reference,
                categorie:categories_composants (
                  id,
                  name
                )
              )
            )
          )
        )
      `)
      .eq('id', projetId)
      .single()

    if (projetError) throw projetError
    if (!projet) throw new Error('Projet non trouvé')

    // Calculer les quantités totales par composant, groupées par catégorie
    const quantitesParCategorie = new Map<string, Map<string, { name: string; reference: string | null; quantite: number }>>()

    const projetsProduits = (projet.projets_produits as any[]) || []
    
    projetsProduits.forEach((pp: any) => {
      const produit = pp.produit
      if (!produit) return

      const quantiteProduit = pp.quantite || 0
      const produitsComposants = (produit.produits_composants as any[]) || []

      produitsComposants.forEach((pc: any) => {
        const composant = pc.composant
        if (!composant) return

        const categorie = composant.categorie
        
        // Filtrer par catégories sélectionnées si categoryIds est fourni
        if (categoryIds && categoryIds.length > 0) {
          if (!categorie || !categoryIds.includes(categorie.id)) {
            return // Ignorer ce composant
          }
        }

        const categorieName = categorie?.name || 'Sans catégorie'
        const quantiteComposant = pc.quantite || 0
        const quantiteTotale = quantiteProduit * quantiteComposant

        // Initialiser la catégorie si nécessaire
        if (!quantitesParCategorie.has(categorieName)) {
          quantitesParCategorie.set(categorieName, new Map())
        }

        const composantsMap = quantitesParCategorie.get(categorieName)!
        const composantId = composant.id

        if (composantsMap.has(composantId)) {
          // Ajouter à la quantité existante
          const existing = composantsMap.get(composantId)!
          existing.quantite += quantiteTotale
        } else {
          // Nouveau composant
          composantsMap.set(composantId, {
            name: composant.name || '',
            reference: composant.reference || null,
            quantite: quantiteTotale,
          })
        }
      })
    })

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // Créer un onglet par catégorie
    const categoriesSorted = Array.from(quantitesParCategorie.keys()).sort()

    categoriesSorted.forEach((categorieName) => {
      const composantsMap = quantitesParCategorie.get(categorieName)!
      const composantsArray = Array.from(composantsMap.values())

      // Headers
      const headers = ['Référence', 'Nom', 'Quantité totale nécessaire', 'Unité']
      const rows: any[][] = [headers]

      // Ajouter les lignes de composants
      composantsArray.forEach((comp) => {
        rows.push([
          comp.reference || '',
          comp.name,
          comp.quantite,
          'unité', // Par défaut, peut être adapté selon besoins
        ])
      })

      // Créer la feuille
      const sheet = XLSX.utils.aoa_to_sheet(rows)

      // Largeur colonnes
      sheet['!cols'] = [
        { wch: 15 }, // Référence
        { wch: 30 }, // Nom
        { wch: 25 }, // Quantité totale nécessaire
        { wch: 12 }, // Unité
      ]

      // Style headers
      const headerRange = XLSX.utils.decode_range(sheet['!ref'] || 'A1:D1')
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        const cell = sheet[cellAddress]
        if (cell) {
          applyCellStyle(cell, {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '76715A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
            },
          })
        }
      }

      // Formatage quantité (colonne C)
      for (let row = 1; row < rows.length; row++) {
        const cellC = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })]
        if (cellC && typeof cellC.v === 'number') {
          if (!cellC.s) cellC.s = {}
          cellC.s.numFmt = '#,##0'
        }
      }

      // Nom de l'onglet (limité à 31 caractères par Excel)
      const sheetName = categorieName.length > 31 ? categorieName.substring(0, 31) : categorieName
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    })

    // Si aucune catégorie, créer un onglet vide
    if (categoriesSorted.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([
        ['Référence', 'Nom', 'Quantité totale nécessaire', 'Unité'],
        ['Aucun composant trouvé pour ce projet'],
      ])
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'Aucun composant')
    }

    // ===== GÉNÉRATION DU FICHIER =====
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const reference = projet.reference || 'N/A'
    const fileName = `Commande_${reference}_${dateStr}.xlsx`

    XLSX.writeFile(workbook, fileName)

    return { success: true }
  } catch (error: any) {
    console.error('Erreur export commande:', error)
    return { success: false, error: error.message || 'Erreur lors de l\'export de la commande' }
  }
}
