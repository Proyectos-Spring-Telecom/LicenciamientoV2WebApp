import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import Swal from 'sweetalert2';
import { LocalComercial } from '../../local-comercial/models/local-comercial';
import {
  mostrarCargandoLocalComercial,
  ocultarCargandoLocalComercial,
} from '../../local-comercial/utils/local-comercial-swal.util';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { environment } from 'src/environments/environment';
import {
  localMatchesEstatusFilter,
  MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT,
  MonitoreoLocalEstatusFilter,
} from '../local-filter/monitoreo-local-estatus-filter.data';
import { MonitoreoService } from '../services/monitoreo.service';

const DEFAULT_IMAGE = 'assets/default.png';

const MARKER_ASPECT_RATIO = 739 / 1067;
const MARKER_DISPLAY_HEIGHT = 40;
const MARKER_DISPLAY_WIDTH = Math.round(MARKER_DISPLAY_HEIGHT * MARKER_ASPECT_RATIO);

const MARKER_ICONS: Record<string, string> = {
  'Datos Correctos': 'assets/images/logos/marker_success.png',
  Correcto: 'assets/images/logos/marker_success.png',
  Revisión: 'assets/images/logos/marker_primary.png',
  Revision: 'assets/images/logos/marker_primary.png',
  'Información Faltante': 'assets/images/logos/marker_warning.png',
  InformacionFaltante: 'assets/images/logos/marker_warning.png',
  Rechazo: 'assets/images/logos/marker_danger.png',
  'Rechazo o Sin respuesta': 'assets/images/logos/marker_danger.png',
  Baja: 'assets/images/logos/marker_down.png',
};

const MAP_STYLES_SIN_ESTABLECIMIENTOS: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

interface MapaMarkerEntry {
  local: LocalComercial;
  marker: google.maps.Marker;
}

const ICON_GROUP =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h10M4 17h6"/></svg>';
const ICON_GIRO =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>';
const ICON_RFC =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4M7 13h6"/></svg>';
const ICON_FOLIO =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
const ICON_USER =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  standalone: false,
})
export class MapaComponent implements OnInit, OnDestroy {
  @Output() localesReady = new EventEmitter<LocalComercial[]>();
  @Output() localFocused = new EventEmitter<number>();
  @Output() estatusFilterReset = new EventEmitter<MonitoreoLocalEstatusFilter>();

  public panorama: google.maps.StreetViewPanorama;
  public sv: google.maps.StreetViewService;
  public isAvailable = true;
  public listaLocales: LocalComercial[] = [];
  public loadingVisible = false;
  public mensajeModulo = 'Monitoreo';

  selectedEstatusFilter: MonitoreoLocalEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;

  private map: google.maps.Map;
  private activeMarkerIndex: number | null = null;
  private markerEntries: MapaMarkerEntry[] = [];
  private infoWindows: google.maps.InfoWindow[] = [];
  private markerClusterer: MarkerClusterer | null = null;
  private currentInfoWindow: google.maps.InfoWindow | null = null;

  constructor(
    public router: Router,
    private monitoreoService: MonitoreoService,
    private googleMapsLoader: GoogleMapsLoaderService,
  ) {}

  /** Aplica un filtro de estatus sobre los marcadores del mapa. */
  applyEstatusFilter(estatus: MonitoreoLocalEstatusFilter): void {
    this.selectedEstatusFilter = estatus;
    this.applyMarkerVisibility();
  }

  /** Centra el mapa en el local y abre su info window (sync con panel izquierdo). */
  focusLocal(localId: number): void {
    const index = this.markerEntries.findIndex((entry) => entry.local.id === localId);
    if (index < 0 || !this.map) {
      return;
    }

    const entry = this.markerEntries[index];
    const visible = this.getVisibleLocales().some((local) => local.id === localId);
    if (!visible) {
      this.selectedEstatusFilter = MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT;
      this.estatusFilterReset.emit(this.selectedEstatusFilter);
      this.applyMarkerVisibility();
    }

    this.map.panTo(entry.marker.getPosition() as google.maps.LatLng);
    const zoom = this.map.getZoom() ?? 13;
    if (zoom < 15) {
      this.map.setZoom(15);
    }

    const infowindow = this.infoWindows[index];
    if (infowindow) {
      if (this.currentInfoWindow && this.currentInfoWindow !== infowindow) {
        this.currentInfoWindow.close();
      }
      infowindow.open(this.map, entry.marker);
      this.currentInfoWindow = infowindow;
    }

    this.activeMarkerIndex = index;
    this.localFocused.emit(localId);
  }

