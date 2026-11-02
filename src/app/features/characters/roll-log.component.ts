import { Component, input, output } from '@angular/core';
import { TestResult, formatSl } from '../../core/rules/dice';

export interface RollEntry {
  id: number;
  label: string;
  difficulty: string;
  /** Test de CC/CT (critiques et maladresses). */
  combat: boolean;
  result: TestResult;
  /** Résultat du premier jet si le test a été relancé. */
  previous?: TestResult;
}

/** Historique des derniers jets, affiché en bas à droite de l'écran. */
@Component({
  selector: 'app-roll-log',
  templateUrl: './roll-log.component.html',
})
export class RollLogComponent {
  readonly rolls = input.required<RollEntry[]>();
  /** L'utilisateur peut modifier la fiche et a au moins 1 point de Fortune. */
  readonly canReroll = input(false);
  readonly reroll = output<number>();
  readonly clear = output<void>();

  protected readonly formatSl = formatSl;
}
