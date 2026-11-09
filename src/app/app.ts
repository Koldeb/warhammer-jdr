import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { ThemeToggleComponent } from './shared/theme-toggle.component';

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
    MatDividerModule,
    ThemeToggleComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** Mobile et tablette portrait : menu latéral en surimpression. */
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  /** Page plein écran (connexion, démo) : ni barre ni menu. */
  protected readonly bare = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => isBare(this.router.routerState.snapshot.root)),
    ),
    { initialValue: true },
  );

  protected readonly showNav = computed(() => !this.bare() && !!this.auth.user());

  protected readonly navLinks = [
    { path: '/', label: 'Groupe', icon: 'groups', exact: true },
    { path: '/journal', label: 'Journal', icon: 'menu_book', exact: false },
  ];

  protected readonly initial = computed(() => this.auth.user()?.displayName.charAt(0).toUpperCase() ?? '');

  protected closeIfHandset(drawer: MatSidenav): void {
    if (this.isHandset()) drawer.close();
  }

  /** Mode démo : change de profil puis recharge la page pour appliquer ses droits. */
  protected async viewAs(profileId: string): Promise<void> {
    this.auth.impersonate(profileId);
    const url = this.router.url;
    await this.router.navigateByUrl('/demo', { skipLocationChange: true });
    await this.router.navigateByUrl(url);
  }

  protected async logout(): Promise<void> {
    const wasDemo = this.auth.isDemo();
    await this.auth.signOut();
    this.router.navigateByUrl(wasDemo ? '/demo' : '/connexion');
  }
}

function isBare(route: ActivatedRouteSnapshot): boolean {
  for (let r: ActivatedRouteSnapshot | null = route; r; r = r.firstChild) {
    if (r.data['bare']) return true;
  }
  return false;
}
