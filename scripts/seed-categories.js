/**
 * Script de seed pour créer des catégories de test
 * Usage: node scripts/seed-categories.js
 */

const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

// Schéma de catégorie
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
}, { timestamps: true });

// Catégories à créer
const categories = [
  {
    name: 'Web Development',
    description: 'Master modern web technologies. Learn HTML, CSS, JavaScript, React, Node.js, and full-stack development to build powerful web applications.'
  },
  {
    name: 'Data Science',
    description: 'Explore the world of data analysis and machine learning. Learn Python, statistics, data visualization, and AI techniques to extract insights from data.'
  },
  {
    name: 'Mobile Development',
    description: 'Create stunning mobile applications for iOS and Android. Learn React Native, Flutter, Swift, and Kotlin to build cross-platform and native apps.'
  },
  {
    name: 'Cloud Computing',
    description: 'Master cloud platforms and DevOps practices. Learn AWS, Azure, Docker, Kubernetes, and CI/CD to deploy and scale applications.'
  },
  {
    name: 'Cybersecurity',
    description: 'Protect systems and networks from digital attacks. Learn ethical hacking, network security, cryptography, and security best practices.'
  },
  {
    name: 'UI/UX Design',
    description: 'Create beautiful and intuitive user experiences. Learn design principles, prototyping, user research, and tools like Figma and Adobe XD.'
  },
  {
    name: 'Business & Marketing',
    description: 'Develop essential business skills and marketing strategies. Learn digital marketing, SEO, social media, and business analytics.'
  },
  {
    name: 'Artificial Intelligence',
    description: 'Dive into the world of AI and deep learning. Learn neural networks, computer vision, natural language processing, and AI frameworks.'
  },
  {
    name: 'Game Development',
    description: 'Create immersive gaming experiences. Learn Unity, Unreal Engine, game design principles, and 3D graphics programming.'
  },
  {
    name: 'Database Management',
    description: 'Master database design and management. Learn SQL, NoSQL, MongoDB, PostgreSQL, and database optimization techniques.'
  }
];

async function seedCategories() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const Category = mongoose.model('Category', categorySchema);

    // Supprimer les catégories existantes (optionnel)
    console.log('🗑️  Nettoyage des catégories existantes...');
    await Category.deleteMany({});
    console.log('✅ Catégories existantes supprimées\n');

    console.log('🌱 Création de nouvelles catégories...\n');

    // Créer les catégories
    let count = 0;
    for (const categoryData of categories) {
      try {
        const category = await Category.create(categoryData);
        count++;
        console.log(`✅ ${count}. ${category.name}`);
      } catch (error) {
        console.log(`❌ Erreur lors de la création de "${categoryData.name}": ${error.message}`);
      }
    }

    console.log(`\n✨ ${count} catégorie(s) créée(s) avec succès !`);
    console.log('\n💡 Maintenant vous pouvez exécuter: npm run update-dates\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le script
seedCategories();