  notifyMapResize(): void {
    if (!this.map) {
      return;
    }
    google.maps.event.trigger(this.map, 'resize');
  }

  private getVisibleLocales(): LocalComercial[] {
    return (this.listaLocales || []).filter((local) =>
      localMatchesEstatusFilter(local.nombreEstatus, this.selectedEstatusFilter),
    );
  }

  private applyMarkerVisibility(): void {
    if (!this.markerClusterer) {
      return;
    }

    const visibleIds = new Set(this.getVisibleLocales().map((local) => local.id));
    const visibleMarkers = this.markerEntries
      .filter((entry) => visibleIds.has(entry.local.id))
      .map((entry) => entry.marker);

    this.markerEntries.forEach((entry) => {
      if (!visibleIds.has(entry.local.id)) {
        entry.marker.setMap(null);
      }
    });

    this.markerClusterer.clearMarkers();
    this.markerClusterer.addMarkers(visibleMarkers);
  }

  ngOnInit(): void {
    this.obtenerListaLocalesComerciales();
  }

  ngOnDestroy(): void {}

  private resolveFotoRuta(ruta: string | null | undefined): string {
    if (ruta == null || ruta === undefined) {
      return DEFAULT_IMAGE;
    }
    const trimmed = String(ruta).trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return DEFAULT_IMAGE;
    }
    const normalized = decodeURIComponent(trimmed).replace(/\\/g, '/').toLowerCase();
    if (normalized.includes('default.png')) {
      return DEFAULT_IMAGE;
    }
    return trimmed.replace(/\\/g, '/');
  }

  private tieneValor(valor: unknown): boolean {
    return (
      valor !== null &&
      valor !== undefined &&
      String(valor).trim() !== '' &&
      String(valor).trim().toLowerCase() !== 'null'
    );
  }

  private textoTooltip(valor: unknown): string {
    return this.tieneValor(valor) ? String(valor).trim() : 'Sin información';
  }

  /** Grupo en mapa: una sola letra A–G. */
  private formatoGrupo(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return 'Sin información';
    }
    const raw = String(valor).trim();
    if (/^[A-Ga-g]$/.test(raw)) {
      return raw.toUpperCase();
    }
    const match = raw.match(/[A-Ga-g]/);
    return match ? match[0].toUpperCase() : raw.charAt(0).toUpperCase();
  }

  private escapeHtml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private getEstatusColor(nombreEstatus: string): string {
    const colores: Record<string, string> = {
      'Información Faltante': '#f9c300',
      InformacionFaltante: '#f9c300',
      Revisión: '#438AE3',
      Revision: '#438AE3',
      'Rechazo o Sin respuesta': '#eb1919',
      Rechazo: '#eb1919',
      'Datos Correctos': '#52bb56',
      Correcto: '#52bb56',
    };
    return colores[nombreEstatus] || '#8b1a3d';
  }

  private buildRow(
    icon: string,
    label: string,
    value: string,
    campo: unknown,
    wide = false,
    compact = false,
  ): string {
    const vacio = !this.tieneValor(campo);
    const wideClass = wide ? ' mon-veh-tooltip__row--wide' : '';
    const compactClass = compact ? ' mon-veh-tooltip__row--compact' : '';
    const valueClass = vacio ? ' mon-veh-tooltip__row-value--vacio' : '';

    if (compact) {
      return (
        '' +
        `<div class="mon-veh-tooltip__row${compactClass}">` +
        '<div class="mon-veh-tooltip__row-head">' +
        `<span class="mon-veh-tooltip__row-icon" aria-hidden="true">${icon}</span>` +
        `<span class="mon-veh-tooltip__row-label">${label}</span>` +
        '</div>' +
        `<span class="mon-veh-tooltip__row-value${valueClass}">${value}</span>` +
        '</div>'
      );
    }

    return (
      '' +
      `<div class="mon-veh-tooltip__row${wideClass}">` +
      `<span class="mon-veh-tooltip__row-icon" aria-hidden="true">${icon}</span>` +
      '<p class="mon-veh-tooltip__row-copy">' +
      `<span class="mon-veh-tooltip__row-label">${label}</span>` +
      `<span class="mon-veh-tooltip__row-value${valueClass}">${value}</span>` +
      '</p></div>'
    );
  }

  private buildInfoWindowContent(local: LocalComercial, index: number): string {
    const urlImagen = this.escapeHtml(this.resolveFotoRuta(local.urlLicencia));
    const nombreComercial = this.escapeHtml(this.textoTooltip(local.nombreComercial));
    const nombreEstatus = this.escapeHtml(this.textoTooltip(local.nombreEstatus));
    const grupo = this.escapeHtml(
      this.tieneValor(local.grupo) ? this.formatoGrupo(local.grupo) : 'Sin información',
    );
    const giro = this.escapeHtml(this.textoTooltip(local.giro));
    const rfc = this.escapeHtml(this.textoTooltip(local.rfc));
    const capturista = this.escapeHtml(this.textoTooltip(local.nombreCapturista));
    const folio = this.escapeHtml(this.tieneValor(local.id) ? String(local.id) : 'Sin información');
    const estatusColor = this.getEstatusColor(local.nombreEstatus);

    return (
      '' +
      `<article id="tooltip-${index}" class="mon-veh-tooltip mon-veh-tooltip--infowindow" role="dialog" aria-label="Detalle del local comercial">` +
      '<button type="button" class="mon-veh-tooltip__close" id="close-btn-' +
      index +
      '" aria-label="Cerrar detalle">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>' +
      '</svg></button>' +
      '<div class="mon-veh-tooltip__glow" aria-hidden="true"></div>' +
      '<header class="mon-veh-tooltip__head mon-veh-tooltip__head--center">' +
      `<span class="mon-veh-tooltip__head-label" style="background-color:${estatusColor}">${nombreEstatus}</span>` +
      `<h3 class="mon-veh-tooltip__head-title">${nombreComercial}</h3>` +
      '</header>' +
      `<div class="mon-veh-tooltip__photo"><img src="${urlImagen}" alt="Licencia" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'" /></div>` +
      '<div class="mon-veh-tooltip__divider" aria-hidden="true"></div>' +
      '<div class="mon-veh-tooltip__body">' +
      '<div class="mon-veh-tooltip__row-trio">' +
      this.buildRow(ICON_GROUP, 'Grupo:', grupo, local.grupo, false, true) +
      this.buildRow(ICON_RFC, 'RFC:', rfc, local.rfc, false, true) +
      this.buildRow(ICON_FOLIO, 'Folio:', folio, local.id, false, true) +
      '</div>' +
      this.buildRow(ICON_GIRO, 'Giro:', giro, local.giro, true) +
      this.buildRow(ICON_USER, 'Capturista:', capturista, local.nombreCapturista, true) +
      '</div>' +
      '<div class="mon-veh-tooltip__actions">' +
      `<button type="button" class="mon-veh-tooltip__btn mon-veh-tooltip__btn--info" id="info-btn-${index}"><i class="fa fa-file-o"></i> Información</button>` +
      `<button type="button" class="mon-veh-tooltip__btn mon-veh-tooltip__btn--street" id="street-btn-${index}"><i class="fa fa-street-view"></i> Street View</button>` +
      '</div>' +
      '</article>'
    );
  }

  private getMarkerIcon(nombreEstatus: string): google.maps.Icon {
    const url = MARKER_ICONS[nombreEstatus] || 'assets/images/logos/marker_spring.webp';
    return {
      url,
      scaledSize: new google.maps.Size(MARKER_DISPLAY_WIDTH, MARKER_DISPLAY_HEIGHT),
      anchor: new google.maps.Point(MARKER_DISPLAY_WIDTH / 2, MARKER_DISPLAY_HEIGHT),
    };
  }

  private setStreetModalVisible(visible: boolean): void {
    const overlay = document.getElementById('street-modal-overlay');
    if (!overlay) {
      return;
    }
    overlay.style.visibility = visible ? 'visible' : 'hidden';
    overlay.classList.toggle('monitoreo-street-modal--visible', visible);
    if (!visible && this.panorama) {
      this.panorama.setVisible(false);
    }
  }

  private tieneCoordenadasValidas(lat: unknown, lng: unknown): boolean {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return Number.isFinite(latNum) && Number.isFinite(lngNum) && latNum !== 0 && lngNum !== 0;
  }

  private centerStreetModalPanel(): void {
    const panel = document.getElementById('street-modal-panel');
    if (!panel) {
      return;
    }
    const width = Math.min(720, window.innerWidth - 32);
    const height = Math.min(420, window.innerHeight - 180);
    panel.style.left = `${Math.max(16, (window.innerWidth - width) / 2)}px`;
    panel.style.top = `${Math.max(16, (window.innerHeight - height) / 2)}px`;
  }

  private initStreetViewPanorama(): void {
    const panoEl = document.getElementById('pano');
    if (!panoEl || this.panorama) {
      return;
    }
    this.sv = new google.maps.StreetViewService();
    this.panorama = new google.maps.StreetViewPanorama(panoEl, {
      visible: false,
      addressControl: false,
      linksControl: true,
      panControl: true,
      enableCloseButton: false,
    });
  }

  openStreetViewForLocal(local: LocalComercial): void {
    if (!this.tieneCoordenadasValidas(local.lat, local.lng)) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin ubicación',
        text: 'Este local no tiene coordenadas para mostrar Street View.',
      });
      return;
    }

    this.initStreetViewPanorama();

    const lat = Number(local.lat);
    const lng = Number(local.lng);

    this.sv.getPanorama({ location: { lat, lng }, radius: 100 }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
        this.panorama.setPano(data.location.pano);
        if (data.location.latLng) {
          this.panorama.setPosition(data.location.latLng);
        }
        this.panorama.setPov({ heading: 270, pitch: 0 });
        this.panorama.setVisible(true);
        this.isAvailable = true;
        this.centerStreetModalPanel();
        this.setStreetModalVisible(true);
        return;
      }

      this.setStreetModalVisible(false);
      Swal.fire({
        icon: 'info',
        title: 'Street View no disponible',
        text: 'No hay cobertura de Street View en la ubicación de este local.',
      });
    });
  }

  obtenerListaLocalesComerciales(): void {
    mostrarCargandoLocalComercial('Obteniendo información de los locales comerciales');

    this.monitoreoService.obtenerLocalesMapa().subscribe({
      next: (response) => {
        this.listaLocales = response || [];
        this.localesReady.emit(this.listaLocales);
        this.inicializarMapa();
      },
      error: () => {
        ocultarCargandoLocalComercial();
        this.listaLocales = [];
        this.localesReady.emit(this.listaLocales);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los locales para el mapa.',
        });
      },
    });
  }

  private inicializarMapa(): void {
    this.googleMapsLoader
      .load(environment.googleMapsApiKey)
      .then(() => {
        const mapEl = document.getElementById('map');
        if (!mapEl) {
          ocultarCargandoLocalComercial();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el contenedor del mapa.',
          });
          return;
        }

        const fenway = { lat: 18.92506594438654, lng: -99.22440748392435 };
        const map = new google.maps.Map(mapEl, {
          center: fenway,
          zoom: 13,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: MAP_STYLES_SIN_ESTABLECIMIENTOS,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE],
          },
        });
        this.map = map;
        this.currentInfoWindow = null;
        this.infoWindows = [];
        this.markerEntries = [];
        this.markerClusterer = null;

        let pinnedIndex: number | null = null;
        let closeTimer: ReturnType<typeof setTimeout> | null = null;
        let hoveringInfoWindow = false;

        const clearCloseTimer = (): void => {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
        };

        const markers = (this.listaLocales || [])
          .filter((local) => local.lat != null && local.lng != null)
          .map((local, i) => {
            const contentString = this.buildInfoWindowContent(local, i);
            const marker = new google.maps.Marker({
              position: { lat: local.lat, lng: local.lng },
              icon: this.getMarkerIcon(local.nombreEstatus),
              animation: google.maps.Animation.DROP,
            });
            const infowindow = new google.maps.InfoWindow({ content: contentString });
            this.infoWindows[i] = infowindow;
            this.markerEntries.push({ local, marker });

            const openInfoWindow = (): void => {
              clearCloseTimer();
              if (this.currentInfoWindow != null && this.currentInfoWindow !== infowindow) {
                this.currentInfoWindow.close();
              }
              infowindow.open(map, marker);
              this.currentInfoWindow = infowindow;
              this.setStreetModalVisible(false);
            };

            const closeInfoWindow = (): void => {
              clearCloseTimer();
              if (this.currentInfoWindow) {
                this.currentInfoWindow.close();
                this.currentInfoWindow = null;
              }
            };

            const scheduleClose = (fromIndex: number): void => {
              clearCloseTimer();
              closeTimer = setTimeout(() => {
                if (hoveringInfoWindow) {
                  return;
                }
                if (pinnedIndex !== null) {
                  if (fromIndex === pinnedIndex) {
                    return;
                  }
                  const pinnedInfoWindow = this.infoWindows[pinnedIndex];
                  const pinnedMarker = this.markerEntries[pinnedIndex]?.marker;
                  if (pinnedInfoWindow && pinnedMarker) {
                    if (this.currentInfoWindow && this.currentInfoWindow !== pinnedInfoWindow) {
                      this.currentInfoWindow.close();
                    }
                    pinnedInfoWindow.open(map, pinnedMarker);
                    this.currentInfoWindow = pinnedInfoWindow;
                  }
                  return;
                }
                closeInfoWindow();
              }, 180);
            };

            google.maps.event.addListener(infowindow, 'domready', () => {
              const streetViewBtn = document.getElementById('street-btn-' + i);
              const infoBtn = document.getElementById('info-btn-' + i);
              const closeBtn = document.getElementById('close-btn-' + i);
              const tooltipEl = document.getElementById('tooltip-' + i);

              if (streetViewBtn) {
                streetViewBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  streetViewBtn.blur();
                  this.activeMarkerIndex = i;
                  this.openStreetViewForLocal(local);
                });
              }
              if (infoBtn) {
                infoBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  infoBtn.blur();
                  const id = Number(local?.id);
                  if (!Number.isFinite(id) || id <= 0) {
                    return;
                  }
                  mostrarCargandoLocalComercial('Obteniendo información del local comercial');
                  this.router.navigateByUrl('/local-comercial/detalle-local-comercial/' + id);
                });
              }
              if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pinnedIndex = null;
                  hoveringInfoWindow = false;
                  closeInfoWindow();
                });
              }
              if (tooltipEl) {
                tooltipEl.addEventListener('mouseenter', () => {
                  hoveringInfoWindow = true;
                  clearCloseTimer();
                });
                tooltipEl.addEventListener('mouseleave', () => {
                  hoveringInfoWindow = false;
                  scheduleClose(i);
                });
              }
            });

            google.maps.event.addListener(marker, 'mouseover', () => {
              openInfoWindow();
            });

            google.maps.event.addListener(marker, 'mouseout', () => {
              scheduleClose(i);
            });

            google.maps.event.addListener(marker, 'click', () => {
              pinnedIndex = i;
              this.activeMarkerIndex = i;
              this.isAvailable = true;
              openInfoWindow();
              this.localFocused.emit(local.id);
            });

            return marker;
          });

        google.maps.event.addListener(map, 'click', () => {
          pinnedIndex = null;
          hoveringInfoWindow = false;
          clearCloseTimer();
          if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
            this.currentInfoWindow = null;
          }
          this.setStreetModalVisible(false);
        });

        const panel = document.getElementById('street-modal-panel');
        const header = document.getElementById('street-modal-panelheader');
        if (panel && header) {
          this.initDragElement(panel, header);
        }
        this.initStreetViewPanorama();
        this.markerClusterer = new MarkerClusterer({ markers, map });
        this.applyMarkerVisibility();
        ocultarCargandoLocalComercial();
      })
      .catch((err) => {
        console.error('Error al cargar Google Maps:', err);
        ocultarCargandoLocalComercial();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el mapa de monitoreo.',
        });
      });
  }

  hideStreetView(): void {
    this.setStreetModalVisible(false);
  }

  private initDragElement(panel: HTMLElement, header: HTMLElement): void {
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      panel.classList.remove('monitoreo-street-modal__panel--dragging');
    };

    const elementDrag = (e: MouseEvent) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      panel.style.top = `${panel.offsetTop - pos2}px`;
      panel.style.left = `${panel.offsetLeft - pos1}px`;
    };

    const dragMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.monitoreo-street-modal__close')) {
        return;
      }
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      panel.classList.add('monitoreo-street-modal__panel--dragging');
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    header.onmousedown = dragMouseDown;
  }
}
