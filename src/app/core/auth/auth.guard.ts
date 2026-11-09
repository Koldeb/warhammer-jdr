import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CampaignRepository } from '../data/campaign.repository';
import { AuthService } from './auth.service';

/** Pages réservées aux utilisateurs connectés ; mémorise la page demandée pour y revenir. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? true : router.createUrlTree(['/connexion'], { queryParams: { redirect: state.url } });
};

/** Création de personnage : le MJ, ou un joueur dont le personnage est mort (voir CampaignRepository). */
export const characterCreationGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const repo = inject(CampaignRepository);
  const router = inject(Router);
  await auth.ready;
  return (await repo.canCreateCharacter()) ? true : router.createUrlTree(['/']);
};

/** Page de connexion : inutile si l'on est déjà connecté. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.user() ? router.createUrlTree(['/']) : true;
};
