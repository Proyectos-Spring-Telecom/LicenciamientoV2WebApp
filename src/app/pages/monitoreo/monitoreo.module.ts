import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MonitoreoRoutingModule } from './monitoreo-routing.module';
import { MonitoreoComponent } from './monitoreo.component';
import { MapaComponent } from './mapa/mapa.component';
import { MonitoreoLocalFilterComponent } from './local-filter/monitoreo-local-filter.component';

@NgModule({
  declarations: [MonitoreoComponent, MapaComponent],
  imports: [
    CommonModule,
    FormsModule,
    TablerIconsModule,
    MonitoreoRoutingModule,
    MonitoreoLocalFilterComponent,
  ],
})
export class MonitoreoModule {}
