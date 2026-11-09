import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { Character, CharacteristicKey, HitLocation } from '../../core/models/character.model';
import { DIFFICULTIES, resolveTest, rollD100 } from '../../core/rules/dice';
import {
  CHARACTERISTICS,
  HIT_LOCATION_LABELS,
  SPECIES_LABELS,
  STATUS_TIER_LABELS,
  characteristicValue,
  enforceLimits,
  maxWounds,
  skillValue,
  totalExperience,
  weaponDamage,
} from '../../core/rules/wfrp';
import { CharacterEditorComponent } from './character-editor.component';
import { RollEntry, RollLogComponent } from './roll-log.component';

const MAX_ROLLS = 5;
type Stat = 'wounds' | 'fortune' | 'resilience' | 'resolve';

const DEFAULT_DIFFICULTY = DIFFICULTIES.findIndex((d) => d.modifier === 0);

@Component({
  selector: 'app-character-sheet-page',
  imports: [
    RouterLink,
    CharacterEditorComponent,
    RollLogComponent,
    MatButtonModule,
    MatCardModule,
    MatRippleModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
  ],
  templateUrl: './character-sheet.page.html',
})
export class CharacterSheetPage {
  private readonly repo = inject(CampaignRepository);
  private readonly auth = inject(AuthService);

  /** Paramètre de route :id. */
  readonly id = input.required<string>();

  protected readonly character = resource({
    params: () => this.id(),
    loader: ({ params }) => this.repo.getCharacter(params),
  });

  protected readonly canEdit = computed(() => {
    const user = this.auth.user();
    const ch = this.character.value();
    return !!user && !!ch && (user.role === 'mj' || ch.playerId === user.id);
  });

  protected readonly isGm = this.auth.isGm;
  /** Un joueur dont le personnage est mort peut en créer un nouveau (vérifié seulement dans ce cas). */
  protected readonly canCreate = resource({
    params: () => this.character.value()?.deceased || undefined,
    loader: () => this.repo.canCreateCharacter(),
  });

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly difficulties = DIFFICULTIES;
  protected readonly difficultyIndex = signal(DEFAULT_DIFFICULTY);
  protected readonly rolls = signal<RollEntry[]>([]);
  /** Dernière caractéristique testée, mise en évidence. */
  protected readonly lastRolled = signal<string | null>(null);
  private nextRollId = 0;

  /** Compteur modifié en dernier : sa valeur est rejouée avec une animation (voir bumpKey). */
  private readonly bump = signal<{ stat: Stat | null; n: number }>({ stat: null, n: 0 });

  protected readonly characteristics = CHARACTERISTICS;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly tierLabels = STATUS_TIER_LABELS;

  protected readonly characteristicValue = characteristicValue;
  protected readonly maxWounds = maxWounds;
  protected readonly skillValue = skillValue;
  protected readonly totalExperience = totalExperience;
  protected readonly weaponDamage = weaponDamage;

  protected locationList(locations: HitLocation[]): string {
    return locations.map((l) => HIT_LOCATION_LABELS[l]).join(', ');
  }

  protected rollTest(label: string, value: number, characteristic: CharacteristicKey): void {
    const difficulty = DIFFICULTIES[this.difficultyIndex()];
    const combat = characteristic === 'cc' || characteristic === 'ct';
    const result = resolveTest(value + difficulty.modifier, rollD100(), combat);
    const entry: RollEntry = { id: this.nextRollId++, label, difficulty: difficulty.label, combat, result };
    this.rolls.update((rolls) => [entry, ...rolls].slice(0, MAX_ROLLS));
    this.lastRolled.set(label);
  }

  /** Change quand le compteur vient d'être modifié, ce qui recrée sa valeur et rejoue l'animation. */
  protected bumpKey(stat: Stat): number {
    const b = this.bump();
    return b.stat === stat ? b.n : -1;
  }

  /** Relance un test raté en dépensant 1 point de Fortune (une seule relance par test). */
  protected async reroll(rollId: number): Promise<void> {
    const entry = this.rolls().find((r) => r.id === rollId);
    const ch = this.character.value();
    if (!entry || entry.result.success || entry.previous || !ch || ch.points.fortune <= 0) return;

    const spent = await this.adjust('fortune', -1);
    if (!spent) return;

    const result = resolveTest(entry.result.target, rollD100(), entry.combat);
    this.rolls.update((rolls) =>
      rolls.map((r) => (r.id === rollId ? { ...r, result, previous: entry.result } : r)),
    );
  }

  /**
   * Boutons +/− : mise à jour immédiate, enregistrée en arrière-plan.
   * Les plafonds (enforceLimits) s'appliquent toujours. Renvoie false si rien n'a été enregistré.
   */
  protected async adjust(stat: Stat, delta: number): Promise<boolean> {
    const ch = this.character.value();
    if (!ch) return false;
    const draft = structuredClone(ch);
    if (stat === 'wounds') draft.wounds.current += delta;
    else draft.points[stat] += delta;

    const next = enforceLimits(draft);
    if (JSON.stringify(next) === JSON.stringify(ch)) return false;

    this.saveError.set(null);
    this.character.set(next);
    this.bump.update((b) => ({ stat, n: b.n + 1 }));
    try {
      await this.repo.updateCharacter(next);
      return true;
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
      this.character.reload();
      return false;
    }
  }

  /** MJ : marque le personnage comme mort / vivant, ou le cache / montre aux joueurs. */
  protected toggleFlag(flag: 'deceased' | 'hidden'): Promise<void> {
    const ch = this.character.value();
    if (!ch) return Promise.resolve();
    return this.save({ ...ch, [flag]: !ch[flag] });
  }

  protected async save(update: Character): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    try {
      this.character.set(await this.repo.updateCharacter(update));
      this.editing.set(false);
    } catch (e) {
      this.saveError.set(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      this.saving.set(false);
    }
  }
}
