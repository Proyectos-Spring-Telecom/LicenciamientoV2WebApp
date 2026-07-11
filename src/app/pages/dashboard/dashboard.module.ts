import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import {
  DxChartModule,
  DxPieChartModule,
  DxDataGridModule,
  DxLoadPanelModule,
  DxTemplateModule,
} from 'devextreme-angular';
import { MaterialModule } from 'src/app/material.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { QuickInfoWidgetComponent } from './widgets/quick-info-widget/quick-info-widget.component';

@NgModule({
  declarations: [DashboardComponent, QuickInfoWidgetComponent],
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    MaterialModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    DxChartModule,
    DxPieChartModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxTemplateModule,
  ],
  providers: [DatePipe],
})
export class DashboardModule {}
