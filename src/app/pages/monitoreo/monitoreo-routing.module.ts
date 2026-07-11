import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapaComponent } from './mapa/mapa.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'mapa',
    pathMatch: 'full',
  },
  {
    path: 'mapa',
    component: MapaComponent,
  },
  {
    path: '**',
    component: MapaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MonitoreoRoutingModule {}
