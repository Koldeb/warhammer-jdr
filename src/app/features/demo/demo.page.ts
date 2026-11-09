import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { TestResult, formatSl, resolveTest, rollD100 } from '../../core/rules/dice';
import { SpotlightDirective } from '../../shared/spotlight.directive';
import { ThemeToggleComponent } from '../../shared/theme-toggle.component';

/** Page publique de présentation du projet, avec accès à la démo (données mockées). */
@Component({
  selector: 'app-demo-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatRippleModule,
    SpotlightDirective,
    ThemeToggleComponent,
  ],
  templateUrl: './demo.page.html',
})
export class DemoPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly credentials = environment.demo;

  private readonly loginInput = viewChild<ElementRef<HTMLInputElement>>('loginInput');

  protected readonly form = inject(NonNullableFormBuilder).group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly showPassword = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly attempt = signal(0);

  protected readonly features = [
    {
      icon: 'badge',
      title: 'Fiches complètes',
      text: 'Caractéristiques, compétences, talents, équipement et sorts, modifiables par leur joueur.',
    },
    {
      icon: 'casino',
      title: 'Tests en un clic',
      text: 'Degrés de réussite, critiques, maladresses et relance avec un point de Fortune.',
    },
    {
      icon: 'menu_book',
      title: 'Journal de campagne',
      text: 'Chaque séance : résumé, événements, PNJ rencontrés, lieux et butin.',
    },
    {
      icon: 'shield_person',
      title: 'Rôles MJ et joueurs',
      text: 'Chaque joueur ne voit que sa fiche ; le MJ voit tout, y compris ses notes privées.',
    },
  ];

  /** Widget de démonstration : test de CC d'un personnage fictif. */
  protected readonly sample = { label: 'Capacité de Combat', value: 47 };
  protected readonly roll = signal<TestResult | null>(null);
  protected readonly rollCount = signal(0);
  protected readonly formatSl = formatSl;

  protected rollDice(): void {
    this.roll.set(resolveTest(this.sample.value, rollD100(), true));
    this.rollCount.update((n) => n + 1);
  }

  protected fillCredentials(): void {
    this.form.setValue({ login: this.credentials.login, password: this.credentials.password });
    this.error.set(null);
  }

  protected focusLogin(): void {
    this.loginInput()?.nativeElement.focus();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { login, password } = this.form.getRawValue();
    if (this.auth.signInDemo(login, password)) {
      this.router.navigateByUrl('/');
    } else {
      this.error.set('Identifiant ou mot de passe incorrect.');
      this.attempt.update((n) => n + 1);
    }
  }
}
