export interface Campaign {
  id: string;
  name: string;
  gameMaster: string;
  pitch: string;
  startedOn: string;
  currentLocation: string;
  party: {
    name: string;
    shortTermAmbition: string;
    longTermAmbition: string;
  };
}

export interface Npc {
  name: string;
  description: string;
  attitude: 'allie' | 'neutre' | 'hostile' | 'inconnu';
}

export interface Session {
  id: string;
  campaignId: string;
  number: number;
  title: string;
  /** Date réelle de la partie (ISO). */
  playedOn: string;
  /** Date dans le calendrier impérial. */
  inGameDate: string;
  summary: string;
  events: string[];
  npcs: Npc[];
  locations: string[];
  loot: string[];
  xpAwarded: number;
  /** Ids des personnages présents. */
  participants: string[];
}

/** Notes privées du MJ sur une séance. Table séparée pour que Supabase puisse la protéger par RLS. */
export interface SessionGmNotes {
  sessionId: string;
  content: string;
}
