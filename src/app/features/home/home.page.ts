import { Component, computed, inject, resource } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { SPECIES_LABELS } from '../../core/rules/wfrp';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly repo = inject(CampaignRepository);
  protected readonly auth = inject(AuthService);

  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly campaign = resource({ loader: () => this.repo.getCampaign() });
  protected readonly characters = resource({ loader: () => this.repo.getCharacters() });
  protected readonly lastSession = resource({
    loader: async () => (await this.repo.getSessions())[0],
  });

  private readonly profiles = resource({ loader: () => this.repo.getProfiles() });
  protected readonly playerNames = computed(
    () => new Map((this.profiles.value() ?? []).map((p) => [p.id, p.displayName])),
  );
}
