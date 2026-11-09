import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Pages plein écran, sans barre de navigation (data.bare, voir App).
  {
    path: 'connexion',
    title: 'Connexion',
    canActivate: [guestGuard],
    data: { bare: true },
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'demo',
    title: 'Démonstration',
    data: { bare: true },
    loadComponent: () => import('./features/demo/demo.page').then((m) => m.DemoPage),
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
