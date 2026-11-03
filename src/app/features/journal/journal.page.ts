import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/data/campaign.repository';

@Component({
  selector: 'app-journal-page',
  imports: [RouterLink, DatePipe, MatIconModule, MatProgressBarModule],
  templateUrl: './journal.page.html',
})
export class JournalPage {
  private readonly repo = inject(CampaignRepository);

  protected readonly sessions = resource({ loader: () => this.repo.getSessions() });
}
