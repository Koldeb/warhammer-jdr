/** Clés des 10 caractéristiques de WFRP 4e (noms de la VF). */
export type CharacteristicKey =
  | 'cc' // Capacité de Combat
  | 'ct' // Capacité de Tir
  | 'f' // Force
  | 'e' // Endurance
  | 'i' // Initiative
  | 'ag' // Agilité
  | 'dex' // Dextérité
  | 'int' // Intelligence
  | 'fm' // Force Mentale
  | 'soc'; // Sociabilité

export interface Characteristic {
  initial: number;
  advances: number;
}

export type Characteristics = Record<CharacteristicKey, Characteristic>;

export type Species = 'humain' | 'nain' | 'halfling' | 'haut-elfe' | 'elfe-sylvain';

export type StatusTier = 'bronze' | 'argent' | 'or';

export interface Career {
  /** Classe : Guerriers, Lettrés, Roublards, Citadins... */
  class: string;
  /** Carrière : Soldat, Sorcier, Voleur... */
  name: string;
  /** Échelon dans la carrière (1 à 4). */
  level: 1 | 2 | 3 | 4;
  /** Titre de l'échelon : Recrue, Apprenti sorcier... */
  title: string;
  status: { tier: StatusTier; standing: number };
  /** Carrières précédemment exercées. */
  history: string[];
}

export interface Skill {
  name: string;
  specialization?: string;
  characteristic: CharacteristicKey;
  advances: number;
  advanced: boolean;
  /** Compétence de la carrière actuelle. */
  career: boolean;
}

export interface Talent {
  name: string;
  timesTaken: number;
  description: string;
}

export type HitLocation = 'tete' | 'bras-gauche' | 'bras-droit' | 'corps' | 'jambe-gauche' | 'jambe-droite';

export interface Weapon {
  name: string;
  group: string;
  encumbrance: number;
  /** Allonge (corps à corps) ou portée (distance). */
  reachOrRange: string;
  /** Dégâts = (BF si usesStrengthBonus) + modifier. */
  damage: { usesStrengthBonus: boolean; modifier: number };
  qualities: string[];
}

export interface Armour {
  name: string;
  locations: HitLocation[];
  encumbrance: number;
  armourPoints: number;
  qualities: string[];
}

export interface Trapping {
  name: string;
  quantity: number;
  encumbrance: number;
}

export interface Spell {
  name: string;
  /** Domaine : Magie mineure, Domaine des Cieux... */
  lore: string;
  castingNumber: number;
  range: string;
  target: string;
  duration: string;
  effect: string;
}

export interface Character {
  id: string;
  campaignId: string;
  /** Id du profil du joueur propriétaire de la fiche. */
  playerId: string;
  name: string;
  species: Species;
  career: Career;
  details: {
    age: number;
    height: string;
    hair: string;
    eyes: string;
    appearance: string;
    background: string;
  };
  characteristics: Characteristics;
  points: {
    fate: number;
    fortune: number;
    resilience: number;
    resolve: number;
    motivation: string;
  };
  wounds: { current: number };
  experience: { current: number; spent: number };
  corruption: number;
  mutations: string[];
  psychology: string[];
  ambitions: { shortTerm: string; longTerm: string };
  skills: Skill[];
  talents: Talent[];
  weapons: Weapon[];
  armour: Armour[];
  trappings: Trapping[];
  spells: Spell[];
  /** Monnaie : couronnes d'or, pistoles d'argent, sous de cuivre. */
  wealth: { crowns: number; shillings: number; pennies: number };
}
