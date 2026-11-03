import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { CampaignRepository } from './core/data/campaign.repository';
import { MockCampaignRepository } from './core/data/mock-campaign.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
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
    // Remplacer MockCampaignRepository par SupabaseCampaignRepository (à créer, en lisant
    // les clés de src/environments/environment.ts) quand la base sera prête.
    { provide: CampaignRepository, useClass: MockCampaignRepository },
  ],
};
