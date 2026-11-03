import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [MatCardModule, MatListModule, MatIconModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  //Changer pour Supabase
  // Recevoir e-mail + mot de passe et attendre la connexion Supabase avant de naviguer.
  protected login(userId: string): void {
    this.auth.login(userId);
    this.router.navigateByUrl('/');
  }
}
