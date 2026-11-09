import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { MockCampaignRepository } from '../../core/data/mock-campaign.repository';
import { CharacterSheetPage } from './character-sheet.page';

describe('CharacterSheetPage', () => {
  async function setup(user = 'julie', characterId = 'thorek-gromsson') {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CampaignRepository, useClass: MockCampaignRepository }],
    });
    TestBed.inject(AuthService).impersonate(user);
    const fixture = TestBed.createComponent(CharacterSheetPage);
    fixture.componentRef.setInput('id', characterId);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, repo: TestBed.inject(CampaignRepository) };
  }

  it('lance un test en cliquant sur une caractéristique', async () => {
    const { fixture, el } = await setup();
    el.querySelector<HTMLButtonElement>('button[title="Test de Capacité de Combat"]')!.click();
    await fixture.whenStable();
    const log = el.querySelector('app-roll-log')!.textContent!;
    expect(log).toContain('Capacité de Combat');
    expect(log).toMatch(/Réussite|Échec/);
    expect(log).toContain('/ 100');
    expect(log).toContain('cible 47');
  });

  it('les boutons +/− modifient et enregistrent les blessures', async () => {
    const { fixture, el, repo } = await setup();
    el.querySelector<HTMLButtonElement>('button[aria-label="Ajouter une blessure"]')!.click();
    await fixture.whenStable();
    expect((await repo.getCharacter('thorek-gromsson'))!.wounds.current).toBe(5);
  });

  it('la Fortune ne dépasse pas le Destin', async () => {
    const { el } = await setup();
    // Thorek : Destin 0, Fortune 0
    expect(el.querySelector<HTMLButtonElement>('button[aria-label="Récupérer un point de Fortune"]')!.disabled).toBe(true);
  });

  it('la Détermination ne dépasse pas la Résilience', async () => {
    // Thorek : Détermination 3 / Résilience 3
    const { el } = await setup();
    expect(el.querySelector<HTMLButtonElement>('button[aria-label="Récupérer un point de Détermination"]')!.disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('button[aria-label="Dépenser un point de Détermination"]')!.disabled).toBe(false);
  });

  it('relance un test raté en dépensant 1 Fortune, une seule fois', async () => {
    // Johann : Fortune 2 / Destin 2
    const { fixture, el, repo } = await setup('antoine', 'johann-weber');
    const select = el.querySelector<HTMLSelectElement>('select')!;
    select.value = String(select.options.length - 1); // Très ardu
    select.dispatchEvent(new Event('change'));

    const findReroll = () =>
      [...el.querySelectorAll<HTMLButtonElement>('app-roll-log button')].find((b) =>
        b.textContent?.includes('Relancer'),
      );
    // Lance jusqu'à obtenir un échec (cible 10 : ~90 % d'échecs).
    for (let i = 0; i < 50 && !findReroll(); i++) {
      el.querySelector<HTMLButtonElement>('button[title="Test de Capacité de Combat"]')!.click();
      await fixture.whenStable();
    }
    const before = [...el.querySelectorAll('app-roll-log li')].length;
    findReroll()!.click();
    await fixture.whenStable();

    expect((await repo.getCharacter('johann-weber'))!.points.fortune).toBe(1);
    const first = el.querySelector('app-roll-log li')!;
    expect(first.textContent).toContain('Relancé (1 Fortune)');
    expect(first.textContent).not.toContain('Relancer');
    expect(el.querySelectorAll('app-roll-log li').length).toBe(before);
  });
});
