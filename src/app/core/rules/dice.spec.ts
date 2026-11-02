import { formatSl, resolveTest, rollD100 } from './dice';

describe('tests WFRP (d100)', () => {
  it('réussit si le jet est inférieur ou égal à la cible', () => {
    expect(resolveTest(45, 45).success).toBe(true);
    expect(resolveTest(45, 46).success).toBe(false);
  });

  it('calcule les DR par différence des dizaines', () => {
    // Cible 45, jet 23 : 4 - 2 = +2
    expect(formatSl(resolveTest(45, 23))).toBe('+2');
    // Cible 45, jet 78 : 4 - 7 = -3
    expect(formatSl(resolveTest(45, 78))).toBe('-3');
    // Cible 45, jet 41 : réussite +0
    expect(formatSl(resolveTest(45, 41))).toBe('+0');
    // Cible 45, jet 48 : échec -0
    expect(formatSl(resolveTest(45, 48))).toBe('-0');
  });

  it('01–05 est toujours une réussite, avec au moins +0 DR', () => {
    const r = resolveTest(2, 4);
    expect(r.success).toBe(true);
    expect(r.automatic).toBe(true);
    expect(formatSl(r)).toBe('+0');
  });

  it('96–00 est toujours un échec, avec au plus -0 DR', () => {
    const r = resolveTest(120, 97);
    expect(r.success).toBe(false);
    expect(formatSl(r)).toBe('-0');
  });

  it('les doubles donnent critique / maladresse uniquement en combat', () => {
    expect(resolveTest(50, 33, true).critical).toBe(true);
    expect(resolveTest(50, 66, true).fumble).toBe(true);
    expect(resolveTest(50, 100, true).fumble).toBe(true);
    expect(resolveTest(50, 33, false).critical).toBe(false);
    expect(resolveTest(50, 34, true).critical).toBe(false);
  });

  it('lance un d100 entre 1 et 100', () => {
    for (let i = 0; i < 1000; i++) {
      const r = rollD100();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(100);
    }
  });
});
