import { DatePipe } from '@angular/common';
import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/data/campaign.repository';

@Component({
  selector: 'app-journal-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './journal.page.html',
})
export class JournalPage {
  private readonly repo = inject(CampaignRepository);

  protected readonly sessions = resource({ loader: () => this.repo.getSessions() });
}
