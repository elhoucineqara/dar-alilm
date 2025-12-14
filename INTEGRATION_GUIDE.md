# Guide d'Intégration du Système de Recommandation

## 📋 Vue d'ensemble

Ce guide vous explique comment intégrer le système de recommandation Python avec votre application Next.js.

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Next.js App   │ ──────> │  Python Service  │ ──────> │    MongoDB      │
│   (Frontend)    │         │   (FastAPI)      │         │   (Database)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## 🚀 Étapes d'Installation

### 1. Installer le Service Python

```bash
cd recommendation-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurer les Variables d'Environnement

**Dans `recommendation-service/.env` :**
```env
MONGODB_URI=mongodb+srv://elhoucineqara114:lLTLOoMYuo1fbIUu@gigdb.zbcmc.mongodb.net/?appName=gigdb
MONGODB_DB_NAME=lms
PORT=8000
```

**Dans `.env.local` (Next.js) :**
```env
RECOMMENDATION_SERVICE_URL=http://localhost:8000
# En production: https://votre-service-python.railway.app
```

### 3. Créer la Collection MongoDB pour les Interactions

Le service Python attend une collection `user_interactions` avec cette structure :
```json
{
  "user_id": "string",
  "course_id": "string",
  "interaction_type": "view|enroll|complete|like|rating",
  "rating": 1-5 (optionnel),
  "timestamp": ISODate
}
```

### 4. Démarrer le Service Python

```bash
cd recommendation-service
python -m uvicorn app.main:app --reload --port 8000
```

### 5. Tester l'API

```bash
# Test de santé
curl http://localhost:8000/health

# Obtenir des recommandations
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "limit": 10}'
```

## 📱 Utilisation dans Next.js

### Enregistrer une Interaction

```typescript
// Quand un utilisateur visualise un cours
await fetch('/api/recommendations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    courseId: course._id,
    interactionType: 'view'
  })
});
```

### Obtenir des Recommandations

```typescript
const response = await fetch('/api/recommendations?limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { recommendations } = await response.json();
// recommendations = [{ course_id, score, methods }, ...]
```

### Obtenir des Cours Similaires

```typescript
const response = await fetch(`/api/recommendations/similar?courseId=${courseId}&limit=5`);
const { similarCourses } = await response.json();
```

## 🔄 Synchronisation des Données

Le service Python lit directement depuis MongoDB. Assurez-vous que :
1. Les IDs utilisateur et cours sont des strings
2. La collection `user_interactions` existe
3. Les cours ont un champ `status: "published"`

## 🚢 Déploiement

### Option 1: Railway (Recommandé)

1. Créer un compte sur [Railway](https://railway.app)
2. Créer un nouveau projet
3. Connecter votre repo GitHub
4. Sélectionner le dossier `recommendation-service`
5. Ajouter les variables d'environnement
6. Déployer

### Option 2: Render

1. Créer un compte sur [Render](https://render.com)
2. Créer un nouveau "Web Service"
3. Connecter votre repo
4. Configurer :
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Ajouter les variables d'environnement

### Option 3: Docker + VPS

Voir `recommendation-service/Dockerfile` (à créer)

## 🔧 Personnalisation

### Ajuster les Poids des Interactions

Dans `recommendation-service/app/recommender.py` :
```python
weights = {
    'view': 1.0,      # Modifier ces valeurs
    'enroll': 3.0,
    'complete': 5.0,
    'like': 2.0,
    'rating': 4.0
}
```

### Ajuster le Ratio Collaborative/Content-Based

Dans `recommendation-service/app/recommender.py` :
```python
collaborative_weight = 0.6  # Modifier
content_weight = 0.4        # Modifier
```

## 📊 Monitoring

Ajouter des logs et métriques pour suivre :
- Nombre de recommandations générées
- Temps de réponse
- Taux de clics sur les recommandations

## 🐛 Dépannage

### Le service ne démarre pas
- Vérifier que MongoDB est accessible
- Vérifier les variables d'environnement
- Vérifier les ports (8000 par défaut)

### Pas de recommandations
- Vérifier qu'il y a des interactions dans MongoDB
- Vérifier que les cours sont publiés (`status: "published"`)
- Vérifier les logs du service Python

### Erreurs CORS
- Vérifier que CORS est configuré dans `main.py`
- Ajouter votre domaine Next.js dans `allow_origins`

## 📚 Ressources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Scikit-learn Documentation](https://scikit-learn.org/)
- [MongoDB Python Driver](https://pymongo.readthedocs.io/)

