import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoreoRoutingModule } from './monitoreo-routing.module';
import { MonitoreoComponent } from './monitoreo.component';
import { MapaComponent } from './mapa/mapa.component';

@NgModule({
  declarations: [MonitoreoComponent, MapaComponent],
  imports: [CommonModule, MonitoreoRoutingModule],
})
export class MonitoreoModule {}
