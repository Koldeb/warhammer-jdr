import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Campaign, Session, SessionGmNotes } from '../models/campaign.model';
import { Character } from '../models/character.model';
import { UserProfile } from '../models/user.model';
import { enforceLimits } from '../rules/wfrp';
import { CampaignRepository } from './campaign.repository';
import campaign from './mock/campaign.json';
import characters from './mock/characters.json';
import gmNotes from './mock/gm-notes.json';
import sessions from './mock/sessions.json';
import users from './mock/users.json';

const CHARACTERS_STORAGE_KEY = 'wjdr-mock-characters';

//Changer pour Supabase
// Cette classe sera remplacée par SupabaseCampaignRepository (même interface CampaignRepository),
// branchée dans app.config.ts. Les contrôles canRead/canWrite deviendront des policies RLS.
/**
 * Lit les JSON mockés et simule les policies RLS en fonction de l'utilisateur connecté.
 * Les fiches modifiées sont conservées dans le localStorage pour survivre au rechargement.
 */
@Injectable()
export class MockCampaignRepository extends CampaignRepository {
  private readonly auth = inject(AuthService);

  private readonly campaign = campaign as Campaign;
  private readonly profiles = users as UserProfile[];
  private readonly characters = loadCharacters();
  private readonly sessions = sessions as Session[];
  private readonly gmNotes = gmNotes as SessionGmNotes[];

  getCampaign(): Promise<Campaign> {
    return resolve(this.campaign);
  }

  getProfiles(): Promise<UserProfile[]> {
    return resolve(this.profiles);
  }

  getCharacters(): Promise<Character[]> {
    return resolve(this.characters.filter((c) => this.canReadCharacter(c)));
  }

  getCharacter(id: string): Promise<Character | undefined> {
    return resolve(this.characters.find((c) => c.id === id && this.canReadCharacter(c)));
  }

  updateCharacter(update: Character): Promise<Character> {
    const index = this.characters.findIndex((c) => c.id === update.id);
    const existing = this.characters[index];
    if (!existing || !this.canWriteCharacter(existing)) {
      return Promise.reject(new Error("Vous n'avez pas le droit de modifier cette fiche."));
    }
    // Les champs de propriété ne sont pas modifiables (équivalent du WITH CHECK de la policy),
    // et aucune valeur ne peut dépasser son maximum.
    const saved: Character = {
      ...enforceLimits(update),
      id: existing.id,
      playerId: existing.playerId,
      campaignId: existing.campaignId,
    };
    this.characters[index] = saved;
    storage()?.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(this.characters));
    return resolve(saved);
  }

  getSessions(): Promise<Session[]> {
    return resolve([...this.sessions].sort((a, b) => b.number - a.number));
  }

  getSession(id: string): Promise<Session | undefined> {
    return resolve(this.sessions.find((s) => s.id === id));
  }

  getGmNotes(sessionId: string): Promise<SessionGmNotes | undefined> {
    if (!this.auth.isGm()) return resolve(undefined);
    return resolve(this.gmNotes.find((n) => n.sessionId === sessionId));
  }

  private canReadCharacter(character: Character): boolean {
    const user = this.auth.user();
    return !!user && (user.role === 'mj' || character.playerId === user.id);
  }

  private canWriteCharacter(character: Character): boolean {
    return this.canReadCharacter(character);
  }
}

function loadCharacters(): Character[] {
  const stored = storage()?.getItem(CHARACTERS_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Character[]) : structuredClone(characters as Character[]);
}

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

/** Copie profonde pour éviter que les composants modifient les données mockées. */
function resolve<T>(value: T): Promise<T> {
  return Promise.resolve(structuredClone(value));
}
