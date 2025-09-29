/**
 * Script de diagnostic et réparation des routes API
 * Ce script analyse les fichiers JavaScript pour trouver et corriger les erreurs de syntaxe
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Dossiers à analyser
const directories = [
  path.join(__dirname, '..', 'api'),
  path.join(__dirname, '..', 'api', 'routes'),
  path.join(__dirname, '..', 'api', 'config'),
  path.join(__dirname, '..', 'api', 'services'),
  path.join(__dirname, '..', 'api', 'migrations')
];

// Fonction pour vérifier la syntaxe d'un fichier JavaScript
function checkSyntax(filePath) {
  try {
    // Utilise Node pour vérifier la syntaxe sans exécuter le code
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      file: filePath
    };
  }
}

// Fonction pour scanner récursivement un dossier
function scanDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...scanDirectory(filePath));
    } else if (file.endsWith('.js')) {
      const result = checkSyntax(filePath);
      if (!result.valid) {
        results.push(result);
      }
    }
  }
  
  return results;
}

// Fonction principale
async function main() {
  console.log('🔍 Analyse des fichiers JavaScript pour trouver des erreurs de syntaxe...');
  
  let errors = [];
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      const dirErrors = scanDirectory(dir);
      errors = [...errors, ...dirErrors];
    }
  }
  
  if (errors.length === 0) {
    console.log('✅ Aucune erreur de syntaxe détectée dans les fichiers JavaScript.');
  } else {
    console.log(`❌ ${errors.length} erreur(s) de syntaxe détectée(s):`);
    
    for (const error of errors) {
      console.log(`\nFichier: ${error.file}`);
      console.log(`Erreur: ${error.error}`);
      
      // Lire le contenu du fichier
      const content = fs.readFileSync(error.file, 'utf8');
      console.log('\nContenu du fichier avec erreur:');
      console.log('----------------------------');
      console.log(content);
      console.log('----------------------------');
    }
  }
}

main().catch(err => {
  console.error('Erreur lors de l\'exécution du script:', err);
  process.exit(1);
});