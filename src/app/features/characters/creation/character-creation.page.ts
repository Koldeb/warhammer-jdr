import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, resource, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CampaignRepository } from '../../../core/data/campaign.repository';
import { Character, CharacteristicKey, Species } from '../../../core/models/character.model';
import { rollDie } from '../../../core/rules/dice';
import {
  CAREER_ADVANCES,
  CAREER_SKILL_ADVANCES,
  CAREER_SKILL_MAX,
  CAREER_XP,
  CHARACTERISTIC_XP,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  POINT_BUY_TOTAL,
  SPECIES_ROLL_XP,
  SPECIES_SKILL_PICKS,
  advancesSpent,
  advancesValid,
  buildCharacter,
  careerSkillsSpent,
  careerSkillsValid,
  careersFor,
  characteristicsValid,
  creationXp,
  detailsValid,
  draftCharacteristics,
  findCareer,
  needsSpecialization,
  newDraft,
  pointsSpent,
  randomDraft,
  rollCareers,
  rollCharacteristics,
  rollDetails,
  rollRandomTalents,
  rollSpecies,
  setCareer,
  setSpecies,
  speciesSkillCount,
  speciesSkillsValid,
  speciesTalents,
  talentDescription,
  talentsValid,
} from '../../../core/rules/creation';
import {
  CAREER_CLASSES,
  CareerDef,
  MOTIVATIONS,
  RANDOM_TALENTS,
  SPECIES,
} from '../../../core/rules/creation-data';
import {
  CHARACTERISTICS,
  SPECIES_LABELS,
  STATUS_TIER_LABELS,
  bonus,
  maxWounds,
} from '../../../core/rules/wfrp';

/**
 * Assistant de création de personnage (WFRP 4e) : chaque étape se fait à la main ou au hasard,
 * avec les bonus d'XP prévus par les règles. Le brouillon est un objet modifié en place, comme
 * dans CharacterEditorComponent ; les valeurs dérivées sont recalculées à chaque rendu.
 */
@Component({
  selector: 'app-character-creation-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatStepperModule,
  ],
  templateUrl: './character-creation.page.html',
})
export class CharacterCreationPage {
  private readonly repo = inject(CampaignRepository);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  private readonly stepper = viewChild.required(MatStepper);

  protected readonly vertical = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected draft = newDraft();
  /** Un premier tirage a déjà eu lieu : relancer ne rapporte plus d'XP. */
  private characteristicsRolled = false;
  /** Caractéristique sélectionnée pour un échange (méthode « echange »). */
  protected readonly swapping = signal<CharacteristicKey | null>(null);

  /** Options réservées au MJ. */
  protected playerId = this.auth.user()?.id ?? '';
  protected hidden = false;
  protected readonly profiles = resource({ loader: () => this.repo.getProfiles() });

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly speciesList = Object.entries(SPECIES_LABELS) as [Species, string][];
  protected readonly speciesDefs = SPECIES;
  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly tierLabels = STATUS_TIER_LABELS;
  protected readonly characteristics = CHARACTERISTICS;
  protected readonly classes = CAREER_CLASSES;
  protected readonly randomTalentTable = [...new Set(RANDOM_TALENTS.map(([, t]) => t))];
  protected readonly motivations = MOTIVATIONS;
  protected readonly xp = {
    species: SPECIES_ROLL_XP,
    career: CAREER_XP,
    characteristics: CHARACTERISTIC_XP,
  };
  protected readonly limits = {
    advances: CAREER_ADVANCES,
    careerSkills: CAREER_SKILL_ADVANCES,
    careerSkillMax: CAREER_SKILL_MAX,
    points: POINT_BUY_TOTAL,
    pointMin: POINT_BUY_MIN,
    pointMax: POINT_BUY_MAX,
    speciesSkills: SPECIES_SKILL_PICKS,
  };

  // Fonctions de règles utilisées par le gabarit.
  protected readonly creationXp = creationXp;
  protected readonly pointsSpent = pointsSpent;
  protected readonly advancesSpent = advancesSpent;
  protected readonly careerSkillsSpent = careerSkillsSpent;
  protected readonly speciesSkillCount = speciesSkillCount;
  protected readonly speciesTalents = speciesTalents;
  protected readonly talentDescription = talentDescription;
  protected readonly needsSpecialization = needsSpecialization;
  protected readonly bonus = bonus;
  protected readonly valid = {
    species: () => true,
    career: () => !!this.career(),
    characteristics: () => characteristicsValid(this.draft) && advancesValid(this.draft),
    skills: () => speciesSkillsValid(this.draft) && careerSkillsValid(this.draft),
    talents: () => talentsValid(this.draft),
    details: () => detailsValid(this.draft),
  };

  protected characteristicAbbr(key: CharacteristicKey): string {
    return CHARACTERISTICS.find((c) => c.key === key)?.abbr ?? key;
  }

  protected characteristicLabel(key: CharacteristicKey): string {
    return CHARACTERISTICS.find((c) => c.key === key)?.label ?? key;
  }

  protected career(): CareerDef | undefined {
    return findCareer(this.draft.careerName);
  }

