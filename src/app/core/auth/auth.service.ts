import { Injectable, computed, inject, signal } from '@angular/core';
import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import users from '../data/mock/users.json';
import { Role, UserProfile } from '../models/user.model';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * - supabase : vrai compte (e-mail + mot de passe), profil lu dans la table "profiles" ;
 * - demo : identifiants de démonstration, profils et données mockés.
 */
export type AuthMode = 'supabase' | 'demo';

/** Profil de démo actif (permet de "voir en tant que" un autre joueur). */
const DEMO_STORAGE_KEY = 'wjdr-demo-profile';
/** En démo, on se connecte en tant que MJ pour tout voir. */
const DEMO_DEFAULT_PROFILE = 'paul';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  /** Profils mockés, utilisés uniquement en mode démo. */
  readonly demoProfiles = users as UserProfile[];

  private readonly currentUser = signal<UserProfile | null>(null);
  private readonly currentMode = signal<AuthMode | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly mode = this.currentMode.asReadonly();
  readonly isGm = computed(() => this.currentUser()?.role === 'mj');
  readonly isDemo = computed(() => this.currentMode() === 'demo');
  /** Faux tant que environment.ts ne contient pas les clés du projet Supabase. */
  readonly supabaseConfigured = this.supabase.configured;

  /** Résolue une fois la session précédente restaurée (le guard l'attend). */
  readonly ready: Promise<void> = this.restore();

  /** Connexion Supabase. Rejette avec un message en français si elle échoue. */
  async signIn(email: string, password: string): Promise<void> {
    const client = await this.supabase.client();
    if (!client) throw new Error("La connexion n'est pas encore configurée.");

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(authErrorMessage(error));

    this.clearDemo();
    this.currentUser.set(await loadProfile(client, data.user));
    this.currentMode.set('supabase');
  }

  /** Connexion à la démo. Renvoie faux si les identifiants sont incorrects. */
  signInDemo(login: string, password: string): boolean {
    const ok =
      normalize(login) === normalize(environment.demo.login) &&
      normalize(password) === normalize(environment.demo.password);
    if (ok) this.impersonate(DEMO_DEFAULT_PROFILE);
    return ok;
  }

  /** Mode démo : bascule sur un profil mocké (MJ ou joueur). */
  impersonate(profileId: string): void {
    const profile = this.demoProfiles.find((p) => p.id === profileId);
    if (!profile) return;
    this.currentUser.set(profile);
    this.currentMode.set('demo');
    storage()?.setItem(DEMO_STORAGE_KEY, profile.id);
  }

  async signOut(): Promise<void> {
    if (this.currentMode() === 'supabase') await (await this.supabase.client())?.auth.signOut();
    this.clearDemo();
    this.currentUser.set(null);
    this.currentMode.set(null);
  }

  private async restore(): Promise<void> {
    const demoId = storage()?.getItem(DEMO_STORAGE_KEY);
    if (demoId) {
      this.impersonate(demoId);
      return;
    }

    const client = await this.supabase.client();
    if (!client) return;
    client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && this.currentMode() === 'supabase') {
        this.currentUser.set(null);
        this.currentMode.set(null);
      }
    });
    try {
      const { data } = await client.auth.getSession();
      if (data.session) {
        this.currentUser.set(await loadProfile(client, data.session.user));
        this.currentMode.set('supabase');
      }
    } catch {
      // Session illisible ou serveur injoignable : l'utilisateur devra se reconnecter.
    }
  }

  private clearDemo(): void {
    storage()?.removeItem(DEMO_STORAGE_KEY);
  }
}

/** Profil applicatif (table "profiles", voir supabase/schema.sql). */
async function loadProfile(client: SupabaseClient, user: User): Promise<UserProfile> {
  const { data } = await client
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', user.id)
    .maybeSingle<{ id: string; display_name: string; role: Role }>();
  return {
    id: user.id,
    displayName: data?.display_name ?? user.user_metadata?.['display_name'] ?? user.email ?? 'Aventurier',
    role: data?.role ?? 'joueur',
  };
}

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou mot de passe incorrect.';
    case 'email_not_confirmed':
      return "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre boîte de réception.";
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 'user_banned':
      return 'Ce compte a été suspendu.';
  }
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }
  return 'La connexion a échoué. Réessayez dans un instant.';
}

/** Insensible à la casse, aux accents et aux espaces autour ("Démo " = "demo"). */
function normalize(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}
