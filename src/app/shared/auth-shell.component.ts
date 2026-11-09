import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from './theme-toggle.component';

/**
 * Mise en page des pages de connexion : panneau de présentation à gauche (grand écran)
 * et formulaire projeté à droite.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink, MatIconModule, ThemeToggleComponent],
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside class="auth-hero relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden="true">
        <div class="auth-orb auth-orb-1"></div>
        <div class="auth-orb auth-orb-2"></div>
        <div class="auth-grid"></div>

        <a routerLink="/demo" tabindex="-1" class="relative flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-white">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur"><mat-icon>swords</mat-icon></span>
          Warhammer JDR
        </a>

        <div class="relative max-w-md text-white">
          <h2 class="font-display text-4xl leading-tight font-extrabold tracking-tight">Le compagnon de vos campagnes dans le Vieux Monde.</h2>
          <ul class="mt-8 space-y-4 text-white/85">
            @for (f of features; track f.icon; let i = $index) {
              <li class="stagger flex items-center gap-3" [style.--i]="i + 2">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/15 backdrop-blur"><mat-icon class="icon-sm">{{ f.icon }}</mat-icon></span>
                {{ f.label }}
              </li>
            }
          </ul>
        </div>

        <p class="relative text-sm text-white/60">Warhammer Fantasy Roleplay 4e — outil de table non officiel.</p>
      </aside>

      <section class="relative flex flex-col">
        <div class="flex items-center justify-between p-4 sm:p-6">
          <a routerLink="/demo" class="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight lg:invisible">
            <span class="avatar h-8 w-8"><mat-icon class="icon-sm">swords</mat-icon></span>
            Warhammer <span class="text-gradient">JDR</span>
          </a>
          <app-theme-toggle />
        </div>
        <div class="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div class="w-full max-w-sm">
            <ng-content />
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .auth-hero {
      background: linear-gradient(150deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
    }
    :host-context(.dark) .auth-hero {
      background: linear-gradient(150deg, #1c1917 0%, #0c0a09 100%);
    }
    /* Halos flottants. */
    .auth-orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(60px);
      opacity: 0.55;
      animation: float 14s ease-in-out infinite alternate;
    }
    .auth-orb-1 {
      width: 28rem;
      height: 28rem;
      top: -8rem;
      right: -6rem;
      background: var(--mat-sys-secondary);
    }
    .auth-orb-2 {
      width: 22rem;
      height: 22rem;
      bottom: -6rem;
      left: -4rem;
      background: var(--mat-sys-tertiary);
      animation-delay: -7s;
    }
    :host-context(.dark) .auth-orb-1 {
      background: var(--mat-sys-primary);
      opacity: 0.35;
    }
    :host-context(.dark) .auth-orb-2 {
      background: var(--mat-sys-secondary);
      opacity: 0.18;
    }
    /* Trame discrète. */
    .auth-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
    }
    @keyframes float {
      to {
        transform: translate(-3rem, 2rem) scale(1.1);
      }
    }
  `,
})
export class AuthShellComponent {
  protected readonly features = [
    { icon: 'badge', label: 'Fiches de personnage complètes et modifiables' },
    { icon: 'casino', label: 'Tests de compétence en un clic, Fortune incluse' },
    { icon: 'menu_book', label: 'Journal de campagne partagé avec le groupe' },
    { icon: 'shield_person', label: 'Droits MJ / joueurs, notes privées du MJ' },
  ];
}
