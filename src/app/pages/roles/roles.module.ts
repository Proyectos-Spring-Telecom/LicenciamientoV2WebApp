import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesRoutingModule } from './roles-routing.module';
import { MatIconModule } from '@angular/material/icon';
import { DxButtonModule, DxDataGridModule } from 'devextreme-angular';
import { ListaRolesComponent } from './lista-roles/lista-roles.component';
import { MaterialModule } from 'src/app/material.module';
import { AgregarRolComponent } from './agregar-rol/agregar-rol.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HasPermissionDirective } from 'src/app/core/haspermission.directive';

@NgModule({
  declarations: [ListaRolesComponent, AgregarRolComponent],
  imports: [
    CommonModule,
    RolesRoutingModule,
    MatIconModule,
    DxDataGridModule,
    DxButtonModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    HasPermissionDirective,
  ],
})
export class RolesModule {}
