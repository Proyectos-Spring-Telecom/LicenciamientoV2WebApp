import { DetalleLocalComercialComponent } from './components/detalle-local-comercial/detalle-local-comercial.component';
import { LocalComercialFormularioComponent } from './components/formulario/local-comercial-formulario.component';
import { ListaLocalComercialComponent } from './components/lista/lista-local-comercial.component';
import { PreRegistroLocalComponent } from './components/pre-registro/pre-registro-local.component';

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
        path: 'pre-alta-local-comercial',
        component: PreRegistroLocalComponent,
      },
      {
        path: 'alta-local-comercial',
        component: LocalComercialFormularioComponent,
      },
      {
        path: 'detalle-local-comercial/:id',
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
