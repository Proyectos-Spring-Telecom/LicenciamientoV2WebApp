import { DetalleLocalComercialComponent } from './components/detalle-local-comercial/detalle-local-comercial.component';
import { LocalComercialFormularioComponent } from './components/formulario/local-comercial-formulario.component';
import { ListaLocalComercialComponent } from './components/lista/lista-local-comercial.component';

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'lista-local-comercial',
        component: ListaLocalComercialComponent,
      },
      {
        path: 'actualizar-local-comercial/:id',
        component: LocalComercialFormularioComponent,
      },
      {
        path: 'alta-local-comercial',
        component: LocalComercialFormularioComponent,
      },
      {
        path: 'detalle-local-comercial',
        component: DetalleLocalComercialComponent,
      },
      {
        path: '**',
        component: ListaLocalComercialComponent,
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LocalComercialRoutingModule {}
