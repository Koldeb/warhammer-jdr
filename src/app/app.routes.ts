import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'connexion',
    title: 'Connexion',
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        title: 'Groupe',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'personnages/:id',
        title: 'Fiche de personnage',
        loadComponent: () =>
          import('./features/characters/character-sheet.page').then((m) => m.CharacterSheetPage),
      },
      {
        path: 'journal',
        title: 'Journal',
        loadComponent: () => import('./features/journal/journal.page').then((m) => m.JournalPage),
      },
      {
        path: 'journal/:id',
        title: 'Séance',
        loadComponent: () => import('./features/journal/session.page').then((m) => m.SessionPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
