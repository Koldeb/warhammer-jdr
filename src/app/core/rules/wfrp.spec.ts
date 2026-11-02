import { Character } from '../models/character.model';
import characters from '../data/mock/characters.json';
import { enforceLimits, maxWounds, skillValue, weaponDamage } from './wfrp';

const all = characters as Character[];
const byId = (id: string) => all.find((c) => c.id === id)!;

describe('règles WFRP', () => {
  it('calcule les blessures max (BF + 2×BE + BFM)', () => {
    // Johann : F 33 → 3, E 39 → 3, FM 34 → 3
    expect(maxWounds(byId('johann-weber'))).toBe(12);
  });

  it("n'ajoute pas le BF pour les Halflings", () => {
    // Lotte : E 27 → 2, FM 40 → 4
    expect(maxWounds(byId('lotte-fauxchemin'))).toBe(8);
  });

  it('additionne caractéristique et augmentations de compétence', () => {
    const johann = byId('johann-weber');
    const melee = johann.skills.find((s) => s.name === 'Corps à corps')!;
    expect(skillValue(johann, melee)).toBe(50);
  });

  it('ajoute le BF aux dégâts des armes de corps à corps', () => {
    const thorek = byId('thorek-gromsson');
    expect(weaponDamage(thorek, thorek.weapons[0])).toBe(8);
  });

  it('les blessures actuelles des mocks ne dépassent pas le max', () => {
    for (const c of all) expect(c.wounds.current).toBeLessThanOrEqual(maxWounds(c));
  });
});

describe('plafonds de la fiche (enforceLimits)', () => {
  it('ne laisse jamais une valeur dépasser son maximum', () => {
    const c = structuredClone(byId('johann-weber'));
    c.wounds.current = 99;
    c.points.fortune = 99;
    c.points.resolve = 99;
    const limited = enforceLimits(c);
    expect(limited.wounds.current).toBe(maxWounds(c));
    expect(limited.points.fortune).toBe(c.points.fate);
    expect(limited.points.resolve).toBe(c.points.resilience);
  });

  it('ne laisse aucune valeur passer sous 0', () => {
    const c = structuredClone(byId('johann-weber'));
    c.wounds.current = -3;
    c.points.fortune = -1;
    c.corruption = -2;
    const limited = enforceLimits(c);
    expect(limited.wounds.current).toBe(0);
    expect(limited.points.fortune).toBe(0);
    expect(limited.corruption).toBe(0);
  });

  it('baisse la valeur courante quand son maximum baisse', () => {
    const c = structuredClone(byId('johann-weber'));
    c.wounds.current = 12;
    c.characteristics.e.advances = -10; // E 24 → BE 2 → max 10
    expect(enforceLimits(c).wounds.current).toBe(10);
  });

  it('toutes les fiches mockées respectent les plafonds', () => {
    for (const c of all) expect(enforceLimits(c)).toEqual(c);
  });
});
