import { DatePipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { Npc } from '../../core/models/campaign.model';

@Component({
  selector: 'app-session-page',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './session.page.html',
})
export class SessionPage {
  private readonly repo = inject(CampaignRepository);

  /** Paramètre de route :id. */
  readonly id = input.required<string>();

  protected readonly session = resource({
    params: () => this.id(),
    loader: ({ params }) => this.repo.getSession(params),
  });

  protected readonly gmNotes = resource({
    params: () => this.id(),
    loader: ({ params }) => this.repo.getGmNotes(params),
  });

  protected readonly attitudeLabels: Record<Npc['attitude'], string> = {
    allie: 'Allié',
    neutre: 'Neutre',
    hostile: 'Hostile',
    inconnu: 'Inconnu',
  };

  protected readonly attitudeClasses: Record<Npc['attitude'], string> = {
    allie: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    neutre: 'bg-surface-container-highest text-on-surface-variant',
    hostile: 'bg-error-container text-on-error-container',
    inconnu: 'bg-surface-container-highest text-on-surface-variant',
  };
}
