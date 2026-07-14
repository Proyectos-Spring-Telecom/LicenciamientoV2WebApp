import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LocalComercial } from '../local-comercial/models/local-comercial';
import {
  localMatchesEstatusFilter,
  MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT,
  MonitoreoLocalEstatusFilter,
  resolveLocalEstatusFilter,
} from './local-filter/monitoreo-local-estatus-filter.data';
import { MapaComponent } from './mapa/mapa.component';

const BODY_MAPA_CLASS = 'monitoreo-mapa-active';
const LIST_SLIDE_MS = 280;
const FILTER_AFTER_LIST_MS = 40;

@Component({
  selector: 'app-monitoreo',
  templateUrl: './monitoreo.component.html',
  styleUrls: ['./monitoreo.component.scss'],
  standalone: false,
})
export class MonitoreoComponent implements OnInit, OnDestroy {
  @ViewChild(MapaComponent) private mapaComponent?: MapaComponent;

  public mensajeModulo = 'Monitoreo';
  listaLocales: LocalComercial[] = [];
  selectedLocalId: number | null = null;
  selectedEstatus: MonitoreoLocalEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;
  searchTerm = '';

  /** Lista visible (deslizada a su sitio). Empieza oculta fuera a la izquierda. */
  listOpen = false;
  private panelAnimToken = 0;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    document.body.classList.add(BODY_MAPA_CLASS);
  }

  ngOnDestroy(): void {
    this.panelAnimToken += 1;
    document.body.classList.remove(BODY_MAPA_CLASS);
  }

  get localesFiltrados(): LocalComercial[] {
    const term = this.searchTerm.trim().toLowerCase();

    return (this.listaLocales || []).filter((local) => {
      if (!localMatchesEstatusFilter(local.nombreEstatus, this.selectedEstatus)) {
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

  onLocalesReady(locales: LocalComercial[]): void {
    this.listaLocales = locales || [];
  }

  onEstatusFilterChange(estatus: MonitoreoLocalEstatusFilter): void {
    this.selectedEstatus = estatus;
  }

  onMapLocalFocused(localId: number): void {
    this.selectedLocalId = localId;
    this.scrollFilaSeleccionada();
  }

  onShowLocalesRequest(): void {
    void this.showSequentially();
  }

  onHideLocalesRequest(): void {
    void this.hideSequentially();
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
    this.router.navigateByUrl('/local-comercial/detalle-local-comercial');
  }

  togglePanel(): void {
    if (!this.listOpen) {
      this.mapaComponent?.syncLocalesPanelVisible(true);
      void this.showSequentially();
      return;
    }
    void this.hideSequentially();
  }

  private async showSequentially(): Promise<void> {
    const token = ++this.panelAnimToken;
    this.listOpen = true;
    this.scheduleMapResize();
  }

  /** Ocultar: la lista se desliza a la izquierda; luego se colapsa la card. */
  private async hideSequentially(): Promise<void> {
    const token = ++this.panelAnimToken;

    if (this.listOpen) {
      this.listOpen = false;
      this.scheduleMapResize();
      await this.delay(LIST_SLIDE_MS);
      if (token !== this.panelAnimToken) {
        return;
      }
    }

    await this.delay(FILTER_AFTER_LIST_MS);
    if (token !== this.panelAnimToken) {
      return;
    }

    this.mapaComponent?.syncLocalesPanelVisible(false);
  }

  private scheduleMapResize(): void {
    requestAnimationFrame(() => {
      setTimeout(() => this.mapaComponent?.notifyMapResize(), LIST_SLIDE_MS);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
