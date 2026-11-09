import {
  Armour,
  Character,
  CharacteristicKey,
  Characteristics,
  NewCharacter,
  Skill,
  Species,
  Talent,
  Trapping,
  Weapon,
} from '../models/character.model';
import { DieRoller, rollDice, rollDie } from './dice';
import {
  ARMOUR,
  CAREERS,
  CLASS_TRAPPINGS,
  CareerDef,
  MOTIVATIONS,
  RANDOM_TALENTS,
  SKILLS,
  SPECIES,
  SPECIES_TABLE,
  TALENTS,
  WEAPONS,
} from './creation-data';
import { CHARACTERISTICS, maxWounds } from './wfrp';

/**
 * Création de personnage selon WFRP 4e. Chaque étape peut être faite au hasard (avec le bonus
 * d'XP prévu par les règles) ou à la main :
 * - espèce : tirage +20 XP ;
 * - carrière : tirage unique accepté +50 XP, choix parmi 3 tirages +25 XP ;
 * - caractéristiques : 2d10 + base de l'espèce, gardés tels quels +50 XP, échangés entre eux
 *   +25 XP, relancés ou remplacés par 100 points répartis (4 à 18 par caractéristique) ;
 * - 5 augmentations sur les 3 caractéristiques de la carrière ;
 * - points supplémentaires de l'espèce répartis entre Destin et Résilience ;
 * - compétences d'espèce : 3 à +5 et 3 à +3 ; de carrière : 40 augmentations, 10 max chacune ;
 * - talents d'espèce (avec choix et talents aléatoires) + 1 talent de carrière au choix.
 */

export type CareerMethod = 'tirage' | 'tirage3' | 'choix';
/** tirage : 2d10 gardés tels quels ; echange : valeurs tirées réordonnées ; relance : nouveau tirage. */
export type CharacteristicMethod = 'tirage' | 'echange' | 'relance' | 'points';

export const SPECIES_ROLL_XP = 20;
export const CAREER_XP: Record<CareerMethod, number> = { tirage: 50, tirage3: 25, choix: 0 };
export const CHARACTERISTIC_XP: Record<CharacteristicMethod, number> = {
  tirage: 50,
  echange: 25,
  relance: 0,
  points: 0,
};

export const CAREER_ADVANCES = 5;
export const CAREER_SKILL_ADVANCES = 40;
export const CAREER_SKILL_MAX = 10;
export const POINT_BUY_TOTAL = 100;
export const POINT_BUY_MIN = 4;
export const POINT_BUY_MAX = 18;
/** Compétences d'espèce : nombre de compétences à +5 et à +3. */
export const SPECIES_SKILL_PICKS = { 5: 3, 3: 3 } as const;

/** Talents qui augmentent de +5 une caractéristique initiale. */
const CHARACTERISTIC_TALENTS: Record<string, CharacteristicKey> = {
  'Guerrier né': 'cc',
  'Tireur d’élite': 'ct',
  'Très fort': 'f',
  'Très résistant': 'e',
  Vif: 'i',
  'Réflexes éclair': 'ag',
  'Doigts de fée': 'dex',
  Perspicace: 'int',
  'Sang-froid': 'fm',
  Affable: 'soc',
};

export interface CreationDraft {
  species: Species;
  speciesRolled: boolean;
  careerName: string;
  careerMethod: CareerMethod;
  /** Carrières tirées (1 pour un tirage unique, 3 pour un choix parmi 3). */
  careerRolls: string[];
  characteristicMethod: CharacteristicMethod;
  /** 2d10 tirés, ou points attribués, ajoutés à la base de l'espèce. */
  rolls: Record<CharacteristicKey, number>;
  /** Augmentations de carrière (5 au total). */
  characteristicAdvances: Partial<Record<CharacteristicKey, number>>;
  /** Points supplémentaires mis en Destin ; le reste va en Résilience. */
  extraFate: number;
  /** Compétences d'espèce : référence → 0, 3 ou 5 augmentations. */
  speciesSkills: Record<string, 0 | 3 | 5>;
  /** Compétences de carrière : référence → augmentations. */
  careerSkills: Record<string, number>;
  /** Spécialisation précisée pour les références « au choix » ou « A ou B ». */
  specializations: Record<string, string>;
  /** Talents d'espèce « A ou B » : indice dans SPECIES[x].talents → talent choisi. */
  talentChoices: Record<number, string>;
  randomTalents: string[];
  careerTalent: string;
  name: string;
  details: Character['details'];
  motivation: string;
  ambitions: Character['ambitions'];
}

