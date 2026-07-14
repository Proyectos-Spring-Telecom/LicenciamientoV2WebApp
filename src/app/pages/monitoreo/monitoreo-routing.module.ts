import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonitoreoComponent } from './monitoreo.component';

const routes: Routes = [
  {
    path: '',
    component: MonitoreoComponent,
  },
  {
    path: 'mapa',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: '**',
    component: MonitoreoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MonitoreoRoutingModule {}
