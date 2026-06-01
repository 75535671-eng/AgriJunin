import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then((m) => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then((m) => m.RegisterComponent) },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      {
        path: 'admin/usuarios-pendientes',
        canActivate: [roleGuard('administrador')],
        loadComponent: () => import('./pages/admin/usuarios-pendientes.component').then((m) => m.UsuariosPendientesComponent),
      },
      { path: 'clima', loadComponent: () => import('./pages/clima/clima-huancayo.component').then((m) => m.ClimaHuancayoComponent) },
      {
        path: 'agricultores',
        canActivate: [roleGuard('administrador', 'tecnico')],
        loadComponent: () => import('./pages/agricultores/agricultores-list.component').then((m) => m.AgricultoresListComponent),
      },
      { path: 'agricultores/nuevo', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/agricultores/agricultor-form.component').then((m) => m.AgricultorFormComponent) },
      { path: 'agricultores/:id/editar', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/agricultores/agricultor-form.component').then((m) => m.AgricultorFormComponent) },
      { path: 'cultivos', loadComponent: () => import('./pages/cultivos/cultivos-list.component').then((m) => m.CultivosListComponent) },
      { path: 'cultivos/nuevo', loadComponent: () => import('./pages/cultivos/cultivo-form.component').then((m) => m.CultivoFormComponent) },
      { path: 'cultivos/:id/editar', loadComponent: () => import('./pages/cultivos/cultivo-form.component').then((m) => m.CultivoFormComponent) },
      { path: 'lotes', loadComponent: () => import('./pages/lotes/lotes-list.component').then((m) => m.LotesListComponent) },
      { path: 'lotes/nuevo', loadComponent: () => import('./pages/lotes/lote-form.component').then((m) => m.LoteFormComponent) },
      { path: 'lotes/:id/editar', loadComponent: () => import('./pages/lotes/lote-form.component').then((m) => m.LoteFormComponent) },
      { path: 'sensores', loadComponent: () => import('./pages/sensores/sensores-list.component').then((m) => m.SensoresListComponent) },
      { path: 'sensores/nuevo', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/sensores/sensor-form.component').then((m) => m.SensorFormComponent) },
      { path: 'sensores/:id/editar', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/sensores/sensor-form.component').then((m) => m.SensorFormComponent) },
      { path: 'registros', loadComponent: () => import('./pages/registros/registros-list.component').then((m) => m.RegistrosListComponent) },
      { path: 'registros/nuevo', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/registros/registro-form.component').then((m) => m.RegistroFormComponent) },
      { path: 'registros/:id/editar', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/registros/registro-form.component').then((m) => m.RegistroFormComponent) },
      { path: 'alertas', loadComponent: () => import('./pages/alertas/alertas-list.component').then((m) => m.AlertasListComponent) },
      { path: 'alertas/nuevo', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/alertas/alerta-form.component').then((m) => m.AlertaFormComponent) },
      { path: 'alertas/:id/editar', canActivate: [roleGuard('administrador', 'tecnico')], loadComponent: () => import('./pages/alertas/alerta-form.component').then((m) => m.AlertaFormComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
