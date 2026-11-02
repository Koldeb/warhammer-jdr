import { Component, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Character, HitLocation, Species, StatusTier } from '../../core/models/character.model';
import {
  CHARACTERISTICS,
  HIT_LOCATION_LABELS,
  SPECIES_LABELS,
  STATUS_TIER_LABELS,
  enforceLimits,
  maxWounds,
} from '../../core/rules/wfrp';

/** Formulaire d'édition d'une fiche. Travaille sur une copie, émise à l'enregistrement. */
@Component({
  selector: 'app-character-editor',
  imports: [FormsModule],
  templateUrl: './character-editor.component.html',
})
export class CharacterEditorComponent {
  readonly character = input.required<Character>();
  readonly saving = input(false);
  readonly save = output<Character>();
  readonly cancel = output<void>();

  protected readonly draft = linkedSignal(() => structuredClone(this.character()));

  protected readonly characteristics = CHARACTERISTICS;
  protected readonly species = Object.entries(SPECIES_LABELS) as [Species, string][];
  protected readonly tiers = Object.entries(STATUS_TIER_LABELS) as [StatusTier, string][];
  protected readonly hitLocations = Object.entries(HIT_LOCATION_LABELS) as [HitLocation, string][];
  protected readonly levels = [1, 2, 3, 4] as const;
  protected readonly maxWounds = maxWounds;

  /** Ramène les valeurs plafonnées dans leurs limites (ex. Fortune si le Destin baisse). */
  protected limit(): void {
    const limited = enforceLimits(this.draft());
    const d = this.draft();
    d.wounds.current = limited.wounds.current;
    d.points = limited.points;
  }

  protected addSkill(): void {
    this.draft().skills.push({ name: '', characteristic: 'cc', advances: 0, advanced: false, career: false });
  }

  protected addTalent(): void {
    this.draft().talents.push({ name: '', timesTaken: 1, description: '' });
  }

  protected addWeapon(): void {
    this.draft().weapons.push({
      name: '',
      group: 'Base',
      encumbrance: 0,
      reachOrRange: '',
      damage: { usesStrengthBonus: true, modifier: 0 },
      qualities: [],
    });
  }

  protected addArmour(): void {
    this.draft().armour.push({ name: '', locations: [], encumbrance: 0, armourPoints: 0, qualities: [] });
  }

  protected addTrapping(): void {
    this.draft().trappings.push({ name: '', quantity: 1, encumbrance: 0 });
  }

  protected addSpell(): void {
    this.draft().spells.push({
      name: '',
      lore: '',
      castingNumber: 0,
      range: '',
      target: '',
      duration: '',
      effect: '',
    });
  }

  protected remove<T>(list: T[], index: number): void {
    list.splice(index, 1);
  }

  protected toggleLocation(locations: HitLocation[], location: HitLocation): void {
    const i = locations.indexOf(location);
    if (i === -1) locations.push(location);
    else locations.splice(i, 1);
  }

  /** "a, b, c" → ['a', 'b', 'c'] */
  protected splitList(value: string, separator: string | RegExp = ','): string[] {
    return value
      .split(separator)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected submit(): void {
    const c = enforceLimits(this.draft());
    // Les lignes laissées sans nom sont ignorées.
    c.skills = c.skills.filter((s) => s.name.trim());
    c.talents = c.talents.filter((t) => t.name.trim());
    c.weapons = c.weapons.filter((w) => w.name.trim());
    c.armour = c.armour.filter((a) => a.name.trim());
    c.trappings = c.trappings.filter((t) => t.name.trim());
    c.spells = c.spells.filter((s) => s.name.trim());
    this.save.emit(c);
  }
}
