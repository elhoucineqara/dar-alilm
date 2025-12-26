/**
 * Script pour changer les dates de création des catégories
 * Usage: node scripts/update-category-dates.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB (change si nécessaire)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

// Fonction pour générer une date aléatoire dans le passé
function getRandomPastDate(daysBack = 180) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysBack);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - randomDays);
  pastDate.setHours(randomHours, randomMinutes, 0, 0);
  
  return pastDate;
}

// Schéma simplifié de catégorie
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: false });

async function updateCategoryDates() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const Category = mongoose.model('Category', categorySchema);

    // Récupérer toutes les catégories
    const categories = await Category.find({});
    
    if (categories.length === 0) {
      console.log('⚠️  Aucune catégorie trouvée dans la base de données.');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 ${categories.length} catégorie(s) trouvée(s)\n`);
    console.log('🔄 Mise à jour des dates...\n');

    // Mettre à jour chaque catégorie avec une date aléatoire
    for (const category of categories) {
      const oldDate = category.createdAt;
      const newCreatedDate = getRandomPastDate(180); // 6 derniers mois
      
      // updatedAt sera légèrement après createdAt
      const daysDiff = Math.floor(Math.random() * 30) + 1; // Entre 1 et 30 jours après
      const newUpdatedDate = new Date(newCreatedDate);
      newUpdatedDate.setDate(newUpdatedDate.getDate() + daysDiff);

      await Category.updateOne(
        { _id: category._id },
        { 
          $set: { 
            createdAt: newCreatedDate,
            updatedAt: newUpdatedDate
          } 
        }
      );

      console.log(`✅ ${category.name}`);
      console.log(`   Ancienne date: ${oldDate?.toLocaleDateString('fr-FR')} ${oldDate?.toLocaleTimeString('fr-FR')}`);
      console.log(`   Nouvelle date: ${newCreatedDate.toLocaleDateString('fr-FR')} ${newCreatedDate.toLocaleTimeString('fr-FR')}`);
      console.log(`   Mise à jour:   ${newUpdatedDate.toLocaleDateString('fr-FR')} ${newUpdatedDate.toLocaleTimeString('fr-FR')}\n`);
    }

    console.log('✨ Mise à jour terminée avec succès !');
    console.log(`📅 ${categories.length} catégorie(s) mise(s) à jour avec de nouvelles dates\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le script
updateCategoryDates();

