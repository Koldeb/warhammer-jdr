import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthShellComponent } from '../../shared/auth-shell.component';

/** Connexion par e-mail et mot de passe à Supabase. */
@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    AuthShellComponent,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** Page demandée avant la redirection vers la connexion (paramètre ?redirect=). */
  readonly redirect = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Incrémenté à chaque échec pour rejouer l'animation de secousse. */
  protected readonly attempt = signal(0);

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signIn(email.trim(), password);
      await this.router.navigateByUrl(safeRedirect(this.redirect()));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'La connexion a échoué.');
      this.attempt.update((n) => n + 1);
      this.form.controls.password.reset();
    } finally {
      this.submitting.set(false);
    }
  }
}

/** N'accepte que les chemins internes (évite une redirection ouverte vers un autre site). */
export function safeRedirect(url: string | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}
