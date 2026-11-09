/**
 * Configuration de l'application.
 * Les valeurs Supabase se trouvent dans le tableau de bord : Project Settings → API.
 * La clé "anon" est publique par conception : la sécurité repose sur les policies RLS.
 */
export const environment = {
  supabase: {
    //Changer pour Supabase
    url: 'https://VOTRE-PROJET.supabase.co',
    //Changer pour Supabase
    anonKey: 'VOTRE-CLE-ANON-PUBLIQUE',
  },
  /** Identifiants de la page de démonstration (données mockées, aucun appel à Supabase). */
  demo: {
    login: 'admin',
    password: 'démo',
  },
};
