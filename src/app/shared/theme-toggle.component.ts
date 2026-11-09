import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../core/theme/theme.service';

/** Bouton clair / sombre. Le nouveau thème se révèle depuis le centre du bouton. */
@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="theme.isDark() ? 'Passer au thème clair' : 'Passer au thème sombre'"
      [attr.aria-pressed]="theme.isDark()"
      [matTooltip]="theme.isDark() ? 'Thème clair' : 'Thème sombre'"
      (click)="toggle($event)"
    >
      @for (icon of [theme.isDark() ? 'light_mode' : 'dark_mode']; track icon) {
        <mat-icon animate.enter="theme-icon-enter">{{ icon }}</mat-icon>
      }
    </button>
  `,
  styles: `
    .theme-toggle .mat-icon {
      transition: transform 400ms var(--ease-spring);
    }
    .theme-toggle:hover .mat-icon {
      transform: rotate(-20deg) scale(1.1);
    }
    .theme-icon-enter {
      animation: theme-icon-enter 450ms var(--ease-spring) both;
    }
    @keyframes theme-icon-enter {
      from {
        opacity: 0;
        transform: rotate(-120deg) scale(0.4);
      }
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);

  protected toggle(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.theme.toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }
}