  /** Carrières accessibles à l'espèce, groupées par classe. */
  protected careerGroups(): { name: string; careers: CareerDef[] }[] {
    const careers = careersFor(this.draft.species);
    return this.classes
      .map((name) => ({ name, careers: careers.filter((c) => c.class === name) }))
      .filter((g) => g.careers.length);
  }

  protected rolledCareers(): CareerDef[] {
    return this.draft.careerRolls.map((n) => findCareer(n)!);
  }

  // --- Tout au hasard -------------------------------------------------------

  protected randomizeAll(): void {
    this.draft = randomDraft();
    this.characteristicsRolled = true;
    this.swapping.set(null);
    this.stepper().selectedIndex = this.stepper().steps.length - 1;
  }

  // --- Espèce ---------------------------------------------------------------

  protected chooseSpecies(species: Species): void {
    setSpecies(this.draft, species, false);
  }

  protected rollSpecies(): void {
    setSpecies(this.draft, rollSpecies(), true);
  }

  // --- Carrière -------------------------------------------------------------

  protected chooseCareer(name: string): void {
    setCareer(this.draft, name, 'choix', []);
  }

  protected rollOneCareer(): void {
    const [career] = rollCareers(this.draft.species, 1);
    setCareer(this.draft, career.name, 'tirage', [career.name]);
  }

  protected rollThreeCareers(): void {
    const careers = rollCareers(this.draft.species, 3).map((c) => c.name);
    setCareer(this.draft, '', 'tirage3', careers);
  }

  protected pickRolledCareer(name: string): void {
    setCareer(this.draft, name, 'tirage3', this.draft.careerRolls);
  }

  // --- Caractéristiques -----------------------------------------------------

  protected total(key: CharacteristicKey): number {
    const c = draftCharacteristics(this.draft)[key];
    return c.initial + c.advances;
  }

  protected rollCharacteristics(): void {
    this.draft.rolls = rollCharacteristics();
    this.draft.characteristicMethod = this.characteristicsRolled ? 'relance' : 'tirage';
    this.characteristicsRolled = true;
    this.swapping.set(null);
  }

  protected usePoints(): void {
    this.draft.characteristicMethod = 'points';
    for (const c of this.characteristics)
      this.draft.rolls[c.key] = POINT_BUY_TOTAL / this.characteristics.length;
    this.swapping.set(null);
  }

  protected canSwap(): boolean {
    return (
      this.draft.characteristicMethod === 'tirage' || this.draft.characteristicMethod === 'echange'
    );
  }

  /** Premier clic : sélectionne ; second clic : échange les deux tirages. */
  protected swap(key: CharacteristicKey): void {
    const first = this.swapping();
    if (!first) return this.swapping.set(key);
    this.swapping.set(null);
    if (first === key) return;
    const r = this.draft.rolls;
    [r[first], r[key]] = [r[key], r[first]];
    this.draft.characteristicMethod = 'echange';
  }

  protected adjustAdvance(key: CharacteristicKey, delta: number): void {
    const a = this.draft.characteristicAdvances;
    const next = (a[key] ?? 0) + delta;
    if (next < 0 || advancesSpent(this.draft) + delta > CAREER_ADVANCES) return;
    a[key] = next;
  }

  protected randomAdvances(): void {
    const career = this.career();
    if (!career) return;
    this.draft.characteristicAdvances = Object.fromEntries(
      career.characteristics.map((k) => [k, 0]),
    );
    for (let i = 0; i < CAREER_ADVANCES; i++)
      this.adjustAdvance(career.characteristics[rollDie(3) - 1], 1);
  }

  protected fate(): number {
    return SPECIES[this.draft.species].fate + this.draft.extraFate;
  }

  protected resilience(): number {
    const def = SPECIES[this.draft.species];
    return def.resilience + def.extraPoints - this.draft.extraFate;
  }

  protected adjustExtraFate(delta: number): void {
    const next = this.draft.extraFate + delta;
    if (next >= 0 && next <= SPECIES[this.draft.species].extraPoints) this.draft.extraFate = next;
  }

  // --- Compétences ----------------------------------------------------------

  protected setSpeciesSkill(ref: string, advances: 0 | 3 | 5): void {
    this.draft.speciesSkills[ref] = advances;
  }

  /** Le bouton +3 / +5 est grisé quand ses 3 places sont prises (sauf pour la compétence qui l'occupe). */
  protected speciesSkillFull(ref: string, advances: 3 | 5): boolean {
    return (
      this.draft.speciesSkills[ref] !== advances &&
      speciesSkillCount(this.draft, advances) >= SPECIES_SKILL_PICKS[advances]
    );
  }

  protected randomSpeciesSkills(): void {
    const refs = [...SPECIES[this.draft.species].skills];
    for (const ref of refs) this.draft.speciesSkills[ref] = 0;
    for (const advances of [5, 3] as const) {
      for (let i = 0; i < SPECIES_SKILL_PICKS[advances]; i++) {
        const free = refs.filter((r) => this.draft.speciesSkills[r] === 0);
        this.draft.speciesSkills[free[rollDie(free.length) - 1]] = advances;
      }
    }
  }