// ---------------------------------------------------------------------------
// Références "Nom (Spécialisation)"
// ---------------------------------------------------------------------------

export function parseRef(ref: string): { name: string; specialization?: string } {
  const match = /^(.+?) \((.+)\)$/.exec(ref);
  return match ? { name: match[1], specialization: match[2] } : { name: ref };
}

/** Spécialisation à préciser par le joueur. */
export function needsSpecialization(ref: string): boolean {
  const spec = parseRef(ref).specialization;
  return !!spec && (spec === 'au choix' || spec.includes(' ou '));
}

/** Référence avec la spécialisation choisie par le joueur, si elle a été précisée. */
export function resolveRef(ref: string, specializations: Record<string, string>): string {
  const chosen = specializations[ref]?.trim();
  if (!chosen || !needsSpecialization(ref)) return ref;
  return `${parseRef(ref).name} (${chosen})`;
}

export function talentDescription(ref: string): string {
  return TALENTS[parseRef(ref).name] ?? '';
}

// ---------------------------------------------------------------------------
// Tirages
// ---------------------------------------------------------------------------

function lookup<T>(table: [number, T][], value: number): T {
  return (table.find(([max]) => value <= max) ?? table[table.length - 1])[1];
}

export function rollSpecies(roll: DieRoller = rollDie): Species {
  return lookup(SPECIES_TABLE, roll(100));
}

export function findCareer(name: string): CareerDef | undefined {
  return CAREERS.find((c) => c.name === name);
}

/** Carrières accessibles à l'espèce, dans l'ordre du livre. */
export function careersFor(species: Species): CareerDef[] {
  return CAREERS.filter((c) => c.table[species] > 0);
}

export function rollCareer(species: Species, roll: DieRoller = rollDie): CareerDef {
  const table = careersFor(species).map((c) => [c.table[species], c] as [number, CareerDef]);
  return lookup(table, roll(100));
}

/** `count` carrières distinctes (on relance les doublons). */
export function rollCareers(
  species: Species,
  count: number,
  roll: DieRoller = rollDie,
): CareerDef[] {
  const result: CareerDef[] = [];
  const available = careersFor(species).length;
  while (result.length < Math.min(count, available)) {
    const career = rollCareer(species, roll);
    if (!result.includes(career)) result.push(career);
  }
  return result;
}

export function rollCharacteristics(roll: DieRoller = rollDie): Record<CharacteristicKey, number> {
  return Object.fromEntries(CHARACTERISTICS.map((c) => [c.key, rollDice(2, 10, roll)])) as Record<
    CharacteristicKey,
    number
  >;
}

/** Talents aléatoires de l'espèce, sans doublon avec ses talents fixes. */
export function rollRandomTalents(species: Species, roll: DieRoller = rollDie): string[] {
  const def = SPECIES[species];
  const owned = new Set(def.talents.flat());
  const result: string[] = [];
  while (result.length < def.randomTalents) {
    const talent = lookup(RANDOM_TALENTS, roll(100));
    if (!owned.has(talent) && !result.includes(talent)) result.push(talent);
  }
  return result;
}

function pick<T>(list: readonly T[], roll: DieRoller): T {
  return list[roll(list.length) - 1];
}

function shuffle<T>(list: readonly T[], roll: DieRoller): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = roll(i + 1) - 1;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Répartit `total` points un par un au hasard, sans dépasser `max` par clé. */
function distribute<K extends string>(
  keys: K[],
  total: number,
  max: number,
  roll: DieRoller,
): Record<K, number> {
  const result = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  for (let left = Math.min(total, keys.length * max); left > 0; left--) {
    const open = keys.filter((k) => result[k] < max);
    result[pick(open, roll)]++;
  }
  return result;
}

