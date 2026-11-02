/** Difficultés des tests (WFRP 4e). « Exigeant » (+0) est la difficulté par défaut. */
export const DIFFICULTIES = [
  { label: 'Très facile', modifier: 60 },
  { label: 'Facile', modifier: 40 },
  { label: 'Moyen', modifier: 20 },
  { label: 'Exigeant', modifier: 0 },
  { label: 'Difficile', modifier: -10 },
  { label: 'Ardu', modifier: -20 },
  { label: 'Très ardu', modifier: -30 },
] as const;

export interface TestResult {
  /** Jet de 1 à 100. */
  roll: number;
  /** Valeur à atteindre, difficulté incluse. */
  target: number;
  success: boolean;
  /** Degrés de réussite (DR). Signé ; un échec à 0 DR s'affiche « -0 ». */
  sl: number;
  /** 01–05 ou 96–00 : réussite / échec automatique. */
  automatic: boolean;
  /** Double réussi sur un test de combat. */
  critical: boolean;
  /** Double raté sur un test de combat. */
  fumble: boolean;
}

/** Jet de d100 : 1 à 100. */
export function rollD100(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % 100) + 1;
}

/**
 * Résout un test selon les règles de WFRP 4e.
 * @param combat test de CC/CT : les doubles donnent critique ou maladresse.
 */
export function resolveTest(target: number, roll: number, combat = false): TestResult {
  const autoSuccess = roll <= 5;
  const autoFailure = roll >= 96;
  const success = autoSuccess || (!autoFailure && roll <= target);

  let sl = Math.floor(target / 10) - Math.floor(roll / 10);
  // Une réussite (automatique) a au moins +0 DR, un échec (automatique) au plus -0 DR.
  if (success && sl < 0) sl = 0;
  if (!success && sl > 0) sl = 0;

  const isDouble = roll === 100 || roll % 11 === 0;
  return {
    roll,
    target,
    success,
    sl,
    automatic: autoSuccess || autoFailure,
    critical: combat && success && isDouble,
    fumble: combat && !success && isDouble,
  };
}

/** "+2", "+0", "-0", "-3" */
export function formatSl(result: TestResult): string {
  if (result.success) return `+${result.sl}`;
  return result.sl === 0 ? '-0' : `${result.sl}`;
}
