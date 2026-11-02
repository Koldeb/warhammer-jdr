import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
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
    // Remplacer par SupabaseCampaignRepository quand la base sera prête.
    { provide: CampaignRepository, useClass: MockCampaignRepository },
  ],
};
