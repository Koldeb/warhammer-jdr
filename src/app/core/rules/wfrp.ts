import {
  Character,
  Characteristic,
  CharacteristicKey,
  HitLocation,
  Skill,
  Species,
  StatusTier,
  Weapon,
} from '../models/character.model';

export const CHARACTERISTICS: { key: CharacteristicKey; abbr: string; label: string }[] = [
  { key: 'cc', abbr: 'CC', label: 'Capacité de Combat' },
  { key: 'ct', abbr: 'CT', label: 'Capacité de Tir' },
  { key: 'f', abbr: 'F', label: 'Force' },
  { key: 'e', abbr: 'E', label: 'Endurance' },
  { key: 'i', abbr: 'I', label: 'Initiative' },
  { key: 'ag', abbr: 'Ag', label: 'Agilité' },
  { key: 'dex', abbr: 'Dex', label: 'Dextérité' },
  { key: 'int', abbr: 'Int', label: 'Intelligence' },
  { key: 'fm', abbr: 'FM', label: 'Force Mentale' },
  { key: 'soc', abbr: 'Soc', label: 'Sociabilité' },
];

export const SPECIES_LABELS: Record<Species, string> = {
  humain: 'Humain',
  nain: 'Nain',
  halfling: 'Halfling',
  'haut-elfe': 'Haut Elfe',
  'elfe-sylvain': 'Elfe Sylvain',
};

export const STATUS_TIER_LABELS: Record<StatusTier, string> = {
  bronze: 'Bronze',
  argent: 'Argent',
  or: 'Or',
};

export const HIT_LOCATION_LABELS: Record<HitLocation, string> = {
  tete: 'Tête',
  'bras-gauche': 'Bras gauche',
  'bras-droit': 'Bras droit',
  corps: 'Corps',
  'jambe-gauche': 'Jambe gauche',
  'jambe-droite': 'Jambe droite',
};

export function characteristicValue(c: Characteristic): number {
  return c.initial + c.advances;
}

export function bonus(value: number): number {
  return Math.floor(value / 10);
}

export function characteristicBonus(character: Character, key: CharacteristicKey): number {
  return bonus(characteristicValue(character.characteristics[key]));
}

/** Blessures max = BF + 2×BE + BFM (les Halflings n'ajoutent pas le BF). Talents non pris en compte. */
export function maxWounds(character: Character): number {
  const sb = character.species === 'halfling' ? 0 : characteristicBonus(character, 'f');
  return sb + 2 * characteristicBonus(character, 'e') + characteristicBonus(character, 'fm');
}

export function skillValue(character: Character, skill: Skill): number {
  return characteristicValue(character.characteristics[skill.characteristic]) + skill.advances;
}

export function weaponDamage(character: Character, weapon: Weapon): number {
  const sb = weapon.damage.usesStrengthBonus ? characteristicBonus(character, 'f') : 0;
  return sb + weapon.damage.modifier;
}

export function totalExperience(character: Character): number {
  return character.experience.current + character.experience.spent;
}

/**
 * Applique les plafonds de la fiche : aucune valeur ne dépasse son maximum ni ne passe sous 0.
 * - Blessures ≤ blessures max
 * - Fortune ≤ Destin
 * - Détermination ≤ Résilience
 */
export function enforceLimits(character: Character): Character {
  const c = structuredClone(character);
  const p = c.points;
  p.fate = Math.max(0, p.fate);
  p.resilience = Math.max(0, p.resilience);
  p.fortune = clamp(p.fortune, 0, p.fate);
  p.resolve = clamp(p.resolve, 0, p.resilience);
  c.wounds.current = clamp(c.wounds.current, 0, maxWounds(c));
  c.corruption = Math.max(0, c.corruption);
  c.experience.current = Math.max(0, c.experience.current);
  c.experience.spent = Math.max(0, c.experience.spent);
  return c;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
