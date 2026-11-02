import { Campaign, Session, SessionGmNotes } from '../models/campaign.model';
import { Character } from '../models/character.model';
import { UserProfile } from '../models/user.model';

/**
 * Point d'accès unique aux données. Les composants ne dépendent que de cette classe :
 * passer du mock à Supabase revient à fournir une autre implémentation dans app.config.ts.
 *
 * Règles d'accès (futures policies RLS Supabase) :
 * - un joueur ne voit et ne modifie que ses propres fiches, le MJ les voit et modifie toutes ;
 * - les séances sont visibles par tous ;
 * - les notes MJ ne sont visibles que par le MJ.
 */
export abstract class CampaignRepository {
  abstract getCampaign(): Promise<Campaign>;
  abstract getProfiles(): Promise<UserProfile[]>;
  abstract getCharacters(): Promise<Character[]>;
  abstract getCharacter(id: string): Promise<Character | undefined>;
  /**
   * Enregistre la fiche, plafonds appliqués (voir enforceLimits).
   * Rejette si l'utilisateur n'a pas le droit de la modifier.
   */
  abstract updateCharacter(character: Character): Promise<Character>;
  /** Séances triées de la plus récente à la plus ancienne. */
  abstract getSessions(): Promise<Session[]>;
  abstract getSession(id: string): Promise<Session | undefined>;
  abstract getGmNotes(sessionId: string): Promise<SessionGmNotes | undefined>;
}
