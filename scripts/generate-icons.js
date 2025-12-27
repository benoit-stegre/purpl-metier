const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '../public/logo-purpl.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');
const BACKGROUND_COLOR = '#EDEAE3'; // Écru PURPL
const PADDING_PERCENT = 0.1; // 10% de padding

// Dimensions à générer
const ICONS = [
  { name: 'favicon.png', size: 32 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateIcon(iconName, size) {
  console.log(`Génération de ${iconName} (${size}x${size}px)...`);

  // Lire le SVG
  const svgBuffer = fs.readFileSync(SVG_PATH);
  const svgString = svgBuffer.toString();
  
  // Extraire le viewBox du SVG
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) {
    throw new Error('Impossible de trouver le viewBox dans le SVG');
  }
  
  const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
  const svgWidth = viewBox[2];
  const svgHeight = viewBox[3];
  const svgAspectRatio = svgWidth / svgHeight;

  // Calculer les dimensions du logo avec padding (10% de chaque côté = 20% total)
  const padding = size * PADDING_PERCENT;
  const logoArea = size - (padding * 2);
  
  let logoWidth, logoHeight;
  
  if (svgAspectRatio > 1) {
    // Logo horizontal : la largeur détermine la taille
    logoWidth = logoArea;
    logoHeight = logoArea / svgAspectRatio;
  } else {
    // Logo vertical : la hauteur détermine la taille
    logoHeight = logoArea;
    logoWidth = logoArea * svgAspectRatio;
  }

  // Calculer la position pour centrer le logo
  const x = (size - logoWidth) / 2;
  const y = (size - logoHeight) / 2;

  // Extraire le contenu du SVG (tout ce qui est entre <svg> et </svg>)
  const svgContentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!svgContentMatch) {
    throw new Error('Impossible d\'extraire le contenu du SVG');
  }
  const svgContent = svgContentMatch[1];

  // Créer un SVG temporaire avec le logo centré sur fond carré
  const tempSvg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}"/>
  <g transform="translate(${x}, ${y}) scale(${logoWidth / svgWidth})">
    ${svgContent}
  </g>
</svg>`;

  const outputPath = path.join(OUTPUT_DIR, iconName);

  // Générer le PNG
  await sharp(Buffer.from(tempSvg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`  ✅ Créé: ${iconName}`);
}

async function generateAllIcons() {
  console.log('🎨 Génération des icônes à partir du logo SVG...\n');
  console.log(`Source: ${SVG_PATH}`);
  console.log(`Destination: ${OUTPUT_DIR}\n`);

  try {
    // Vérifier que le fichier SVG existe
    if (!fs.existsSync(SVG_PATH)) {
      throw new Error(`Le fichier SVG n'existe pas: ${SVG_PATH}`);
    }

    // Générer toutes les icônes
    for (const icon of ICONS) {
      await generateIcon(icon.name, icon.size);
    }

    console.log('\n✨ Toutes les icônes ont été générées avec succès!');
    console.log('\n📝 Fichiers générés:');
    ICONS.forEach(icon => {
      console.log(`   - ${icon.name} (${icon.size}x${icon.size}px)`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

generateAllIcons();

