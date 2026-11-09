import { DatePipe } from '@angular/common';
import { Component, computed, inject, resource } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CampaignRepository } from '../../core/data/campaign.repository';
import { SPECIES_LABELS, maxWounds } from '../../core/rules/wfrp';
import { SpotlightDirective } from '../../shared/spotlight.directive';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, DatePipe, MatIconModule, SpotlightDirective],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly repo = inject(CampaignRepository);
  protected readonly auth = inject(AuthService);

  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly maxWounds = maxWounds;
  protected readonly campaign = resource({ loader: () => this.repo.getCampaign() });
  protected readonly characters = resource({ loader: () => this.repo.getCharacters() });
  protected readonly sessions = resource({ loader: () => this.repo.getSessions() });
  protected readonly lastSession = computed(() => this.sessions.value()?.[0]);

  private readonly profiles = resource({ loader: () => this.repo.getProfiles() });
  protected readonly playerNames = computed(
    () => new Map((this.profiles.value() ?? []).map((p) => [p.id, p.displayName])),
  );
}
