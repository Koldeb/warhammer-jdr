import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CampaignRepository } from './core/data/campaign.repository';
import { MockCampaignRepository } from './core/data/mock-campaign.repository';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // Transitions animées entre les pages (API View Transitions, ignorée si non supportée).
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition }) => {
          if (matchMedia('(prefers-reduced-motion: reduce)').matches) transition.skipTransition();
        },
      }),
    ),
    provideClientHydration(),
    // Icônes : police Material Symbols chargée dans index.html.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } satisfies MatFormFieldDefaultOptions,
    },
    //Changer pour Supabase
    // La connexion passe déjà par Supabase (AuthService), mais les données (fiches, séances) sont
    // encore mockées. Fournir ici un SupabaseCampaignRepository quand les tables seront créées,
    // en gardant MockCampaignRepository pour le mode démo (auth.isDemo()).
    { provide: CampaignRepository, useClass: MockCampaignRepository },
  ],
};
