/**
 * Script pour changer les dates de création des cours
 * Usage: node scripts/update-course-dates.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB
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

// Schéma simplifié de cours
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: false });

async function updateCourseDates() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const Course = mongoose.model('Course', courseSchema);

    // Récupérer tous les cours
    const courses = await Course.find({});
    
    if (courses.length === 0) {
      console.log('⚠️  Aucun cours trouvé dans la base de données.');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 ${courses.length} cours trouvé(s)\n`);
    console.log('🔄 Mise à jour des dates...\n');

    // Mettre à jour chaque cours avec une date aléatoire
    for (const course of courses) {
      const oldDate = course.createdAt;
      const newCreatedDate = getRandomPastDate(365); // Dernière année
      
      // updatedAt sera légèrement après createdAt
      const daysDiff = Math.floor(Math.random() * 60) + 1; // Entre 1 et 60 jours après
      const newUpdatedDate = new Date(newCreatedDate);
      newUpdatedDate.setDate(newUpdatedDate.getDate() + daysDiff);
      
      // Ne pas dépasser aujourd'hui
      if (newUpdatedDate > new Date()) {
        newUpdatedDate.setTime(new Date().getTime());
      }

      await Course.updateOne(
        { _id: course._id },
        { 
          $set: { 
            createdAt: newCreatedDate,
            updatedAt: newUpdatedDate
          } 
        }
      );

      console.log(`✅ ${course.title}`);
      console.log(`   Ancienne date: ${oldDate?.toLocaleDateString('fr-FR')} ${oldDate?.toLocaleTimeString('fr-FR')}`);
      console.log(`   Nouvelle date: ${newCreatedDate.toLocaleDateString('fr-FR')} ${newCreatedDate.toLocaleTimeString('fr-FR')}`);
      console.log(`   Mise à jour:   ${newUpdatedDate.toLocaleDateString('fr-FR')} ${newUpdatedDate.toLocaleTimeString('fr-FR')}\n`);
    }

    console.log('✨ Mise à jour terminée avec succès !');
    console.log(`📅 ${courses.length} cours mis à jour avec de nouvelles dates\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le script
updateCourseDates();

