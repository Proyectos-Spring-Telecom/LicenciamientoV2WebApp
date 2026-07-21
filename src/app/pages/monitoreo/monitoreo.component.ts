import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { LocalComercial } from '../local-comercial/models/local-comercial';
import { mostrarCargandoLocalComercial } from '../local-comercial/utils/local-comercial-swal.util';
import {
  createEmptyLocalEstatusFilterCounts,
  localMatchesEstatusFilter,
  MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT,
  MonitoreoLocalEstatusFilter,
  MonitoreoLocalEstatusFilterCounts,
  resolveLocalEstatusFilter,
} from './local-filter/monitoreo-local-estatus-filter.data';
import {
  createEmptyLocalPredioFilterCounts,
  esPredioEnObra,
  localMatchesPredioFilter,
  MONITOREO_LOCAL_PREDIO_FILTER_DEFAULT,
  MonitoreoLocalPredioFilter,
  MonitoreoLocalPredioFilterCounts,
} from './local-filter/monitoreo-local-predio-filter.data';
import { MapaComponent } from './mapa/mapa.component';

const BODY_MAPA_CLASS = 'monitoreo-mapa-active';
const LIST_SLIDE_MS = 280;
const DEFAULT_LOCAL_IMAGE = 'assets/default.png';

@Component({
  selector: 'app-monitoreo',
  templateUrl: './monitoreo.component.html',
  styleUrls: ['./monitoreo.component.scss'],
  standalone: false,
  animations: [
    trigger('cardAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.96)' }),
        animate('280ms {{ delay }}ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ], { params: { delay: 0 } }),
      transition(':leave', [
        animate('180ms ease-in',
          style({ opacity: 0, transform: 'translateY(-10px) scale(0.97)' })),
      ]),
    ]),
  ],
})
export class MonitoreoComponent implements OnInit, OnDestroy {
  @ViewChild(MapaComponent) private mapaComponent?: MapaComponent;

  public mensajeModulo = 'Monitoreo';
  listaLocales: LocalComercial[] = [];
  selectedLocalId: number | null = null;
  selectedEstatus: MonitoreoLocalEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;
  selectedPredio: MonitoreoLocalPredioFilter = MONITOREO_LOCAL_PREDIO_FILTER_DEFAULT;
  searchTerm = '';

  /** Lista visible (deslizada a su sitio). Empieza oculta fuera a la izquierda. */
  listOpen = false;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    document.body.classList.add(BODY_MAPA_CLASS);
  }

  ngOnDestroy(): void {
    document.body.classList.remove(BODY_MAPA_CLASS);
  }

  get localesFiltrados(): LocalComercial[] {
    const term = this.searchTerm.trim().toLowerCase();

    return (this.listaLocales || []).filter((local) => {
      if (!localMatchesEstatusFilter(local.nombreEstatus, this.selectedEstatus)) {
        return false;
      }
      if (!localMatchesPredioFilter(local.predioObra, this.selectedPredio)) {
        return false;
      }
      if (!term) {
        return true;
      }
      const nombre = String(local.nombreComercial ?? '').toLowerCase();
      const giro = String(local.giro ?? '').toLowerCase();
      const grupo = String(local.grupo ?? '').toLowerCase();
      const rfc = String(local.rfc ?? '').toLowerCase();
      return (
        nombre.includes(term) ||
        giro.includes(term) ||
        grupo.includes(term) ||
        rfc.includes(term)
      );
    });
  }

  get totalLocalesCount(): number {
    return (this.listaLocales || []).length;
  }

  /** Locales visibles según filtro de predio (para chip Todos de estatus). */
  get totalTrasFiltroPredio(): number {
    return (this.listaLocales || []).filter((local) =>
      localMatchesPredioFilter(local.predioObra, this.selectedPredio),
    ).length;
  }

  /** Locales visibles según filtro de estatus (para chip Todos de predio). */
  get totalTrasFiltroEstatus(): number {
    return (this.listaLocales || []).filter((local) =>
      localMatchesEstatusFilter(local.nombreEstatus, this.selectedEstatus),
    ).length;
  }

  get estatusFilterCounts(): MonitoreoLocalEstatusFilterCounts {
    const counts = createEmptyLocalEstatusFilterCounts();
    for (const local of this.listaLocales || []) {
      if (!localMatchesPredioFilter(local.predioObra, this.selectedPredio)) {
        continue;
      }
      const estatus = resolveLocalEstatusFilter(local.nombreEstatus);
      if (estatus) {
        counts[estatus] += 1;
      }
    }
    return counts;
  }

  get predioFilterCounts(): MonitoreoLocalPredioFilterCounts {
    const counts = createEmptyLocalPredioFilterCounts();
    for (const local of this.listaLocales || []) {
      if (!localMatchesEstatusFilter(local.nombreEstatus, this.selectedEstatus)) {
        continue;
      }
      if (esPredioEnObra(local.predioObra)) {
        counts['en-obra'] += 1;
      } else {
        counts['sin-obra'] += 1;
      }
    }
    return counts;
  }

  onLocalesReady(locales: LocalComercial[]): void {
    this.listaLocales = locales || [];
  }

  onEstatusFilterChange(estatus: MonitoreoLocalEstatusFilter): void {
    this.selectedEstatus = estatus;
    this.mapaComponent?.applyEstatusFilter(estatus);
  }

  onPredioFilterChange(predio: MonitoreoLocalPredioFilter): void {
    this.selectedPredio = predio;
    this.mapaComponent?.applyPredioFilter(predio);
  }

  esEnObra(local: LocalComercial): boolean {
    return esPredioEnObra(local.predioObra);
  }

  onMapLocalFocused(localId: number): void {
    this.selectedLocalId = localId;
    this.scrollFilaSeleccionada();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
  }

  seleccionarLocal(local: LocalComercial): void {
    this.selectedLocalId = local.id;
    this.mapaComponent?.focusLocal(local.id);
  }

  irADetalle(local: LocalComercial, event: Event): void {
    event.stopPropagation();
    const id = Number(local?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }
    mostrarCargandoLocalComercial('Obteniendo información del local comercial');
    this.router.navigate(['/local-comercial/detalle-local-comercial', id], {
      queryParams: { from: 'monitoreo' },
    });
  }

  /** Contrae/expande solo la lista; la card de filtros del mapa es independiente. */
  togglePanel(): void {
    this.listOpen = !this.listOpen;
    this.scheduleMapResize();
  }

  private scheduleMapResize(): void {
    requestAnimationFrame(() => {
      setTimeout(() => this.mapaComponent?.notifyMapResize(), LIST_SLIDE_MS);
    });
  }

  fotoLocal(local: LocalComercial): string {
    const ruta = local.urlLicencia;
    if (ruta == null) {
      return DEFAULT_LOCAL_IMAGE;
    }
    const trimmed = String(ruta).trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return DEFAULT_LOCAL_IMAGE;
    }
    return trimmed.replace(/\\/g, '/');
  }

  onFotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.endsWith(DEFAULT_LOCAL_IMAGE)) {
      img.src = DEFAULT_LOCAL_IMAGE;
    }
  }

  estatusTone(nombreEstatus: string | null | undefined): string {
    return resolveLocalEstatusFilter(nombreEstatus) ?? 'todo';
  }

  etiquetaEstatus(local: LocalComercial): string {
    const raw = String(local.nombreEstatus ?? '').trim();
    return raw || 'Sin estatus';
  }

  private scrollFilaSeleccionada(): void {
    requestAnimationFrame(() => {
      const el = document.getElementById(`monitor-local-row-${this.selectedLocalId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}
