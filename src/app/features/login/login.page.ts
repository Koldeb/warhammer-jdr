import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected login(userId: string): void {
    this.auth.login(userId);
    this.router.navigateByUrl('/');
  }
}
