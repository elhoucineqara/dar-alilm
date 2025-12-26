import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Récupérer l'origine de la requête
  const origin = request.headers.get('origin');
  
  // Liste des origines autorisées
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:5174',
    // Ajoutez d'autres origines si nécessaire
  ];

  // Gérer les requêtes preflight OPTIONS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 heures
    
    return response;
  }

  // Pour toutes les autres requêtes
  const response = NextResponse.next();
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Spécifier les routes où appliquer le middleware
export const config = {
  matcher: '/api/:path*', // Applique seulement aux routes API
};

