import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  /** Mobile et tablette portrait : menu latéral en surimpression. */
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly navLinks = [
    { path: '/', label: 'Groupe', icon: 'groups', exact: true },
    { path: '/journal', label: 'Journal', icon: 'menu_book', exact: false },
  ];

  protected readonly initial = computed(() => this.auth.user()?.displayName.charAt(0).toUpperCase() ?? '');

  protected closeIfHandset(drawer: MatSidenav): void {
    if (this.isHandset()) drawer.close();
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/connexion');
  }
}