  protected adjustCareerSkill(ref: string, delta: number): void {
    const next = (this.draft.careerSkills[ref] ?? 0) + delta;
    if (next < 0 || next > CAREER_SKILL_MAX) return;
    if (delta > 0 && careerSkillsSpent(this.draft) + delta > CAREER_SKILL_ADVANCES) return;
    this.draft.careerSkills[ref] = next;
  }

  protected randomCareerSkills(): void {
    const refs = this.career()?.skills ?? [];
    for (const ref of refs) this.draft.careerSkills[ref] = 0;
    while (careerSkillsSpent(this.draft) < CAREER_SKILL_ADVANCES) {
      const open = refs.filter((r) => this.draft.careerSkills[r] < CAREER_SKILL_MAX);
      this.draft.careerSkills[open[rollDie(open.length) - 1]]++;
    }
  }

  /** Compétences et talents dont la spécialisation reste à préciser. */
  protected pendingSpecializations(): string[] {
    const refs = [
      ...Object.entries(this.draft.speciesSkills)
        .filter(([, v]) => v > 0)
        .map(([r]) => r),
      ...(this.career()?.skills ?? []),
      ...speciesTalents(this.draft),
      this.draft.careerTalent,
    ];
    return [...new Set(refs)].filter(
      (r) => r && needsSpecialization(r) && !this.draft.specializations[r]?.trim(),
    );
  }

  // --- Talents --------------------------------------------------------------

  protected isChoice(talent: string | string[]): talent is string[] {
    return Array.isArray(talent);
  }

  protected rollRandomTalents(): void {
    this.draft.randomTalents = rollRandomTalents(this.draft.species);
  }

  protected setRandomTalent(index: number, talent: string): void {
    this.draft.randomTalents[index] = talent;
  }

  protected randomTalentSlots(): number[] {
    return Array.from({ length: SPECIES[this.draft.species].randomTalents }, (_, i) => i);
  }

  /** Talent de carrière déjà obtenu par l'espèce : on en choisit un autre. */
  protected ownedBySpecies(talent: string): boolean {
    return speciesTalents(this.draft).includes(talent);
  }

  protected allTalents(): string[] {
    return [...speciesTalents(this.draft), this.draft.careerTalent].filter(Boolean);
  }

  protected randomCareerTalent(): void {
    const options = (this.career()?.talents ?? []).filter((t) => !this.ownedBySpecies(t));
    this.draft.careerTalent = options[rollDie(options.length) - 1] ?? '';
  }

  protected randomSpeciesTalentChoices(): void {
    SPECIES[this.draft.species].talents.forEach((t, i) => {
      if (Array.isArray(t)) this.draft.talentChoices[i] = t[rollDie(t.length) - 1];
    });
  }

  // --- Détails --------------------------------------------------------------

  protected rollName(): void {
    this.draft.name = rollDetails(this.draft.species).name;
  }

  protected rollAppearance(): void {
    const { details } = rollDetails(this.draft.species);
    Object.assign(this.draft.details, {
      age: details.age,
      height: details.height,
      hair: details.hair,
      eyes: details.eyes,
    });
  }

  protected rollMotivation(): void {
    this.draft.motivation = MOTIVATIONS[rollDie(MOTIVATIONS.length) - 1];
  }

  // --- Création -------------------------------------------------------------

  protected maxWounds(): number {
    // maxWounds ne lit que l'espèce et les caractéristiques.
    return maxWounds({
      species: this.draft.species,
      characteristics: draftCharacteristics(this.draft),
    } as Character);
  }

  /** Ce qui manque encore avant de pouvoir créer la fiche. */
  protected problems(): string[] {
    const p: string[] = [];
    if (!this.valid.career()) p.push('Choisir une carrière.');
    if (!characteristicsValid(this.draft))
      p.push(
        `Répartir exactement ${POINT_BUY_TOTAL} points (${POINT_BUY_MIN} à ${POINT_BUY_MAX} par caractéristique).`,
      );
    if (!advancesValid(this.draft))
      p.push(`Répartir les ${CAREER_ADVANCES} augmentations de caractéristiques.`);
    if (!speciesSkillsValid(this.draft)) p.push("Choisir 3 compétences d'espèce à +5 et 3 à +3.");
    if (!careerSkillsValid(this.draft))
      p.push(`Répartir les ${CAREER_SKILL_ADVANCES} augmentations de compétences de carrière.`);
    if (!talentsValid(this.draft)) p.push('Compléter les talents.');
    if (!detailsValid(this.draft)) p.push('Donner un nom au personnage.');
    return p;
  }

  protected async create(): Promise<void> {
    if (this.problems().length || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const character = buildCharacter(
        this.draft,
        this.auth.isGm() ? this.playerId : (this.auth.user()?.id ?? ''),
      );
      if (this.auth.isGm()) character.hidden = this.hidden;
      const created = await this.repo.createCharacter(character);
      await this.router.navigate(['/personnages', created.id]);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'La création a échoué.');
    } finally {
      this.saving.set(false);
    }
  }
}
