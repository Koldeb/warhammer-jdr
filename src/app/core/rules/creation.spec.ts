import { Species } from '../models/character.model';
import { DieRoller } from './dice';
import { CAREERS, RANDOM_TALENTS, SKILLS, SPECIES, TALENTS } from './creation-data';
import {
  advancesValid,
  buildCharacter,
  careerSkillsValid,
  careersFor,
  characteristicsValid,
  creationXp,
  detailsValid,
  newDraft,
  parseRef,
  randomDraft,
  resolveRef,
  rollCareer,
  rollCareers,
  rollSpecies,
  setCareer,
  speciesSkillsValid,
  talentsValid,
} from './creation';

/** Dé pseudo-aléatoire reproductible. */
function seeded(seed: number): DieRoller {
  let s = seed;
  return (sides) => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return (s % sides) + 1;
  };
}

/** Dé qui renvoie toujours la même valeur (bornée au nombre de faces). */
const fixed =
  (value: number): DieRoller =>
  (sides) =>
    Math.min(value, sides);

const ALL_SPECIES = Object.keys(SPECIES) as Species[];

describe('Données de création', () => {
  it('chaque carrière a 3 caractéristiques, 8 compétences et 4 talents connus', () => {
    expect(CAREERS).toHaveLength(64);
    for (const c of CAREERS) {
      expect(c.characteristics, c.name).toHaveLength(3);
      expect(c.skills, c.name).toHaveLength(8);
      expect(c.talents, c.name).toHaveLength(4);
      for (const s of c.skills) expect(SKILLS[parseRef(s).name], `${c.name} : ${s}`).toBeDefined();
      for (const t of c.talents)
        expect(TALENTS[parseRef(t).name], `${c.name} : ${t}`).toBeDefined();
    }
  });

  it('les compétences et talents des espèces sont connus', () => {
    for (const species of ALL_SPECIES) {
      const def = SPECIES[species];
      expect(def.skills).toHaveLength(12);
      for (const s of def.skills) expect(SKILLS[parseRef(s).name], s).toBeDefined();
      for (const t of def.talents.flat()) expect(TALENTS[parseRef(t).name], t).toBeDefined();
    }
    for (const [, t] of RANDOM_TALENTS) expect(TALENTS[parseRef(t).name], t).toBeDefined();
  });

  it('la table des carrières de chaque espèce est croissante et va jusqu’à 100', () => {
    for (const species of ALL_SPECIES) {
      const ranges = careersFor(species).map((c) => c.table[species]);
      expect(ranges.at(-1), species).toBe(100);
      expect(
        [...ranges].sort((a, b) => a - b),
        species,
      ).toEqual(ranges);
      expect(new Set(ranges).size, species).toBe(ranges.length);
    }
  });
});

describe('Tirages', () => {
  it("tire l'espèce selon la table", () => {
    expect(rollSpecies(fixed(1))).toBe('humain');
    expect(rollSpecies(fixed(90))).toBe('humain');
    expect(rollSpecies(fixed(91))).toBe('halfling');
    expect(rollSpecies(fixed(97))).toBe('nain');
    expect(rollSpecies(fixed(99))).toBe('haut-elfe');
    expect(rollSpecies(fixed(100))).toBe('elfe-sylvain');
  });

  it("tire une carrière accessible à l'espèce", () => {
    expect(rollCareer('humain', fixed(1)).name).toBe('Apothicaire');
    expect(rollCareer('humain', fixed(100)).name).toBe('Prêtre guerrier');
    expect(rollCareer('nain', fixed(100)).name).toBe('Tueur');
  });

  it('tire 3 carrières distinctes', () => {
    const careers = rollCareers('elfe-sylvain', 3, seeded(7));
    expect(new Set(careers).size).toBe(3);
  });
});

describe('Personnage au hasard', () => {
  it('respecte toutes les règles de création', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const d = randomDraft(seeded(seed));
      expect(characteristicsValid(d), `seed ${seed}`).toBe(true);
      expect(advancesValid(d), `seed ${seed}`).toBe(true);
      expect(speciesSkillsValid(d), `seed ${seed}`).toBe(true);
      expect(careerSkillsValid(d), `seed ${seed}`).toBe(true);
      expect(talentsValid(d), `seed ${seed}`).toBe(true);
      expect(detailsValid(d), `seed ${seed}`).toBe(true);
    }
  });

  it("rapporte le maximum d'XP : 20 (espèce) + 50 (carrière) + 50 (caractéristiques)", () => {
    expect(creationXp(randomDraft(seeded(1)))).toBe(120);
  });
});

