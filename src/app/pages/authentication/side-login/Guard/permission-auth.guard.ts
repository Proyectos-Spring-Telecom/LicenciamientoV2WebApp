import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthenticationService } from 'src/app/services/auth.service';

/** Requiere sesión + permiso en route.data['permiso'] (ids string en sessionStorage). */
@Injectable({ providedIn: 'root' })
export class PermissionAuthGuard implements CanActivate {
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['/login']);
    }

    const required = route.data['permiso'];
    if (required == null || required === '') {
      return true;
    }

    const needed = Array.isArray(required)
      ? required.map(String)
      : [String(required)];
    const perms = this.auth.getPermissions();
    const ok = needed.some((p) => perms.includes(p));
    return ok ? true : this.router.createUrlTree(['/starter']);
  }
}
