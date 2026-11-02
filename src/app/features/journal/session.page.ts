import { DatePipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { Npc } from '../../core/models/campaign.model';

@Component({
  selector: 'app-session-page',
  imports: [RouterLink, DatePipe],
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
}
