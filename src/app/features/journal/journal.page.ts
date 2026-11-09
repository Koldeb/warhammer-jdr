import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { SpotlightDirective } from '../../shared/spotlight.directive';

@Component({
  selector: 'app-journal-page',
  imports: [RouterLink, DatePipe, MatIconModule, SpotlightDirective],
  templateUrl: './journal.page.html',
})
export class JournalPage {
  private readonly repo = inject(CampaignRepository);

  protected readonly sessions = resource({ loader: () => this.repo.getSessions() });
}
