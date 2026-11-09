import { Campaign, Session, SessionGmNotes } from '../models/campaign.model';
import { Character, NewCharacter } from '../models/character.model';
import { UserProfile } from '../models/user.model';

/**
 * Point d'accès unique aux données. Les composants ne dépendent que de cette classe :
 * passer du mock à Supabase revient à fournir une autre implémentation dans app.config.ts.
 *
 * Règles d'accès (futures policies RLS Supabase) :
 * - un joueur ne voit et ne modifie que ses propres fiches, le MJ les voit et modifie toutes ;
 * - une fiche cachée (hidden) n'est visible que par le MJ ;
 * - seul le MJ change les champs deceased et hidden ;
 * - le MJ peut toujours créer une fiche ; un joueur seulement si son personnage est mort
 *   et qu'il n'en a aucun autre en vie (voir canCreateCharacter) ;
 * - les séances sont visibles par tous ;
 * - les notes MJ ne sont visibles que par le MJ.
 */
export abstract class CampaignRepository {
  abstract getCampaign(): Promise<Campaign>;
  abstract getProfiles(): Promise<UserProfile[]>;
  abstract getCharacters(): Promise<Character[]>;
  abstract getCharacter(id: string): Promise<Character | undefined>;
  /** Vrai si l'utilisateur connecté a le droit de créer un personnage. */
  abstract canCreateCharacter(): Promise<boolean>;
  /**
   * Crée la fiche. Pour un joueur, elle lui appartient et n'est jamais cachée.
   * Rejette si l'utilisateur n'a pas le droit de créer de personnage.
   */
  abstract createCharacter(character: NewCharacter): Promise<Character>;
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
