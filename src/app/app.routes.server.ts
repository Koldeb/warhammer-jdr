import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Le contenu dépend de l'utilisateur connecté (session côté navigateur) : rendu client.
  { path: '**', renderMode: RenderMode.Client },
];
