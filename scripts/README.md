# Scripts de gestion des dates 📅

Ce dossier contient des scripts utilitaires pour gérer les dates dans la base de données.

## Scripts disponibles

### 1. `update-category-dates.js`

Met à jour les dates de création des catégories avec des dates aléatoires dans le passé (6 derniers mois).

**Usage :**
```bash
npm run update-dates
```

Ou directement :
```bash
node scripts/update-category-dates.js
```

**Ce que fait le script :**
- ✅ Se connecte à MongoDB
- ✅ Récupère toutes les catégories
- ✅ Génère des dates aléatoires dans les 180 derniers jours
- ✅ Met à jour `createdAt` et `updatedAt`
- ✅ Affiche un résumé des modifications

**Exemple de sortie :**
```
🔌 Connexion à MongoDB...
✅ Connecté à MongoDB

📊 9 catégorie(s) trouvée(s)

🔄 Mise à jour des dates...

✅ Economics & Finance
   Ancienne date: 24/12/2025 12:45:30
   Nouvelle date: 15/08/2025 14:23:15
   Mise à jour:   28/08/2025 10:15:42

✅ Engineering Essentials
   Ancienne date: 24/12/2025 12:45:30
   Nouvelle date: 02/11/2025 09:12:45
   Mise à jour:   18/11/2025 16:30:22

...

✨ Mise à jour terminée avec succès !
📅 9 catégorie(s) mise(s) à jour avec de nouvelles dates
```

## Configuration

Les scripts utilisent la variable d'environnement `MONGODB_URI` depuis `.env.local`.

Si la variable n'est pas définie, ils utilisent par défaut :
```
mongodb://localhost:27017/lms
```

## Créer vos propres scripts

Vous pouvez créer d'autres scripts similaires pour :
- Mettre à jour les dates des cours
- Mettre à jour les dates d'inscription des étudiants
- Générer des dates de quiz
- Etc.

**Template de base :**
```javascript
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

async function updateData() {
  try {
    await mongoose.connect(MONGODB_URI);
    // Votre logique ici
    await mongoose.connection.close();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

updateData();
```

## Notes importantes

⚠️ **Attention :** Ces scripts modifient directement la base de données. Assurez-vous d'avoir une sauvegarde avant de les exécuter en production.

💡 **Conseil :** Testez d'abord sur une base de données de développement.

🔒 **Sécurité :** Ne commitez jamais vos fichiers `.env.local` contenant vos credentials MongoDB.

