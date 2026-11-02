import { Injectable, computed, signal } from '@angular/core';
import users from '../data/mock/users.json';
import { UserProfile } from '../models/user.model';

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

  login(userId: string): void {
    const user = this.availableUsers.find((u) => u.id === userId) ?? null;
    this.currentUser.set(user);
    if (user) storage()?.setItem(STORAGE_KEY, user.id);
  }

  logout(): void {
    this.currentUser.set(null);
    storage()?.removeItem(STORAGE_KEY);
  }

  private restore(): UserProfile | null {
    const id = storage()?.getItem(STORAGE_KEY);
    return this.availableUsers.find((u) => u.id === id) ?? null;
  }
}

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}
