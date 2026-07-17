import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DxTemplateModule,
  DxButtonModule,
  DxDataGridModule,
  DxCheckBoxModule,
  DxSelectBoxModule,
  DxLoadPanelModule,
  DxTextAreaModule,
  DxTextBoxModule,
  DxDateBoxModule,
  DxValidatorModule,
  DxValidationGroupModule,
  DxLoadIndicatorModule,
} from 'devextreme-angular';
import { MaterialModule } from 'src/app/material.module';
import { HasPermissionDirective } from 'src/app/core/haspermission.directive';
import { LocalComercialRoutingModule } from './local-comercial-routing.module';
import { ListaLocalComercialComponent } from './components/lista/lista-local-comercial.component';
import { LocalComercialFormularioComponent } from './components/formulario/local-comercial-formulario.component';
import { DetalleLocalComercialComponent } from './components/detalle-local-comercial/detalle-local-comercial.component';
import { GaleriaComponent } from './components/detalle-local-comercial/Galeria/galeria.component';
import { SeleccionUbicacionModalComponent } from './components/formulario/seleccion-ubicacion-modal/seleccion-ubicacion-modal.component';
import { SubirDocumentoModalComponent } from './components/formulario/subir-documento-modal/subir-documento-modal.component';
import { FileUploaderCardComponent } from './components/shared/file-uploader-card/file-uploader-card.component';
import { BotonExportarTablaComponent } from './components/shared/boton-exportar-tabla/boton-exportar-tabla.component';
import { LocalPermFieldComponent } from './components/shared/local-perm-field/local-perm-field.component';
import { PreRegistroLocalComponent } from './components/pre-registro/pre-registro-local.component';

@NgModule({
  declarations: [
    ListaLocalComercialComponent,
    LocalComercialFormularioComponent,
    DetalleLocalComercialComponent,
    GaleriaComponent,
    SeleccionUbicacionModalComponent,
    SubirDocumentoModalComponent,
    FileUploaderCardComponent,
    BotonExportarTablaComponent,
    LocalPermFieldComponent,
    PreRegistroLocalComponent,
  ],
  imports: [
    CommonModule,
    LocalComercialRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressBarModule,
    MatStepperModule,
    MatTooltipModule,
    HasPermissionDirective,
    DxTemplateModule,
    DxButtonModule,
    DxDataGridModule,
    DxCheckBoxModule,
    DxSelectBoxModule,
    DxLoadPanelModule,
    DxTextAreaModule,
    DxTextBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxValidationGroupModule,
    DxLoadIndicatorModule,
  ],
  providers: [DatePipe],
})
export class LocalComercialModule {}
