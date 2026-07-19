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
  MONITOREO_LOCAL_PREDIO_FILTER_DEFAULT,
  MONITOREO_LOCAL_PREDIO_FILTER_OPTIONS,
  MonitoreoLocalPredioFilter,
  MonitoreoLocalPredioFilterCounts,
} from './monitoreo-local-predio-filter.data';
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
  /** Total para chip "Todos" de estatus (respeta filtro de predio). */
  @Input() totalCount = 0;
  /** Total para chip "Todos" de predio (respeta filtro de estatus). */
  @Input() predioTotalCount = 0;
  @Input() selectedEstatus: MonitoreoLocalEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;
  @Input() estatusCounts: MonitoreoLocalEstatusFilterCounts = {
    pendiente: 0,
    'info-faltante': 0,
    rechazo: 0,
    'datos-correctos': 0,
    baja: 0,
  };
  @Input() selectedPredio: MonitoreoLocalPredioFilter = MONITOREO_LOCAL_PREDIO_FILTER_DEFAULT;
  @Input() predioCounts: MonitoreoLocalPredioFilterCounts = {
    'en-obra': 0,
    'sin-obra': 0,
  };

  @Output() selectedEstatusChange = new EventEmitter<MonitoreoLocalEstatusFilter>();
  @Output() estatusChange = new EventEmitter<MonitoreoLocalEstatusFilter>();
  @Output() selectedPredioChange = new EventEmitter<MonitoreoLocalPredioFilter>();
  @Output() predioChange = new EventEmitter<MonitoreoLocalPredioFilter>();

  readonly estatusOptions = MONITOREO_LOCAL_ESTATUS_FILTER_OPTIONS;
  readonly predioOptions = MONITOREO_LOCAL_PREDIO_FILTER_OPTIONS;

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

  selectPredio(predio: MonitoreoLocalPredioFilter): void {
    if (predio === this.selectedPredio) {
      return;
    }

    this.playTransition();
    this.selectedPredioChange.emit(predio);
    this.predioChange.emit(predio);
  }

  estatusChipCount(optionId: MonitoreoLocalEstatusFilter): number {
    if (optionId === 'todo') {
      return this.totalCount;
    }
    return this.estatusCounts[optionId];
  }

  predioChipCount(optionId: MonitoreoLocalPredioFilter): number {
    if (optionId === 'todo') {
      return this.predioTotalCount || this.totalCount;
    }
    return this.predioCounts[optionId];
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
