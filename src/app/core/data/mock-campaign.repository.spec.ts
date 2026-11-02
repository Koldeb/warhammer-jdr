import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { MockCampaignRepository } from './mock-campaign.repository';

describe('MockCampaignRepository — règles d\'accès', () => {
  let repo: MockCampaignRepository;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [MockCampaignRepository] });
    repo = TestBed.inject(MockCampaignRepository);
    auth = TestBed.inject(AuthService);
  });

  it('un joueur ne voit que sa fiche', async () => {
    auth.login('julie');
    const characters = await repo.getCharacters();
    expect(characters.map((c) => c.id)).toEqual(['thorek-gromsson']);
  });

  it("un joueur ne peut pas ouvrir la fiche d'un autre", async () => {
    auth.login('julie');
    expect(await repo.getCharacter('johann-weber')).toBeUndefined();
    expect(await repo.getCharacter('thorek-gromsson')).toBeDefined();
  });

  it('le MJ voit toutes les fiches', async () => {
    auth.login('paul');
    expect(await repo.getCharacters()).toHaveLength(4);
  });

  it('personne non connecté ne voit aucune fiche', async () => {
    expect(await repo.getCharacters()).toEqual([]);
  });

  it('les notes MJ sont cachées aux joueurs', async () => {
    auth.login('sophie');
    expect(await repo.getGmNotes('session-1')).toBeUndefined();
    auth.login('paul');
    expect((await repo.getGmNotes('session-1'))?.content).toContain('Vossberg');
  });

  it('les séances sont visibles par les joueurs', async () => {
    auth.login('marc');
    expect(await repo.getSessions()).toHaveLength(3);
  });
});

describe('MockCampaignRepository — modification des fiches', () => {
  let repo: MockCampaignRepository;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [MockCampaignRepository] });
    repo = TestBed.inject(MockCampaignRepository);
    auth = TestBed.inject(AuthService);
  });

  it('un joueur peut modifier sa fiche', async () => {
    auth.login('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    thorek.wounds.current = 1;
    await repo.updateCharacter(thorek);
    expect((await repo.getCharacter('thorek-gromsson'))!.wounds.current).toBe(1);
  });

  it("un joueur ne peut pas modifier la fiche d'un autre", async () => {
    auth.login('paul');
    const johann = (await repo.getCharacter('johann-weber'))!;
    auth.login('julie');
    await expect(repo.updateCharacter(johann)).rejects.toThrow();
  });

  it('un joueur ne peut pas changer le propriétaire de sa fiche', async () => {
    auth.login('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    thorek.playerId = 'antoine';
    const saved = await repo.updateCharacter(thorek);
    expect(saved.playerId).toBe('julie');
  });

  it('le MJ peut modifier toutes les fiches', async () => {
    auth.login('paul');
    const lotte = (await repo.getCharacter('lotte-fauxchemin'))!;
    lotte.corruption = 2;
    await expect(repo.updateCharacter(lotte)).resolves.toMatchObject({ corruption: 2 });
  });

  it('les modifications survivent à une nouvelle instance (localStorage)', async () => {
    auth.login('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    thorek.experience.current = 999;
    await repo.updateCharacter(thorek);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [MockCampaignRepository] });
    const fresh = TestBed.inject(MockCampaignRepository);
    expect((await fresh.getCharacter('thorek-gromsson'))!.experience.current).toBe(999);
  });
});

describe('MockCampaignRepository — plafonds', () => {
  it("plafonne les valeurs à l'enregistrement, même sans passer par l'interface", async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [MockCampaignRepository] });
    const repo = TestBed.inject(MockCampaignRepository);
    TestBed.inject(AuthService).login('antoine');
    const johann = (await repo.getCharacter('johann-weber'))!;
    johann.points.fortune = 50;
    johann.wounds.current = 50;
    const saved = await repo.updateCharacter(johann);
    expect(saved.points.fortune).toBe(2);
    expect(saved.wounds.current).toBe(12);
  });
});
