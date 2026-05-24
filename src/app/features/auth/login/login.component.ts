import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly hidePassword = signal(true);
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  hasError(controlName: 'email' | 'password', errorType: string): boolean {
    const ctrl = this.form.controls[controlName];
    if (!ctrl.hasError(errorType)) return false;
    return ctrl.dirty || ctrl.touched || this.submitted();
  }

  isFieldInvalid(controlName: 'email' | 'password'): boolean {
    const ctrl = this.form.controls[controlName];
    if (!ctrl.invalid) return false;
    return ctrl.dirty || ctrl.touched || this.submitted();
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/chat';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(this.extractError(err));
        }
      });
  }

  private extractError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401 || err.status === 400) return 'Email hoặc mật khẩu không đúng';
      if (err.status === 0) return 'Không kết nối được máy chủ';
      return err.error?.message ?? 'Đăng nhập thất bại';
    }
    return 'Đăng nhập thất bại';
  }
}
