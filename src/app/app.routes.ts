import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './pages/authentication/side-login/Guard/auth.guard';
import { NoAuthGuard } from './pages/authentication/side-login/Guard/no-auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' },

  {
    path: '',
    component: BlankComponent,
    canActivate: [NoAuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },

  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/starter',
        pathMatch: 'full',
      },
      {
        path: 'starter',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'permisos',
        loadChildren: () =>
          import('./pages/permisos/permisos.module').then((m) => m.PermisosModule),
      },
      {
        path: 'modulos',
        loadChildren: () =>
          import('./pages/modulos/modulos.module').then((m) => m.ModulosModule),
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./pages/usuarios/usuarios.module').then((m) => m.UsuariosModule),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'sample-page',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'local-comercial',
        loadChildren: () =>
          import('./pages/local-comercial/local-comercial.module').then(
            (m) => m.LocalComercialModule
          ),
      },
      {
        path: 'monitoreo',
        loadChildren: () =>
          import('./pages/monitoreo/monitoreo.module').then((m) => m.MonitoreoModule),
      },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
