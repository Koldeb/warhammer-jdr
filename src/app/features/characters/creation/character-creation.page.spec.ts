import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CampaignRepository } from '../../../core/data/campaign.repository';
import { MockCampaignRepository } from '../../../core/data/mock-campaign.repository';
import { CharacterCreationPage } from './character-creation.page';

describe('CharacterCreationPage', () => {
  async function setup(user = 'paul') {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CampaignRepository, useClass: MockCampaignRepository },
      ],
    });
    TestBed.inject(AuthService).impersonate(user);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CharacterCreationPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;
    return { fixture, el, button, navigate, repo: TestBed.inject(CampaignRepository) };
  }

  it('crée un personnage complet au hasard', async () => {
    const { fixture, button, navigate, repo } = await setup();
    const before = (await repo.getCharacters()).length;

    button('Tout au hasard').click();
    await fixture.whenStable();
    expect(button('Créer le personnage').disabled).toBe(false);

    button('Créer le personnage').click();
    await fixture.whenStable();
    const characters = await repo.getCharacters();
    expect(characters).toHaveLength(before + 1);
    const created = characters.at(-1)!;
    expect(created.experience.current).toBe(120);
    expect(created.skills.filter((s) => s.career)).toHaveLength(8);
    expect(navigate).toHaveBeenCalledWith(['/personnages', created.id]);
  });

  it('bloque la création tant que la fiche faite à la main est incomplète', async () => {
    const { el, button } = await setup();
    expect(button('Créer le personnage').disabled).toBe(true);
    expect(el.textContent).toContain('Choisir une carrière.');
  });

  it('affiche les options du MJ (joueur, cacher) au MJ seulement', async () => {
    const gm = await setup('paul');
    expect(gm.el.textContent).toContain('Cacher aux joueurs');
    TestBed.resetTestingModule();
    const player = await setup('julie');
    expect(player.el.textContent).not.toContain('Cacher aux joueurs');
  });
});
