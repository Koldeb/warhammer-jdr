import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { NewCharacter } from '../models/character.model';
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
    auth.impersonate('julie');
    const characters = await repo.getCharacters();
    expect(characters.map((c) => c.id)).toEqual(['thorek-gromsson']);
  });

  it("un joueur ne peut pas ouvrir la fiche d'un autre", async () => {
    auth.impersonate('julie');
    expect(await repo.getCharacter('johann-weber')).toBeUndefined();
    expect(await repo.getCharacter('thorek-gromsson')).toBeDefined();
  });

  it('le MJ voit toutes les fiches', async () => {
    auth.impersonate('paul');
    expect(await repo.getCharacters()).toHaveLength(4);
  });

  it('personne non connecté ne voit aucune fiche', async () => {
    expect(await repo.getCharacters()).toEqual([]);
  });

  it('les notes MJ sont cachées aux joueurs', async () => {
    auth.impersonate('sophie');
    expect(await repo.getGmNotes('session-1')).toBeUndefined();
    auth.impersonate('paul');
    expect((await repo.getGmNotes('session-1'))?.content).toContain('Vossberg');
  });

  it('les séances sont visibles par les joueurs', async () => {
    auth.impersonate('marc');
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
    auth.impersonate('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    thorek.wounds.current = 1;
    await repo.updateCharacter(thorek);
    expect((await repo.getCharacter('thorek-gromsson'))!.wounds.current).toBe(1);
  });

  it("un joueur ne peut pas modifier la fiche d'un autre", async () => {
    auth.impersonate('paul');
    const johann = (await repo.getCharacter('johann-weber'))!;
    auth.impersonate('julie');
    await expect(repo.updateCharacter(johann)).rejects.toThrow();
  });

  it('un joueur ne peut pas changer le propriétaire de sa fiche', async () => {
    auth.impersonate('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    thorek.playerId = 'antoine';
    const saved = await repo.updateCharacter(thorek);
    expect(saved.playerId).toBe('julie');
  });

  it('le MJ peut modifier toutes les fiches', async () => {
    auth.impersonate('paul');
    const lotte = (await repo.getCharacter('lotte-fauxchemin'))!;
    lotte.corruption = 2;
    await expect(repo.updateCharacter(lotte)).resolves.toMatchObject({ corruption: 2 });
  });

  it('les modifications survivent à une nouvelle instance (localStorage)', async () => {
    auth.impersonate('julie');
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
    TestBed.inject(AuthService).impersonate('antoine');
    const johann = (await repo.getCharacter('johann-weber'))!;
    johann.points.fortune = 50;
    johann.wounds.current = 50;
    const saved = await repo.updateCharacter(johann);
    expect(saved.points.fortune).toBe(2);
    expect(saved.wounds.current).toBe(12);
  });
});

describe('MockCampaignRepository — création et personnages cachés', () => {
  let repo: MockCampaignRepository;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [MockCampaignRepository] });
    repo = TestBed.inject(MockCampaignRepository);
    auth = TestBed.inject(AuthService);
  });

  /** Fiche de Thorek sans id, prête à être recréée. */
  async function template(): Promise<NewCharacter> {
    auth.impersonate('paul');
    const { id: _id, campaignId: _c, ...rest } = (await repo.getCharacter('thorek-gromsson'))!;
    return { ...rest, name: 'Nouvelle recrue' };
  }

  async function killThorek(): Promise<void> {
    auth.impersonate('paul');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    await repo.updateCharacter({ ...thorek, deceased: true });
  }

  it('le MJ peut toujours créer un personnage', async () => {
    auth.impersonate('paul');
    expect(await repo.canCreateCharacter()).toBe(true);
  });

  it('un joueur dont le personnage est vivant ne peut pas en créer', async () => {
    const draft = await template();
    auth.impersonate('julie');
    expect(await repo.canCreateCharacter()).toBe(false);
    await expect(repo.createCharacter(draft)).rejects.toThrow();
  });

  it('un joueur dont le personnage est mort peut en créer un, une seule fois', async () => {
    const draft = await template();
    await killThorek();
    auth.impersonate('julie');
    expect(await repo.canCreateCharacter()).toBe(true);

    const created = await repo.createCharacter({ ...draft, playerId: 'antoine', hidden: true, deceased: true });
    expect(created).toMatchObject({ playerId: 'julie', hidden: false, deceased: false, campaignId: 'cendres-ubersreik' });
    expect(created.id).toBe('nouvelle-recrue');
    expect((await repo.getCharacters()).map((c) => c.id)).toEqual(['thorek-gromsson', 'nouvelle-recrue']);
    expect(await repo.canCreateCharacter()).toBe(false);
  });

  it('un joueur sans aucun personnage ne peut pas en créer', async () => {
    auth.impersonate('paul');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    await repo.updateCharacter({ ...thorek, playerId: 'paul' });
    auth.impersonate('julie');
    expect(await repo.canCreateCharacter()).toBe(false);
  });

  it('un personnage caché par le MJ est invisible pour son joueur', async () => {
    const draft = await template();
    const created = await repo.createCharacter({ ...draft, playerId: 'julie', hidden: true });
    expect(created.hidden).toBe(true);
    expect(await repo.getCharacter(created.id)).toBeDefined();

    auth.impersonate('julie');
    expect(await repo.getCharacter(created.id)).toBeUndefined();
    expect((await repo.getCharacters()).map((c) => c.id)).toEqual(['thorek-gromsson']);
  });

  it('un joueur ne peut ni ressusciter ni cacher son personnage', async () => {
    await killThorek();
    auth.impersonate('julie');
    const thorek = (await repo.getCharacter('thorek-gromsson'))!;
    const saved = await repo.updateCharacter({ ...thorek, deceased: false, hidden: true });
    expect(saved).toMatchObject({ deceased: true, hidden: undefined });
  });

  it('les identifiants créés sont uniques', async () => {
    const draft = await template();
    const a = await repo.createCharacter(draft);
    const b = await repo.createCharacter(draft);
    expect([a.id, b.id]).toEqual(['nouvelle-recrue', 'nouvelle-recrue-2']);
  });
});
