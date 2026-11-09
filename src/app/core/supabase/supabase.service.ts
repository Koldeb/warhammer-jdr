import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Client Supabase partagé, créé à la première utilisation et uniquement dans le navigateur
 * (la session est stockée dans le localStorage). Le SDK est chargé à la demande pour ne pas
 * alourdir le premier chargement, notamment en mode démo où il n'est jamais utilisé.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private instance?: Promise<SupabaseClient>;

  /** Faux tant que l'URL et la clé de environment.ts n'ont pas été renseignées. */
  readonly configured = isConfigured(environment.supabase);

  /** Null côté serveur ou si Supabase n'est pas configuré. */
  client(): Promise<SupabaseClient | null> {
    if (!this.configured || !this.isBrowser) return Promise.resolve(null);
    this.instance ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(environment.supabase.url, environment.supabase.anonKey),
    );
    return this.instance;
  }
}

function isConfigured({ url, anonKey }: { url: string; anonKey: string }): boolean {
  return /^https:\/\/.+/.test(url) && !url.includes('VOTRE-PROJET') && !anonKey.startsWith('VOTRE-');
}