export function rollDetails(
  species: Species,
  roll: DieRoller = rollDie,
): Pick<CreationDraft, 'name' | 'details'> {
  const def = SPECIES[species];
  const heightCm = def.height.base + Math.round(rollDice(def.height.d10, 10, roll) * 2.5);
  return {
    name: pick(def.names, roll),
    details: {
      age: def.age.base + rollDice(def.age.d10, 10, roll),
      height: formatHeight(heightCm),
      hair: pick(def.hair, roll),
      eyes: pick(def.eyes, roll),
      appearance: '',
      background: '',
    },
  };
}

/** 173 → "1m73" */
export function formatHeight(cm: number): string {
  return `${Math.floor(cm / 100)}m${String(cm % 100).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Brouillon
// ---------------------------------------------------------------------------

export function newDraft(species: Species = 'humain'): CreationDraft {
  const draft: CreationDraft = {
    species,
    speciesRolled: false,
    careerName: '',
    careerMethod: 'choix',
    careerRolls: [],
    characteristicMethod: 'points',
    rolls: Object.fromEntries(CHARACTERISTICS.map((c) => [c.key, 10])) as Record<
      CharacteristicKey,
      number
    >,
    characteristicAdvances: {},
    extraFate: 0,
    speciesSkills: {},
    careerSkills: {},
    specializations: {},
    talentChoices: {},
    randomTalents: [],
    careerTalent: '',
    name: '',
    details: { age: 0, height: '', hair: '', eyes: '', appearance: '', background: '' },
    motivation: '',
    ambitions: { shortTerm: '', longTerm: '' },
  };
  return setSpecies(draft, species, false);
}

/** Change d'espèce : réinitialise tout ce qui en dépend. */
export function setSpecies(draft: CreationDraft, species: Species, rolled: boolean): CreationDraft {
  const def = SPECIES[species];
  draft.species = species;
  draft.speciesRolled = rolled;
  draft.extraFate = 0;
  draft.speciesSkills = Object.fromEntries(def.skills.map((s) => [s, 0]));
  draft.talentChoices = {};
  draft.randomTalents = [];
  // Âge et taille dépendent de l'espèce.
  draft.details.age = def.age.base + Math.round(def.age.d10 * 5.5);
  draft.details.height = formatHeight(def.height.base + Math.round(def.height.d10 * 5.5 * 2.5));
  if (draft.careerName && !careersFor(species).some((c) => c.name === draft.careerName)) {
    setCareer(draft, '', 'choix', []);
  }
  return draft;
}

/** Change de carrière : réinitialise les augmentations et le talent de carrière. */
export function setCareer(
  draft: CreationDraft,
  name: string,
  method: CareerMethod,
  rolls: string[],
): CreationDraft {
  const career = findCareer(name);
  draft.careerName = career?.name ?? '';
  draft.careerMethod = method;
  draft.careerRolls = rolls;
  draft.characteristicAdvances = Object.fromEntries(
    (career?.characteristics ?? []).map((k) => [k, 0]),
  );
  draft.careerSkills = Object.fromEntries((career?.skills ?? []).map((s) => [s, 0]));
  draft.careerTalent = '';
  return draft;
}

/** Tout au hasard, en prenant à chaque étape l'option qui rapporte le plus d'XP. */
export function randomDraft(roll: DieRoller = rollDie): CreationDraft {
  const draft = newDraft();
  setSpecies(draft, rollSpecies(roll), true);
  const def = SPECIES[draft.species];

  const career = rollCareer(draft.species, roll);
  setCareer(draft, career.name, 'tirage', [career.name]);

  draft.characteristicMethod = 'tirage';
  draft.rolls = rollCharacteristics(roll);
  draft.characteristicAdvances = distribute(
    career.characteristics,
    CAREER_ADVANCES,
    CAREER_ADVANCES,
    roll,
  );
  draft.extraFate = roll(def.extraPoints + 1) - 1;

  const skills = shuffle(def.skills, roll);
  draft.speciesSkills = Object.fromEntries(
    skills.map((s, i) => [
      s,
      i < SPECIES_SKILL_PICKS[5] ? 5 : i < SPECIES_SKILL_PICKS[5] + SPECIES_SKILL_PICKS[3] ? 3 : 0,
    ]),
  );
  draft.careerSkills = distribute(career.skills, CAREER_SKILL_ADVANCES, CAREER_SKILL_MAX, roll);

  def.talents.forEach((t, i) => {
    if (Array.isArray(t)) draft.talentChoices[i] = pick(t, roll);
  });
  draft.randomTalents = rollRandomTalents(draft.species, roll);
  const owned = new Set(speciesTalents(draft));
  draft.careerTalent = pick(
    career.talents.filter((t) => !owned.has(t)),
    roll,
  );

  Object.assign(draft, rollDetails(draft.species, roll));
  draft.motivation = pick(MOTIVATIONS, roll);
  return draft;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function pointsSpent(draft: CreationDraft): number {
  return Object.values(draft.rolls).reduce((a, b) => a + b, 0);
}

export function characteristicsValid(draft: CreationDraft): boolean {
  const values = Object.values(draft.rolls);
  if (draft.characteristicMethod === 'points') {
    return (
      pointsSpent(draft) === POINT_BUY_TOTAL &&
      values.every((v) => v >= POINT_BUY_MIN && v <= POINT_BUY_MAX)
    );
  }
  return values.every((v) => v >= 2 && v <= 20);
}

export function advancesSpent(draft: CreationDraft): number {
  return Object.values(draft.characteristicAdvances).reduce((a, b) => a + (b ?? 0), 0);
}

export function advancesValid(draft: CreationDraft): boolean {
  return advancesSpent(draft) === CAREER_ADVANCES;
}

export function speciesSkillCount(draft: CreationDraft, advances: 3 | 5): number {
  return Object.values(draft.speciesSkills).filter((v) => v === advances).length;
}

export function speciesSkillsValid(draft: CreationDraft): boolean {
  return (
    speciesSkillCount(draft, 5) === SPECIES_SKILL_PICKS[5] &&
    speciesSkillCount(draft, 3) === SPECIES_SKILL_PICKS[3]
  );
}

export function careerSkillsSpent(draft: CreationDraft): number {
  return Object.values(draft.careerSkills).reduce((a, b) => a + b, 0);
}

export function careerSkillsValid(draft: CreationDraft): boolean {
  const values = Object.values(draft.careerSkills);
  return (
    careerSkillsSpent(draft) === CAREER_SKILL_ADVANCES &&
    values.every((v) => v >= 0 && v <= CAREER_SKILL_MAX)
  );
}

export function talentsValid(draft: CreationDraft): boolean {
  const def = SPECIES[draft.species];
  const choicesMade = def.talents.every(
    (t, i) => !Array.isArray(t) || t.includes(draft.talentChoices[i]),
  );
  return choicesMade && draft.randomTalents.length === def.randomTalents && !!draft.careerTalent;
}

export function detailsValid(draft: CreationDraft): boolean {
  return !!draft.name.trim();
}

// ---------------------------------------------------------------------------
// Résultat
// ---------------------------------------------------------------------------

export function creationXp(draft: CreationDraft): number {
  return (
    (draft.speciesRolled ? SPECIES_ROLL_XP : 0) +
    CAREER_XP[draft.careerMethod] +
    CHARACTERISTIC_XP[draft.characteristicMethod]
  );
}

/** Talents d'espèce une fois les choix faits (choix manquants ignorés). */
export function speciesTalents(draft: CreationDraft): string[] {
  const fixed = SPECIES[draft.species].talents
    .map((t, i) => (Array.isArray(t) ? draft.talentChoices[i] : t))
    .filter((t): t is string => !!t);
  return [...fixed, ...draft.randomTalents];
}

export function draftCharacteristics(draft: CreationDraft): Characteristics {
  const base = SPECIES[draft.species].base;
  const talents = [...speciesTalents(draft), draft.careerTalent];
  return Object.fromEntries(
    CHARACTERISTICS.map(({ key }) => {
      const bonus = talents.filter((t) => CHARACTERISTIC_TALENTS[t] === key).length * 5;
      return [
        key,
        {
          initial: base[key] + draft.rolls[key] + bonus,
          advances: draft.characteristicAdvances[key] ?? 0,
        },
      ];
    }),
  ) as Characteristics;
}

function buildSkills(draft: CreationDraft, career: CareerDef): Skill[] {
  const skills = new Map<string, Skill>();
  const add = (ref: string, advances: number, isCareer: boolean) => {
    const resolved = resolveRef(ref, draft.specializations);
    const { name, specialization } = parseRef(resolved);
    const def = SKILLS[name] ?? { characteristic: 'int', advanced: true };
    const existing = skills.get(resolved);
    if (existing) {
      existing.advances += advances;
      existing.career ||= isCareer;
      return;
    }
    skills.set(resolved, {
      name,
      ...(specialization ? { specialization } : {}),
      characteristic: def.characteristic,
      advances,
      advanced: def.advanced,
      career: isCareer,
    });
  };
  for (const [ref, adv] of Object.entries(draft.speciesSkills)) if (adv > 0) add(ref, adv, false);
  for (const ref of career.skills) add(ref, draft.careerSkills[ref] ?? 0, true);
  return [...skills.values()];
}

function buildTalents(draft: CreationDraft): Talent[] {
  const names = [...speciesTalents(draft), draft.careerTalent].map((t) =>
    resolveRef(t, draft.specializations),
  );
  return [...new Set(names)].map((name) => ({
    name,
    timesTaken: 1,
    description: talentDescription(name),
  }));
}

/** Remplace "1d10" par un jet : "Parchemins (1d10)" → "Parchemins (7)". */
function rollInName(name: string, roll: DieRoller): string {
  return name.replace(/(\d+)d10/g, (_, n: string) => String(rollDice(Number(n), 10, roll)));
}

function buildEquipment(career: CareerDef, roll: DieRoller) {
  const weapons: Weapon[] = [];
  const armour: Armour[] = [];
  const trappings: Trapping[] = [];
  for (const item of [...CLASS_TRAPPINGS[career.class], ...career.trappings]) {
    const w = WEAPONS[item];
    const a = ARMOUR[item];
    if (w) {
      if (!weapons.some((x) => x.name === w.name)) weapons.push(structuredClone(w));
    } else if (a) {
      armour.push(structuredClone(a));
    } else {
      trappings.push({ name: rollInName(item, roll), quantity: 1, encumbrance: 0 });
    }
  }
  return { weapons, armour, trappings };
}

/** Argent de départ selon le statut : Bronze n → 2d10 × n sous, Argent n → 1d10 × n pistoles, Or n → n couronnes. */
export function rollWealth(career: CareerDef, roll: DieRoller = rollDie): Character['wealth'] {
  const { tier, standing } = career.status;
  return {
    crowns: tier === 'or' ? standing : 0,
    shillings: tier === 'argent' ? rollDice(1, 10, roll) * standing : 0,
    pennies: tier === 'bronze' ? rollDice(2, 10, roll) * standing : 0,
  };
}

export function buildCharacter(
  draft: CreationDraft,
  playerId: string,
  roll: DieRoller = rollDie,
): NewCharacter {
  const career = findCareer(draft.careerName);
  if (!career) throw new Error('Aucune carrière choisie.');
  const def = SPECIES[draft.species];
  const fate = def.fate + draft.extraFate;
  const resilience = def.resilience + (def.extraPoints - draft.extraFate);

  const character: NewCharacter = {
    playerId,
    name: draft.name.trim(),
    species: draft.species,
    career: {
      class: career.class,
      name: career.name,
      level: 1,
      title: career.title,
      status: { ...career.status },
      history: [],
    },
    details: { ...draft.details },
    characteristics: draftCharacteristics(draft),
    points: { fate, fortune: fate, resilience, resolve: resilience, motivation: draft.motivation },
    wounds: { current: 0 },
    experience: { current: creationXp(draft), spent: 0 },
    corruption: 0,
    mutations: [],
    psychology: [],
    ambitions: { ...draft.ambitions },
    skills: buildSkills(draft, career),
    talents: buildTalents(draft),
    ...buildEquipment(career, roll),
    spells: [],
    wealth: rollWealth(career, roll),
  };
  // maxWounds n'a besoin que de l'espèce et des caractéristiques.
  character.wounds.current = maxWounds(character as Character);
  return character;
}