describe('Fiche créée', () => {
  /** Humain Soldat, caractéristiques à la main. */
  function soldier() {
    const d = newDraft('humain');
    setCareer(d, 'Soldat', 'choix', []);
    d.rolls = { cc: 18, ct: 4, f: 10, e: 12, i: 10, ag: 10, dex: 8, int: 8, fm: 10, soc: 10 };
    d.characteristicAdvances = { cc: 3, e: 1, fm: 1 };
    d.extraFate = 1;
    d.speciesSkills = {
      ...d.speciesSkills,
      Calme: 5,
      'Corps à corps (Base)': 5,
      Charme: 5,
      Ragot: 3,
      Marchandage: 3,
      Évaluation: 3,
    };
    d.careerSkills = {
      ...d.careerSkills,
      'Corps à corps (Base)': 10,
      Calme: 10,
      Athlétisme: 10,
      Esquive: 10,
    };
    d.specializations['Musique (Tambour ou fifre)'] = 'Tambour';
    d.talentChoices[1] = 'Perspicace';
    d.randomTalents = ['Robuste', 'Vif', 'Chanceux'];
    d.careerTalent = 'Guerrier né';
    d.name = '  Klaus  ';
    return d;
  }

  it('valide le brouillon fait à la main', () => {
    const d = soldier();
    expect([
      characteristicsValid(d),
      advancesValid(d),
      speciesSkillsValid(d),
      careerSkillsValid(d),
      talentsValid(d),
    ]).toEqual([true, true, true, true, true]);
    expect(creationXp(d)).toBe(0);
  });

  it('applique base, tirage, augmentations et talents de +5', () => {
    const c = buildCharacter(soldier(), 'antoine', fixed(5));
    expect(c.name).toBe('Klaus');
    expect(c.characteristics.cc).toEqual({ initial: 20 + 18 + 5, advances: 3 }); // Guerrier né
    expect(c.characteristics.int.initial).toBe(20 + 8 + 5); // Perspicace
    expect(c.characteristics.i.initial).toBe(20 + 10 + 5); // Vif
  });

  it('additionne compétences d’espèce et de carrière', () => {
    const c = buildCharacter(soldier(), 'antoine', fixed(5));
    const melee = c.skills.find((s) => s.name === 'Corps à corps' && s.specialization === 'Base');
    expect(melee).toMatchObject({ advances: 15, career: true, characteristic: 'cc' });
    expect(c.skills.find((s) => s.name === 'Charme')).toMatchObject({ advances: 5, career: false });
    expect(c.skills.find((s) => s.name === 'Musique')?.specialization).toBe('Tambour');
    // Les 8 compétences de carrière sont toutes présentes, même à 0.
    expect(c.skills.filter((s) => s.career)).toHaveLength(8);
  });

  it('calcule Destin, Résilience, Blessures et argent', () => {
    const c = buildCharacter(soldier(), 'antoine', fixed(5));
    expect(c.points).toMatchObject({ fate: 3, fortune: 3, resilience: 3, resolve: 3 });
    // BF 3 + 2 × BE 3 + BFM 3 (E = 20 + 12 + 1, FM = 20 + 10 + 1)
    expect(c.wounds.current).toBe(12);
    expect(c.career).toMatchObject({
      name: 'Soldat',
      title: 'Recrue',
      level: 1,
      status: { tier: 'argent', standing: 1 },
    });
    expect(c.wealth).toEqual({ crowns: 0, shillings: 5, pennies: 0 });
  });

  it("range armes et armures à part et lance les dés de l'équipement", () => {
    const c = buildCharacter(soldier(), 'antoine', fixed(5));
    expect(c.weapons.map((w) => w.name)).toEqual(['Arme à une main', 'Dague', 'Épée']);
    expect(c.armour.map((a) => a.name)).toContain('Gilet de cuir');
    expect(c.trappings.map((t) => t.name)).toContain('Uniforme');
  });

  it('précise une spécialisation « au choix »', () => {
    expect(resolveRef('Métier (au choix)', { 'Métier (au choix)': 'Forgeron' })).toBe(
      'Métier (Forgeron)',
    );
    expect(resolveRef('Métier (au choix)', {})).toBe('Métier (au choix)');
    expect(resolveRef('Savoir (Droit)', { 'Savoir (Droit)': 'Autre' })).toBe('Savoir (Droit)');
  });
});
