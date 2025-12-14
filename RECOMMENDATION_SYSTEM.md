# Guide d'Intégration du Système de Recommandation Python

## Architecture Recommandée

```
lms-dev/
├── recommendation-service/     # Service Python séparé
│   ├── app/
│   │   ├── main.py            # API FastAPI
│   │   ├── models.py          # Modèles de données
│   │   ├── recommender.py     # Algorithme de recommandation
│   │   └── database.py        # Connexion MongoDB
│   ├── requirements.txt
│   └── README.md
└── app/
    └── api/
        └── recommendations/
            └── route.ts       # Route Next.js qui appelle le service Python
```

## Étape 1 : Créer le Modèle d'Interaction Utilisateur

D'abord, vous devez créer un modèle pour tracker les interactions utilisateur (vues, achats, complétions, etc.)

## Étape 2 : Service Python avec FastAPI

Le service Python sera déployé séparément et appelé depuis Next.js.

## Étape 3 : Intégration Next.js

Créer une route API Next.js qui appelle le service Python.

## Types de Recommandations Possibles

1. **Collaborative Filtering** : Basé sur les préférences similaires d'autres utilisateurs
2. **Content-Based** : Basé sur les caractéristiques des cours (catégorie, tags, description)
3. **Hybrid** : Combinaison des deux approches

## Déploiement

- **Option 1** : Service Python sur un serveur séparé (Heroku, Railway, Render)
- **Option 2** : Vercel Serverless Functions (limité pour Python)
- **Option 3** : Docker container sur un VPS

