import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import {
  MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT,
  MONITOREO_LOCAL_ESTATUS_FILTER_OPTIONS,
  MonitoreoLocalEstatusFilter,
  MonitoreoLocalEstatusFilterCounts,
} from './monitoreo-local-estatus-filter.data';
import {
  monLocFilterReopenAnim,
  monLocFilterShellAnim,
} from './monitoreo-local-filter.anim';

@Component({
  selector: 'app-monitoreo-local-filter',
  standalone: true,
  imports: [CommonModule, TablerIconsModule],
  templateUrl: './monitoreo-local-filter.component.html',
  styleUrl: './monitoreo-local-filter.component.scss',
  animations: [monLocFilterReopenAnim, monLocFilterShellAnim],
})
export class MonitoreoLocalFilterComponent {
  @Input() totalCount = 0;
  @Input() selectedEstatus: MonitoreoLocalEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;
  @Input() estatusCounts: MonitoreoLocalEstatusFilterCounts = {
    pendiente: 0,
    'info-faltante': 0,
    rechazo: 0,
    'datos-correctos': 0,
  };

  @Output() selectedEstatusChange = new EventEmitter<MonitoreoLocalEstatusFilter>();
  @Output() estatusChange = new EventEmitter<MonitoreoLocalEstatusFilter>();

  readonly estatusOptions = MONITOREO_LOCAL_ESTATUS_FILTER_OPTIONS;

  collapsed = true;
  pulseActive = false;

  private pulseTimer?: number;

  @HostBinding('class.mon-loc-filter-host--collapsed')
  get hostCollapsedClass(): boolean {
    return this.collapsed;
  }

  /** Contrae/expande solo esta card; la lista de locales es independiente. */
  collapse(): void {
    this.collapsed = true;
  }

  expand(): void {
    this.collapsed = false;
  }

  selectEstatus(estatus: MonitoreoLocalEstatusFilter): void {
    if (estatus === this.selectedEstatus) {
      return;
    }

    this.playTransition();
    this.selectedEstatusChange.emit(estatus);
    this.estatusChange.emit(estatus);
  }

  estatusChipCount(optionId: MonitoreoLocalEstatusFilter): number {
    if (optionId === 'todo') {
      return this.totalCount;
    }
    return this.estatusCounts[optionId];
  }

  private playTransition(): void {
    this.pulseActive = false;

    if (this.pulseTimer != null) {
      window.clearTimeout(this.pulseTimer);
    }

    requestAnimationFrame(() => {
      this.pulseActive = true;
      this.pulseTimer = window.setTimeout(() => {
        this.pulseActive = false;
        this.pulseTimer = undefined;
      }, 680);
    });
  }
}
