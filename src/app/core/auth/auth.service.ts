import { Injectable, computed, signal } from '@angular/core';
//Changer pour Supabase
// Les profils viendront de la table "profiles" (supabase.from('profiles')), plus de ce JSON.
import users from '../data/mock/users.json';
import { UserProfile } from '../models/user.model';

//Changer pour Supabase
// Clé inutile avec Supabase : la session est gérée par supabase.auth (getSession / onAuthStateChange).
const STORAGE_KEY = 'wjdr-user-id';

/**
 * Authentification simulée : on choisit son profil dans une liste.
 * Sera remplacée par Supabase Auth (session + table profiles).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly availableUsers = users as UserProfile[];

  private readonly currentUser = signal<UserProfile | null>(this.restore());
  readonly user = this.currentUser.asReadonly();
  readonly isGm = computed(() => this.currentUser()?.role === 'mj');

  //Changer pour Supabase
  // Remplacer par supabase.auth.signInWithPassword({ email, password }) (ou signInWithOtp),
  // puis charger le profil correspondant à session.user.id.
  login(userId: string): void {
    const user = this.availableUsers.find((u) => u.id === userId) ?? null;
    this.currentUser.set(user);
    if (user) storage()?.setItem(STORAGE_KEY, user.id);
  }

  //Changer pour Supabase
  // Remplacer par supabase.auth.signOut().
  logout(): void {
    this.currentUser.set(null);
    storage()?.removeItem(STORAGE_KEY);
  }

  //Changer pour Supabase
  // Remplacer par la restauration de session : supabase.auth.getSession().
  private restore(): UserProfile | null {
    const id = storage()?.getItem(STORAGE_KEY);
    return this.availableUsers.find((u) => u.id === id) ?? null;
  }
}

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}
