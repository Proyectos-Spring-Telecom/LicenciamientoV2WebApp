// @ts-nocheck
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { Router, ActivatedRoute } from '@angular/router';
import { LocalComercialService } from './../../services/local-comercial.service';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DetalleLocal,
  DocumentoDetalleItem,
  LicenciaConstruccionDetalle,
  direccion,
  direccionSapac,
  contacto,
  representante,
  proteccionCivil,
} from '../../models/detalle-local-comercial';
// import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { User } from 'src/app/entities/User';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import StreetViewService = google.maps.StreetViewService;
import StreetViewPanorama = google.maps.StreetViewPanorama;
import StreetViewPanoramaData = google.maps.StreetViewPanoramaData;
import StreetViewStatus = google.maps.StreetViewStatus;
import { FormGenerico } from '../../models/form-generico';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { environment } from 'src/environments/environment';
import { LicenciamientoPermiso } from 'src/app/entities/licenciamiento-permiso.const';
import { galeriaMetaAnimation, galeriaPhotoAnimation } from '../../animations/detalle-galeria.animation';
import { mapRegistroToDetalleLocal, unwrapRegistroResponse } from '../../utils/map-registro-api.util';

var currentInfoWindow = null;
let map: google.maps.Map;

const MARKER_ASPECT_RATIO = 739 / 1067;
const MARKER_DISPLAY_HEIGHT = 68;
const MARKER_DISPLAY_WIDTH = Math.round(MARKER_DISPLAY_HEIGHT * MARKER_ASPECT_RATIO);

const MARKER_ICONS: Record<string, string> = {
  'Datos Correctos': 'assets/images/logos/marker_success.png',
  Correcto: 'assets/images/logos/marker_success.png',
  'Revisión': 'assets/images/logos/marker_primary.png',
  Revision: 'assets/images/logos/marker_primary.png',
  'Información Faltante': 'assets/images/logos/marker_warning.png',
  InformacionFaltante: 'assets/images/logos/marker_warning.png',
  Rechazo: 'assets/images/logos/marker_danger.png',
  'Rechazo o Sin respuesta': 'assets/images/logos/marker_danger.png',
  Baja: 'assets/images/logos/marker_danger.png',
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

const ICON_GIRO =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>';
const ICON_USER =
  '<svg class="mon-veh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';

@Component({
  selector: 'app-detalle-local-comercial',
  templateUrl: './detalle-local-comercial.component.html',
  styleUrls: ['./detalle-local-comercial.component.css'],
  animations: [routeAnimation, galeriaPhotoAnimation, galeriaMetaAnimation],
  standalone: false,
})
export class DetalleLocalComercialComponent implements OnInit, OnDestroy {
  @ViewChild('myImage', { static: true }) image: ElementRef;
  customMarkerUrl: string;
  mapMarkerUrl: string;
  private mapaInitToken = 0;
  private mapaDetalle: google.maps.Map | null = null;
  private mapaMarker: google.maps.Marker | null = null;
  private mapaInfoWindow: google.maps.InfoWindow | null = null;
  private mapaHostEl: HTMLElement | null = null;
  private streetHostEl: HTMLElement | null = null;
  private detalleSub: Subscription | null = null;
  private routeSub: Subscription | null = null;


  public detalle: User;
  private _gap = 16;
  gap = `${this._gap}px`;
  col2 = `1 1 calc(50% - ${this._gap / 2}px)`;
  col3 = `1 1 calc(33.3333% - ${this._gap / 1.5}px)`;
  public panorama: StreetViewPanorama;
  public sv: StreetViewService;
  public isStreetView: boolean = true;
  public titulo: string = 'Licenciamiento';
  public isAvailable: boolean = true;
  public isAvailableIMG: boolean = true;
  public ocultaBtns:boolean = false;
  public showImage: boolean = false;
  public datos: DetalleLocal;
  public mensajeModulo: string = 'Detalle Local Comercial';
  public datosCargados = false;
  public tieneUbicacionMapa = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupara por esa columna';
  public isDisabled: boolean = true;
  public imagenCarrusel = 'assets/default.png';
  public imagenCarruselLc = 'assets/default.png';
  public loading: boolean = false;
  public informacion: DetalleLocal;
  public imei: string;
  public id: number;
  public galeria: any;
  public nombre: string = 'Dato';
  public i: number = 0;
  public iLc: number = 0;
  public galeriaDireccion: 'init' | 'next' | 'prev' = 'init';
  public galeriaDireccionLc: 'init' | 'next' | 'prev' = 'init';
  public ocultaBtnsLc = false;
  public interval = null;
  public loadingMessage: string = 'Cargando...';
	loadingVisible = false;


  public coloniaRegistros: FormGenerico[];
  public coloniaRegistrosSapac: FormGenerico[];
  public calleRegistros: FormGenerico[];
  public calleRegistrosSapac: FormGenerico[];
  public localidadRegistros: FormGenerico[];
  public localidadRegistrosSapac : FormGenerico[];

  public coloniaNombreComercial;
  public coloniaSapac;
  public calleNombreComercial;
  public calleSapac;
  public localidadNombreComercial;
  public localidadSapac;
  public imgValidate = 'assets/default.png';
  public readonly defaultImage = 'assets/default.png';

  resolveFotoRuta(ruta: string | null | undefined): string {
    if (!ruta || !ruta.trim()) {
      return this.defaultImage;
    }

    const normalized = decodeURIComponent(ruta).toLowerCase();

    if (normalized.includes('default.png')) {
      return this.defaultImage;
    }

    return ruta;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.defaultImage;
    }
  }

  private crearInformacionVacia(): DetalleLocal {
    return {
      direccion: {} as direccion,
      direccionSapac: {} as direccionSapac,
      contacto: {} as contacto,
      representante: {} as representante,
      proteccionCivil: { esEmpresa: false, tienePrograma: false } as proteccionCivil,
      fotos: [],
      predioObra: 0,
      licenciaConstruccion: null,
      documentosLicenciaConstruccion: [],
      NombreProteccionCivil: null,
      ApellidoPaternoProteccionCivil: null,
      ApellidoMaternoProteccionCivil: null,
      TelefonoProteccionCivil: null,
      RegistroAcreditacion: null,
      TienePrograma: false,
      VistoBueno: null,
    } as DetalleLocal;
  }

  private normalizarInformacion(res: Partial<DetalleLocal> | null | undefined): DetalleLocal {
    const base = this.crearInformacionVacia();
    if (!res) {
      return base;
    }
    return {
      ...base,
      ...res,
      direccion: { ...base.direccion, ...(res.direccion || {}) },
      direccionSapac: { ...base.direccionSapac, ...(res.direccionSapac || {}) },
      contacto: { ...base.contacto, ...(res.contacto || {}) },
      representante: { ...base.representante, ...(res.representante || {}) },
      proteccionCivil: { ...base.proteccionCivil, ...(res.proteccionCivil || {}) },
      fotos: Array.isArray(res.fotos) ? res.fotos : [],
      predioObra: Number(res.predioObra) === 1 ? 1 : 0,
      licenciaConstruccion: res.licenciaConstruccion ?? null,
      documentosLicenciaConstruccion: Array.isArray(res.documentosLicenciaConstruccion)
        ? res.documentosLicenciaConstruccion
        : [],
    };
  }

  get esPredioEnObra(): boolean {
    return Number(this.informacion?.predioObra) === 1;
  }

  get licenciaConstruccion(): LicenciaConstruccionDetalle | null {
    return this.informacion?.licenciaConstruccion ?? null;
  }

  get documentosLc(): DocumentoDetalleItem[] {
    return this.informacion?.documentosLicenciaConstruccion ?? [];
  }

  get etiquetaTituloDetalle(): string {
    return this.esPredioEnObra ? 'Propietario:' : 'Nombre Comercial:';
  }

  get tituloDetallePrincipal(): string {
    if (this.esPredioEnObra) {
      const propietario = this.licenciaConstruccion?.NombrePropietario?.trim();
      if (propietario) {
        return propietario;
      }
    }
    return (this.nombreComercial || this.informacion?.nombreComercial || '').trim();
  }

  get tipoSolicitudLcTexto(): string {
    const tipo = Number(this.licenciaConstruccion?.TipoSolicitudLicencia);
    const map: Record<number, string> = {
      1: 'Obra nueva',
      2: 'Licencia sencilla',
      3: 'Regularización y/o aprobación, cambio de uso',
      4: 'Otros, canalización vía pública, etc',
    };
    return map[tipo] || '';
  }

  /** NO BORRAR — Alerta de cargando del detalle. */
  private mostrarCargandoDetalle(): void {
    if (Swal.isVisible()) {
      return;
    }
    Swal.fire({
      title: 'Cargando...',
      html: 'Obteniendo detalle del local comercial',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#141a21',
      color: '#ffffff',
      backdrop: 'rgba(0, 0, 0, 0.55)',
      customClass: {
        popup: 'swal2-padding swal2-border swal-local-cargando',
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  /** NO BORRAR — Cierra la alerta de cargando del detalle. */
  private ocultarCargandoDetalle(conRetraso = false): Promise<void> {
    return new Promise((resolve) => {
      if (!Swal.isVisible()) {
        resolve();
        return;
      }

      const cerrar = () => {
        Swal.close();
        // Un frame después del cierre para que el layout del mapa tenga tamaño real.
        requestAnimationFrame(() => resolve());
      };

      if (conRetraso) {
        // Retraso corto: no bloquear el mapa (antes eran 500ms y el mapa nacía detrás del Swal).
        setTimeout(cerrar, 120);
        return;
      }
      cerrar();
    });
  }

  private tieneCoordenadasValidas(lat: unknown, lng: unknown): boolean {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return Number.isFinite(latNum) && Number.isFinite(lngNum) && latNum !== 0 && lngNum !== 0;
  }

  private todasLasFotosSonPlaceholder(): boolean {
    if (!this.informacion?.fotos?.length) {
      return true;
    }

    return this.informacion.fotos.every(
      (foto) => this.resolveFotoRuta(foto.ruta) === this.defaultImage
    );
  }

  private formatInfoWindowValue(value: string | null | undefined): string {
    if (
      value == null ||
      value === undefined ||
      String(value).trim() === '' ||
      String(value).toLowerCase() === 'null'
    ) {
      return 'Sin Información';
    }

    return String(value).trim();
  }

  tieneValor(valor: unknown): boolean {
    if (valor === null || valor === undefined) {
      return false;
    }
    const texto = String(valor).trim();
    return texto !== '' && texto.toLowerCase() !== 'null';
  }

  normalizarTipoPersona(valor: unknown): 1 | 2 | null {
    if (!this.tieneValor(valor)) {
      return null;
    }
    const tipo = Number(valor);
    if (tipo === 1) {
      return 1;
    }
    if (tipo === 2) {
      return 2;
    }
    return null;
  }

  concatenarNombre(...partes: unknown[]): string {
    return partes
      .filter((parte) => this.tieneValor(parte))
      .map((parte) => String(parte).trim())
      .join(' ');
  }

  formatearMetrosCuadrados(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return '';
    }
    const numero = Number(valor);
    if (Number.isFinite(numero)) {
      return `${numero} m²`;
    }
    const texto = String(valor).trim();
    return /m²|m2/i.test(texto) ? texto : `${texto} m²`;
  }

  formatearSuperficie(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return '';
    }
    const texto = String(valor).trim();
    if (/m²|m2|metros/i.test(texto)) {
      return texto;
    }
    const numero = Number(texto);
    if (Number.isFinite(numero)) {
      return `${numero} m²`;
    }
    return texto;
  }

  formatearCodigoPostal(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return '';
    }
    return `C.P. ${String(valor).trim()}`;
  }

  formatearNumeroExterior(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return '';
    }
    return `${String(valor).trim()}`;
  }

  formatearNumeroInterior(valor: unknown): string {
    if (!this.tieneValor(valor)) {
      return '';
    }
    return `${String(valor).trim()}`;
  }

  formatearSiNo(valor: unknown): string {
    if (valor === true) {
      return 'Sí';
    }
    if (valor === false) {
      return 'No';
    }
    return '';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private campoTieneValor(valor: unknown): boolean {
    return this.formatInfoWindowValue(valor as string) !== 'Sin Información';
  }

  private buildTooltipRow(icon: string, label: string, value: string, raw: unknown): string {
    const vacio = !this.campoTieneValor(raw);
    const valueClass = vacio ? ' mon-veh-tooltip__row-value--vacio' : '';
    return ''
      + '<div class="mon-veh-tooltip__row mon-veh-tooltip__row--wide">'
      + `<span class="mon-veh-tooltip__row-icon" aria-hidden="true">${icon}</span>`
      + '<p class="mon-veh-tooltip__row-copy">'
      + `<span class="mon-veh-tooltip__row-label">${label}</span>`
      + `<span class="mon-veh-tooltip__row-value${valueClass}">${value}</span>`
      + '</p></div>';
  }

  private getMarkerIcon(nombreEstatus: string): google.maps.Icon {
    const url = MARKER_ICONS[nombreEstatus] || 'assets/images/logos/marker_spring.webp';
    return {
      url,
      scaledSize: new google.maps.Size(MARKER_DISPLAY_WIDTH, MARKER_DISPLAY_HEIGHT),
      anchor: new google.maps.Point(MARKER_DISPLAY_WIDTH / 2, MARKER_DISPLAY_HEIGHT),
    };
  }

  get estatusLabel(): string {
    const nombre = this.informacion?.nombreEstatus?.trim();
    if (nombre) {
      return nombre;
    }
    return this.getEstatusLabelById(this.informacion?.estatus) ?? 'Sin estatus';
  }

  get estatusBadgeClass(): string {
    const nombre = (this.informacion?.nombreEstatus || '').toLowerCase();

    if (nombre.includes('correcto')) {
      return 'detalle-estatus-badge--correcto';
    }
    if (nombre.includes('revisión') || nombre.includes('revision')) {
      return 'detalle-estatus-badge--revision';
    }
    if (nombre.includes('faltante')) {
      return 'detalle-estatus-badge--faltante';
    }
    if (nombre.includes('rechazo') || nombre.includes('baja')) {
      return 'detalle-estatus-badge--rechazo';
    }

    switch (this.informacion?.estatus) {
      case 3:
        return 'detalle-estatus-badge--correcto';
      case 4:
        return 'detalle-estatus-badge--revision';
      case 1:
        return 'detalle-estatus-badge--faltante';
      case 2:
      case 5:
        return 'detalle-estatus-badge--rechazo';
      default:
        return 'detalle-estatus-badge--desconocido';
    }
  }

  get estatusIconClass(): string {
    switch (this.estatusBadgeClass) {
      case 'detalle-estatus-badge--correcto':
        return 'fa-check-circle';
      case 'detalle-estatus-badge--revision':
        return 'fa-pencil-square-o';
      case 'detalle-estatus-badge--faltante':
        return 'fa-folder-open';
      case 'detalle-estatus-badge--rechazo':
        return 'fa-ban';
      default:
        return 'fa-question-circle';
    }
  }

  private getEstatusLabelById(estatus?: number): string | null {
    switch (estatus) {
      case 1:
        return 'Información Faltante';
      case 2:
        return 'Rechazo o Sin respuesta';
      case 3:
        return 'Datos Correctos';
      case 4:
        return 'Revisión';
      default:
        return null;
    }
  }

  private buildInfoWindowContent(imgUrl: string): string {
    const urlImagen = this.escapeHtml(imgUrl.replace(/\\/g, '/'));
    const defaultImg = this.escapeHtml(this.defaultImage);
    const nombre = this.escapeHtml(this.formatInfoWindowValue(this.informacion.nombreComercial));
    const giro = this.escapeHtml(this.formatInfoWindowValue(this.informacion.nombreGiro));

    return ''
      + '<article class="mon-veh-tooltip mon-veh-tooltip--infowindow" role="tooltip" aria-label="Detalle del local comercial">'
      + '<div class="mon-veh-tooltip__glow" aria-hidden="true"></div>'
      + `<div class="mon-veh-tooltip__photo"><img src="${urlImagen}" alt="Licencia" onerror="this.onerror=null;this.src='${defaultImg}'" /></div>`
      + '<div class="mon-veh-tooltip__divider" aria-hidden="true"></div>'
      + '<div class="mon-veh-tooltip__body">'
      + this.buildTooltipRow(ICON_USER, 'Nombre:', nombre, this.informacion.nombreComercial)
      + this.buildTooltipRow(ICON_GIRO, 'Giro:', giro, this.informacion.nombreGiro)
      + '</div>'
      + '</article>';
  }

  private applyInfoWindowShellStyles(): void {
    document.querySelectorAll('.gm-style-iw-c, .gm-style-iw-d').forEach((el) => {
      const node = el as HTMLElement;
      node.style.background = 'transparent';
      node.style.boxShadow = 'none';
      node.style.overflow = 'visible';
      node.style.padding = '0';
    });

    const iw = document.querySelector('.gm-style-iw') as HTMLElement | null;
    if (iw) {
      iw.style.maxWidth = 'none';
    }
  }

  private setupInfoWindowImageFallback(imgUrl: string): void {
    const img = document.querySelector(
      '.mon-veh-tooltip--infowindow .mon-veh-tooltip__photo img'
    ) as HTMLImageElement | null;
    if (!img) {
      return;
    }

    img.onerror = () => {
      img.src = this.defaultImage;
    };

    const probe = new Image();
    probe.onerror = () => {
      img.src = this.defaultImage;
    };
    probe.src = imgUrl;
  }

  private setupInfoWindowHoverPersistence(
    onLeave: () => void,
    onEnter: () => void
  ): void {
    const root = document.querySelector('.mon-veh-tooltip--infowindow');
    if (!root) {
      return;
    }

    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
  }

  public idColoniaLicenciaComercial;
  public idColoniaSapac;
  public idLocalidadLicenciaComercial;
  public idLocalidadSapac;
  public idCalleLicenciaComercial;
  public idCalleSapac;
  public idMunicipio;
  public addCalleLicencia: boolean = false;
  public nombreComercial;
  public direccionNombreEntidadFederativa;

  public mostrarContenido: boolean = false;
  public showRazonSocialPC: boolean = false;
  public showRazonSocial: boolean = false;
  public showRFCPC: boolean = false;
  public showRepresentanteNombre: boolean = false;
  public showRepresentanteApellidoPaterno: boolean = false;
  public showRepresentanteApellidoMaterno: boolean = false;
  public showRepresentanteTelefono: boolean = false;
  public showRepresentantCorreo: boolean = false;
  

  icon = true;
  buttonText = 'Información Faltante';
  loadIndicatorVisible = false;

  iconSecond = true;
  buttonTextSecond = 'Revisión';
  loadIndicatorVisibleSecond = false;

  iconThird = true;
  buttonTextThird = 'Rechazo'
  loadIndicatorVisibleThird = false;

  iconFourth = true;
  buttonTextFourth = 'Datos Correctos'
  loadIndicatorVisibleFourth = false;
  
  iconFifth = true;
  buttonTextFifth = 'Regresar';
  loadIndicatorVisibleFifth = false;

  /** true cuando se abrió el detalle desde el mapa/lista de monitoreo. */
  private vieneDeMonitoreo = false;

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    public localComercialService: LocalComercialService,
    private googleMapsLoader: GoogleMapsLoaderService,
    private cdr: ChangeDetectorRef,
  ) {
      this.showFilterRow = true;
      this.showHeaderFilter = true;
      this.informacion = this.crearInformacionVacia();
     }

  ngOnInit() {
    this.obtenerPermisos();
    this.datosCargados = false;
    // Precarga Maps en paralelo al GET del detalle (solo maps + streetView).
    void this.googleMapsLoader.load(environment.googleMapsApiKey, ['maps', 'streetView']);
    this.vieneDeMonitoreo =
      this.activatedRoute.snapshot.queryParamMap.get('from') === 'monitoreo';
    this.routeSub = this.activatedRoute.params.subscribe((param) => {
      this.id = Number(param['id']);
      if (this.id) {
        this.obtenerDetalleLocal(this.id, true);
      }
    });
  }

  onShown() {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
  }

  ngAfterContentInit() {
		this.interval = setInterval(async () => {
			this.obtenerDetalleLocal(this.id, false);
		}, 180000);
	}

  ngOnDestroy() {
    this.mapaInitToken++;
    this.detalleSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    clearInterval(this.interval);
    this.mapaDetalle = null;
    this.mapaMarker = null;
    this.mapaInfoWindow = null;
    this.mapaHostEl = null;
    this.streetHostEl = null;
    this.panorama = null;
  }

  col(colAmount: number) {
    return `1 1 calc(${100 / colAmount}% - ${this._gap - (this._gap / colAmount)}px)`;
  }

/*-------------------------------
	Obtener Permisos Asignados
-------------------------------*/
  public get Permiso() {
    return LicenciamientoPermiso;
  }

  public obtenerPermisos() {
  }

/*------------------------------------
	Obtención de información para todo
  el detalle por id
------------------------------------*/
  public imagenLicencia;
  public imagenReciboPredial;
  public imagenReciboSapac;
  public imagenCaratulaMedidor;
  public imagenCuadroMedidor;
  public imagenFachadaEstablecimiento;
  public imagenEstacionamiento;
  public imagenBodega;
  public imagenVistoBueno;
  public typePeople;
  public tipoPersonaTexto = '';
  public tieneTipoPersona = false;
  public nombreSapacCompleto = '';
  public nombrePropietarioCompleto = '';
  public nombreContactoCompleto = '';
  public nombreRepresentanteCompleto = '';
  public nombreProteccionCivilCompleto = '';
  public typeEmpresa;
  public typePrograma;
  public typeEstacionamiento;

  obtenerDetalleLocal(id: number, mostrarCargando = true) {
    if (mostrarCargando) {
      this.mostrarCargandoDetalle();
    }

    this.detalleSub?.unsubscribe();
    this.detalleSub = this.localComercialService.obtenerRegistroPorId(id).subscribe({
      next: (response) => {
        if (this.id !== id) {
          return;
        }

        const api = unwrapRegistroResponse(response);
        const res = mapRegistroToDetalleLocal(api);
        this.informacion = this.normalizarInformacion(res);
        this.nombreComercial = this.informacion.nombreComercial ?? '';
        this.direccionNombreEntidadFederativa =
          this.informacion.direccion?.nombreEntidadFederativaLicencia ?? null;

        this.aplicarDetalleLocal();
        this.tieneUbicacionMapa = this.tieneCoordenadasValidas(
          this.informacion.lat,
          this.informacion.lng
        );
        this.isAvailable = this.tieneUbicacionMapa;

        this.datosCargados = true;
        this.cdr.detectChanges();

        // Cerrar Swal ANTES de crear/actualizar el mapa (si nace detrás, queda gris mucho rato).
        void this.ocultarCargandoDetalle(mostrarCargando).then(() => {
          if (this.id !== id) {
            return;
          }
          if (this.tieneUbicacionMapa) {
            this.programarInicializarMapaDetalle(id);
          } else {
            this.mapaInitToken++;
          }
        });
      },
      error: () => {
        if (this.id !== id) {
          return;
        }
        this.mapaInitToken++;
        this.informacion = this.crearInformacionVacia();
        this.datosCargados = true;
        this.tieneUbicacionMapa = false;
        this.isAvailable = false;
        void this.ocultarCargandoDetalle(false);
      },
    });
  }

  private crearDetalleLocalDemo(id: number): DetalleLocal {
    const ahora = new Date();
    return {
      id,
      nombreComercial: 'Local Comercial Demo',
      rfc: 'XAXX010101000',
      nombreGiro: 'Abarrotes',
      nombreEstatus: 'Revisión',
      estatus: 4,
      fechaExpedicion: ahora,
      fechaHora: ahora,
      fechaRefrendo: ahora,
      registro: 'REG-DEMO-001',
      licenciaSuelo: 'Sin Información',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      tipoPersona: 1,
      razonSocial: '',
      estacionamiento: false,
      lat: 18.9242,
      lng: -99.2216,
      numeroCuenta: '123456',
      nombreSapac: 'Juan',
      apellidoPaternoSapac: 'Pérez',
      apellidoMaternoSapac: 'López',
      rfcsapac: 'XAXX010101000',
      sector: '1',
      ruta: 'A',
      folio: 'F-001',
      nombreTipoServicio: 'SM',
      medidor: 'M-100',
      clave: 1001,
      m2: 45,
      superficie: '45',
      usoSuelo: 'Comercial',
      EsEmpresa: false,
      NombreProteccionCivil: 'Juan',
      ApellidoPaternoProteccionCivil: 'Pérez',
      ApellidoMaternoProteccionCivil: 'López',
      TelefonoProteccionCivil: 7771234567,
      RegistroAcreditacion: '',
      TienePrograma: false,
      VistoBueno: null,
      RfcProteccionCivil: null,
      direccion: {
        idEntidadFederativaLicencia: null,
        idMunicipioLicencia: null,
        idLocalidadLicencia: null,
        idColoniaLicencia: null,
        idCalleLicencia: null,
        nombreEntidadFederativaLicencia: null,
        nombreMuncipioLicencia: null,
        nombreLocalidadLicencia: null,
        nombreColoniaLicencia: null,
        nombreCalleLicencia: null,
        noInteriorLicencia: null,
        noExteriorLicencia: null,
        cpLicencia: null,
      },
      direccionSapac: {
        idEntidadFederativaSapac: null,
        idMunicipioSapac: null,
        idLocalidadSapac: null,
        idColoniaSapac: null,
        idCalleSapac: null,
        nombreEntidadFederativaSapac: null,
        nombreMuncipioSapac: null,
        nombreLocalidadSapac: null,
        nombreColoniaSapac: null,
        nombreCalleSapac: null,
        noInteriorSapac: null,
        noExteriorSapac: null,
        cpSapac: null,
      },
      contacto: {
        contactoNombre: 'María',
        contactoPaterno: 'García',
        contactoMaterno: 'Ruiz',
        contactoTelefono: '7779876543',
        contactoEmail: 'contacto@demo.local',
      },
      representante: {
        representanteLegalNombre: '',
        representanteLegalPaterno: '',
        representanteLegalMaterno: '',
        representanteLegalTelefono: '',
        representanteLegalEmail: '',
      } as any,
      proteccionCivil: {
        esEmpresa: false,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'López',
        telefono: 7771234567,
        razonSocial: null,
        rfc: null,
        registroAcreditacion: null,
        tienePrograma: false,
        vistoBueno: null,
      },
      fotos: [
        { idTipoFoto: 1, ruta: 'assets/default.png', tipoFoto: 'Licencia de funcionamiento' } as any,
        { idTipoFoto: 6, ruta: 'assets/default.png', tipoFoto: 'Fachada' } as any,
      ],
    } as DetalleLocal;
  }

  private aplicarDetalleLocal(): void {
    this.loading = true;

    const fotos = this.informacion.fotos ?? [];
    if (fotos.length > 0) {
      this.imagenLicencia = fotos.find((x) => x.idTipoFoto == 1);
      if (this.imagenLicencia) {
        this.imgValidate = this.resolveFotoRuta(this.imagenLicencia.ruta);
      } else {
        this.imgValidate = this.defaultImage;
      }

      this.imagenReciboPredial = fotos.find((x) => x.idTipoFoto == 2);
      this.imagenReciboSapac = fotos.find((x) => x.idTipoFoto == 3);
      this.imagenCaratulaMedidor = fotos.find((x) => x.idTipoFoto == 4);
      this.imagenCuadroMedidor = fotos.find((x) => x.idTipoFoto == 5);
      this.imagenFachadaEstablecimiento = fotos.find((x) => x.idTipoFoto == 6);
      this.imagenEstacionamiento = fotos.find((x) => x.idTipoFoto == 7);
      this.imagenBodega = fotos.find((x) => x.idTipoFoto == 8);
      this.imagenVistoBueno = fotos.find((x) => x.idTipoFoto == 9);
      this.i = 0;
      this.galeriaDireccion = 'init';
      this.actualizarImagenCarrusel();
      this.ocultaBtns = fotos.length < 2;
      this.loading = false;
    } else {
      this.isAvailableIMG = true;
      this.imgValidate = this.defaultImage;
      this.imagenCarrusel = this.defaultImage;
      this.ocultaBtns = true;
      this.loading = false;
    }

    const docsLc = this.documentosLc;
    this.iLc = 0;
    this.galeriaDireccionLc = 'init';
    this.ocultaBtnsLc = docsLc.length < 2;
    this.actualizarImagenCarruselLc();

    this.nombreSapacCompleto = this.concatenarNombre(
      this.informacion.nombreSapac,
      this.informacion.apellidoPaternoSapac,
      this.informacion.apellidoMaternoSapac
    );
    this.nombrePropietarioCompleto = this.concatenarNombre(
      this.informacion.nombre,
      this.informacion.apellidoPaterno,
      this.informacion.apellidoMaterno
    );
    this.nombreContactoCompleto = this.concatenarNombre(
      this.informacion.contacto?.contactoNombre,
      this.informacion.contacto?.contactoPaterno,
      this.informacion.contacto?.contactoMaterno
    );
    this.nombreRepresentanteCompleto = this.concatenarNombre(
      this.informacion.representante?.representanteLegalNombre,
      this.informacion.representante?.representanteLegalPaterno,
      this.informacion.representante?.representanteLegalMaterno
    );
    this.nombreProteccionCivilCompleto = this.concatenarNombre(
      this.informacion.proteccionCivil?.nombre,
      this.informacion.proteccionCivil?.apellidoPaterno,
      this.informacion.proteccionCivil?.apellidoMaterno
    );

    const tipoPersona = this.normalizarTipoPersona(this.informacion.tipoPersona);
    this.tieneTipoPersona = tipoPersona !== null;
    this.showRazonSocial = true;
    this.showRepresentanteNombre = true;
    this.showRepresentanteApellidoPaterno = true;
    this.showRepresentanteApellidoMaterno = true;
    this.showRepresentantCorreo = true;
    this.showRepresentanteTelefono = true;
    this.mostrarContenido = true;

    if (tipoPersona === 1) {
      this.typePeople = 'Física';
      this.tipoPersonaTexto = 'Física';
    } else if (tipoPersona === 2) {
      this.typePeople = 'Moral';
      this.tipoPersonaTexto = 'Moral';
      this.showRazonSocial = false;
      this.showRepresentanteNombre = false;
      this.showRepresentanteApellidoPaterno = false;
      this.showRepresentanteApellidoMaterno = false;
      this.showRepresentantCorreo = false;
      this.showRepresentanteTelefono = false;
      this.mostrarContenido = false;
    } else {
      this.typePeople = '';
      this.tipoPersonaTexto = '';
      this.tieneTipoPersona = false;
    }

    const pc = this.informacion.proteccionCivil;
    // EsEmpresa API: 1 física → No; 2 moral/empresa → Sí (+ Razón Social y RFC)
    if (pc?.esEmpresa === true) {
      this.typeEmpresa = 'Sí';
      this.showRazonSocialPC = true;
      this.showRFCPC = true;
    } else {
      this.typeEmpresa = 'No';
      this.showRazonSocialPC = false;
      this.showRFCPC = false;
    }

    if (pc?.tienePrograma === true) {
      this.typePrograma = 'Sí';
    } else {
      this.typePrograma = 'No';
    }

    if (this.informacion.estacionamiento === true) {
      this.typeEstacionamiento = 'Sí';
    } else {
      this.typeEstacionamiento = 'No';
    }

    const dir = this.informacion.direccion;
    const dirSapac = this.informacion.direccionSapac;

    /* Carga local: no llamar catálogos de API; usar nombres del detalle */
    this.idMunicipio = dir?.idMunicipioLicencia;
    this.idColoniaLicenciaComercial = dir?.idColoniaLicencia;
    this.idColoniaSapac = dirSapac?.idColoniaSapac;
    this.idCalleLicenciaComercial = dir?.idCalleLicencia;
    this.idCalleSapac = dirSapac?.idCalleSapac;
    this.idLocalidadLicenciaComercial = dir?.idLocalidadLicencia;
    this.idLocalidadSapac = dirSapac?.idLocalidadSapac;

    this.localidadNombreComercial = dir?.nombreLocalidadLicencia ?? null;
    this.coloniaNombreComercial = dir?.nombreColoniaLicencia ?? null;
    this.calleNombreComercial = dir?.nombreCalleLicencia ?? null;
    this.localidadSapac = dirSapac?.nombreLocalidadSapac ?? null;
    this.coloniaSapac = dirSapac?.nombreColoniaSapac ?? null;
    this.calleSapac = dirSapac?.nombreCalleSapac ?? null;
  }

  /** Espera a que Angular pinte #map / #street-view (evita carrera con *ngIf). */
  private programarInicializarMapaDetalle(id: number): void {
    const token = ++this.mapaInitToken;
    this.esperarContenedoresMapa(token, id, 0);
  }

  private esperarContenedoresMapa(token: number, id: number, intento: number): void {
    if (token !== this.mapaInitToken) {
      return;
    }

    const mapEl = document.getElementById('map');
    const streetEl = document.getElementById('street-view');

    if (mapEl && mapEl.offsetWidth > 0 && mapEl.offsetHeight > 0) {
      void this.inicializarMapaDetalle(id, mapEl, streetEl);
      return;
    }

    if (intento >= 40) {
      if (mapEl) {
        void this.inicializarMapaDetalle(id, mapEl, streetEl);
      }
      return;
    }

    setTimeout(() => this.esperarContenedoresMapa(token, id, intento + 1), 25);
  }

  private refrescarVistaMapa(
    coordinates: google.maps.LatLngLiteral,
    token: number,
  ): void {
    const go = () => {
      if (token !== this.mapaInitToken || !this.mapaDetalle) {
        return;
      }
      google.maps.event.trigger(this.mapaDetalle, 'resize');
      this.mapaDetalle.setCenter(coordinates);
    };
    requestAnimationFrame(go);
    setTimeout(go, 80);
    setTimeout(go, 250);
    setTimeout(go, 500);
  }

  /** Tras flex layout, Street View debe recalcular tamaño del contenedor. */
  private refrescarVistaStreetView(token: number): void {
    const go = () => {
      if (token !== this.mapaInitToken || !this.panorama) {
        return;
      }
      google.maps.event.trigger(this.panorama, 'resize');
    };
    requestAnimationFrame(go);
    setTimeout(go, 80);
    setTimeout(go, 250);
    setTimeout(go, 500);
  }

  private actualizarStreetView(
    coordinates: google.maps.LatLngLiteral,
    streetEl: HTMLElement,
    token: number,
  ): void {
    if (!this.sv) {
      this.sv = new google.maps.StreetViewService();
    }
    if (!this.panorama || this.streetHostEl !== streetEl) {
      this.panorama = new google.maps.StreetViewPanorama(streetEl, {
        visible: false,
        disableDefaultUI: false,
      });
      this.streetHostEl = streetEl;
    }

    this.sv.getPanorama(
      { location: coordinates, radius: 50 },
      (data, status) => {
        if (token !== this.mapaInitToken) {
          return;
        }
        this.processSVData(data, status);
        if (this.isAvailable && this.panorama) {
          this.panorama.setVisible(true);
          this.refrescarVistaStreetView(token);
        } else if (this.panorama) {
          this.panorama.setVisible(false);
        }
        this.isStreetView = false;
        this.cdr.detectChanges();
      }
    );
  }

  private inicializarMapaDetalle(
    id: number,
    mapEl: HTMLElement,
    streetEl: HTMLElement | null,
  ): void {
    const token = this.mapaInitToken;

    void this.googleMapsLoader
      .load(environment.googleMapsApiKey, ['maps', 'streetView'])
      .then(() => {
        if (token !== this.mapaInitToken) {
          return;
        }

        const lat = Number(this.informacion.lat);
        const lng = Number(this.informacion.lng);
        const coordinates = { lat, lng };

        if (streetEl) {
          this.actualizarStreetView(coordinates, streetEl, token);
        } else {
          this.isAvailable = false;
        }

        const reutilizar = this.mapaDetalle && this.mapaHostEl === mapEl;
        const licenciaImgUrl =
          'http://www.gtmtec.mx/FotosLicenciamiento\\' + id + '\\LicenciaFuncionamiento.jpeg';

        if (reutilizar) {
          this.mapaDetalle.setOptions({
            center: coordinates,
            zoom: 16,
          });
          if (this.mapaMarker) {
            this.mapaMarker.setPosition(coordinates);
            this.mapaMarker.setIcon(this.getMarkerIcon(this.informacion.nombreEstatus ?? ''));
          } else {
            this.mapaMarker = new google.maps.Marker({
              position: coordinates,
              map: this.mapaDetalle,
              icon: this.getMarkerIcon(this.informacion.nombreEstatus ?? ''),
            });
          }
          if (this.mapaInfoWindow) {
            this.mapaInfoWindow.setContent(this.buildInfoWindowContent(licenciaImgUrl));
          }
          this.refrescarVistaMapa(coordinates, token);
          return;
        }

        map = new google.maps.Map(mapEl, {
          center: coordinates,
          zoom: 16,
          gestureHandling: 'greedy',
          clickableIcons: false,
          styles: MAP_STYLES_SIN_ESTABLECIMIENTOS,
        });
        this.mapaDetalle = map;
        this.mapaHostEl = mapEl;

        this.mapaMarker = new google.maps.Marker({
          position: coordinates,
          map,
          icon: this.getMarkerIcon(this.informacion.nombreEstatus ?? ''),
        });

        const contentString = this.buildInfoWindowContent(licenciaImgUrl);

        const infowindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 380,
        });
        this.mapaInfoWindow = infowindow;

        let closeInfoTimeout: ReturnType<typeof setTimeout> | null = null;

        const openInfoWindow = () => {
          if (closeInfoTimeout) {
            clearTimeout(closeInfoTimeout);
            closeInfoTimeout = null;
          }
          if (currentInfoWindow != null && currentInfoWindow !== infowindow) {
            currentInfoWindow.close();
          }
          infowindow.open({ map, anchor: this.mapaMarker });
          currentInfoWindow = infowindow;
        };

        const cancelCloseInfoWindow = () => {
          if (closeInfoTimeout) {
            clearTimeout(closeInfoTimeout);
            closeInfoTimeout = null;
          }
        };

        const scheduleCloseInfoWindow = () => {
          cancelCloseInfoWindow();
          closeInfoTimeout = setTimeout(() => {
            infowindow.close();
            if (currentInfoWindow === infowindow) {
              currentInfoWindow = null;
            }
            closeInfoTimeout = null;
          }, 250);
        };

        google.maps.event.addListener(this.mapaMarker, 'mouseover', openInfoWindow);
        google.maps.event.addListener(this.mapaMarker, 'click', openInfoWindow);
        google.maps.event.addListener(this.mapaMarker, 'mouseout', scheduleCloseInfoWindow);

        google.maps.event.addListener(map, 'click', () => {
          cancelCloseInfoWindow();
          infowindow.close();
          if (currentInfoWindow === infowindow) {
            currentInfoWindow = null;
          }
        });

        google.maps.event.addListener(infowindow, 'domready', () => {
          this.applyInfoWindowShellStyles();
          this.setupInfoWindowImageFallback(licenciaImgUrl);
          this.setupInfoWindowHoverPersistence(scheduleCloseInfoWindow, cancelCloseInfoWindow);
        });

        this.refrescarVistaMapa(coordinates, token);
      })
      .catch(() => {
        this.isAvailable = false;
        this.cdr.detectChanges();
      });
  }

  obtenerLocalidades(idMunicipio) {
    this.localComercialService.obtenerLocalidadesMunicipio(idMunicipio).subscribe(
      (res: FormGenerico[]) => {
        res.push({ id: 0, nombre: 'Otro' });
        this.localidadRegistros = res.map((x) => {
          return { id: x.id, nombre: x.nombre };
        });
        const tempLocalidad = this.localidadRegistros.find(y => y.id === this.idLocalidadLicenciaComercial);
        this.localidadNombreComercial = tempLocalidad?.nombre ?? null;
      }
    );
  }

  obtenerLocalidadesSapac(idMunicipio) {
    this.localComercialService.obtenerLocalidadesMunicipio(idMunicipio).subscribe(
      (res: FormGenerico[]) => {
        res.push({ id: 0, nombre: 'Otro' });
        this.localidadRegistrosSapac = res.map((x) => {
          return { id: x.id, nombre: x.nombre };
        });
        const tempLocalidadSapac = this.localidadRegistrosSapac.find(y => y.id === this.idLocalidadSapac);
        this.localidadSapac = tempLocalidadSapac?.nombre ?? null;
      }
    );
  }

  obtenerCallesLicencia(idColonia) {
    this.localComercialService.obtenerCallesColonia(idColonia).subscribe((res: FormGenerico[]) => {
      res.push({ id: 0, nombre: 'Otro' })
      this.calleRegistros = res.map(x => { return { id: x.id, nombre: x.nombre } });
      const tempCalle = this.calleRegistros.find(y => y.id === this.idCalleLicenciaComercial);
      this.calleNombreComercial = tempCalle?.nombre ?? null;
    });
  }

  obtenerCallesLicenciaSapac(idColonia) {
    this.localComercialService.obtenerCallesColonia(idColonia).subscribe((res: FormGenerico[]) => {
      res.push({ id: 0, nombre: 'Otro' })
      this.calleRegistrosSapac = res.map(x => { return { id: x.id, nombre: x.nombre } });
      const tempCalleSapac = this.calleRegistrosSapac.find(y => y.id === this.idCalleSapac);
      this.calleSapac = tempCalleSapac?.nombre ?? null;
    });
  }

  obtenerColoniasLicencia(idLocalidad) {
    this.localComercialService.obtenerColoniasLocalidad(idLocalidad).
    subscribe(
      (res: FormGenerico[]) => {
        res.push({ id: 0, nombre: 'Otro' });
        this.coloniaRegistros = res.map((x) => {
          return { id: x.id, nombre: x.nombre };
        });
        const tempColonia = this.coloniaRegistros.find(y => y.id === this.idColoniaLicenciaComercial);
        this.coloniaNombreComercial = tempColonia?.nombre ?? null;
      }
    );
  }

  obtenerColoniasLicenciaSapac(idLocalidad) {
    this.localComercialService.obtenerColoniasLocalidad(idLocalidad).
    subscribe(
      (res: FormGenerico[]) => {
        res.push({ id: 0, nombre: 'Otro' });
        this.coloniaRegistrosSapac = res.map((x) => {
          return { id: x.id, nombre: x.nombre };
        });
        const tempColoniaSapac = this.coloniaRegistrosSapac.find(y => y.id === this.idColoniaSapac);
        this.coloniaSapac = tempColoniaSapac?.nombre ?? null;
      }
    );
  }

  processSVData(data, status): void {
    const ok =
      status === google.maps.StreetViewStatus.OK &&
      data?.location?.pano &&
      this.panorama;

    if (ok) {
      this.panorama.setPano(data.location.pano);
      this.panorama.setPov({
        heading: 270,
        pitch: 0,
      });
      this.isAvailable = true;
    } else {
      this.isAvailable = false;
    }
  }

  prev() {
    if (!this.informacion?.fotos?.length) {
      return;
    }
    this.galeriaDireccion = 'prev';
    if (this.i <= 0) {
      this.i = this.informacion.fotos.length;
    }
    this.i--;
    this.actualizarImagenCarrusel();
  }

  next() {
    if (!this.informacion?.fotos?.length) {
      return;
    }
    this.galeriaDireccion = 'next';
    if (this.i >= this.informacion.fotos.length - 1) {
      this.i = -1;
    }
    this.i++;
    this.actualizarImagenCarrusel();
  }

  irAFoto(index: number): void {
    if (!this.informacion?.fotos?.length || index === this.i) {
      return;
    }
    this.galeriaDireccion = index > this.i ? 'next' : 'prev';
    this.i = index;
    this.actualizarImagenCarrusel();
  }

  get galeriaSlide(): { url: string; tipo: string; index: number } {
    const foto = this.informacion?.fotos?.[this.i];
    return {
      url: this.imagenCarrusel,
      tipo: this.obtenerTipoFoto(foto),
      index: this.i,
    };
  }

  get tipoFotoActual(): string {
    return this.obtenerTipoFoto(this.informacion?.fotos?.[this.i]);
  }

  get galeriaSlideLc(): { url: string; tipo: string; index: number } {
    const doc = this.documentosLc[this.iLc];
    return {
      url: this.imagenCarruselLc,
      tipo: doc?.titulo || 'Documento',
      index: this.iLc,
    };
  }

  get tipoDocumentoLcActual(): string {
    return this.documentosLc[this.iLc]?.titulo || 'Sin documento';
  }

  trackGaleriaSlide(_index: number, slide: { index: number }): number {
    return slide.index;
  }

  private actualizarImagenCarrusel(): void {
    const foto = this.informacion?.fotos?.[this.i];
    this.imagenCarrusel = this.resolveFotoRuta(foto?.ruta);
    this.loading = false;
  }

  private actualizarImagenCarruselLc(): void {
    const doc = this.documentosLc[this.iLc];
    this.imagenCarruselLc = this.resolveFotoRuta(doc?.ruta);
  }

  prevLc(): void {
    const total = this.documentosLc.length;
    if (total < 2) {
      return;
    }
    this.galeriaDireccionLc = 'prev';
    this.iLc = this.iLc === 0 ? total - 1 : this.iLc - 1;
    this.actualizarImagenCarruselLc();
  }

  nextLc(): void {
    const total = this.documentosLc.length;
    if (total < 2) {
      return;
    }
    this.galeriaDireccionLc = 'next';
    this.iLc = this.iLc === total - 1 ? 0 : this.iLc + 1;
    this.actualizarImagenCarruselLc();
  }

  irADocumentoLc(index: number): void {
    if (index < 0 || index >= this.documentosLc.length) {
      return;
    }
    this.galeriaDireccionLc = index > this.iLc ? 'next' : index < this.iLc ? 'prev' : 'init';
    this.iLc = index;
    this.actualizarImagenCarruselLc();
  }

  esDocumentoLcActualPlaceholder(): boolean {
    const doc = this.documentosLc[this.iLc];
    if (!doc) {
      return true;
    }
    return this.resolveFotoRuta(doc.ruta) === this.defaultImage;
  }

  private obtenerTipoFoto(foto?: { tipoFoto?: string; idTipoFoto?: number }): string {
    if (!foto) {
      return 'Sin documento';
    }

    if (foto.tipoFoto?.trim()) {
      return foto.tipoFoto.trim();
    }

    const tipos: Record<number, string> = {
      1: 'Licencia de funcionamiento',
      2: 'Recibo predial',
      3: 'Recibo SAPAC',
      4: 'Carátula medidor',
      5: 'Cuadro medidor',
      6: 'Fachada establecimiento',
      7: 'Estacionamiento',
      8: 'Bodega',
      9: 'Visto Bueno',
    };

    return tipos[foto.idTipoFoto ?? 0] || 'Documento';
  }

  esFotoActualPlaceholder(): boolean {
    const foto = this.informacion?.fotos?.[this.i];
    if (!foto) {
      return true;
    }
    return this.resolveFotoRuta(foto.ruta) === this.defaultImage;
  }

  private aplicarCambioEstatusLocal(
    nombreEstatus: number,
    etiqueta: string,
    flags: {
      load: 'loadIndicatorVisible' | 'loadIndicatorVisibleSecond' | 'loadIndicatorVisibleThird' | 'loadIndicatorVisibleFourth';
      icon: 'icon' | 'iconSecond' | 'iconThird' | 'iconFourth';
      text: 'buttonText' | 'buttonTextSecond' | 'buttonTextThird' | 'buttonTextFourth';
      loadingText: string;
    }
  ): void {
    this[flags.text] = flags.loadingText;
    this[flags.load] = true;
    this[flags.icon] = false;

    const mapa: Record<number, string> = {
      1: 'Información Faltante',
      2: 'Rechazo o Sin respuesta',
      3: 'Datos Correctos',
      4: 'Revisión',
      5: 'Baja',
    };

    this.localComercialService.actualizarEstatusRegistro(this.id, nombreEstatus).subscribe({
      next: () => {
        this.informacion.estatus = nombreEstatus;
        this.informacion.nombreEstatus = mapa[nombreEstatus] ?? etiqueta;
        this[flags.text] = etiqueta;
        this[flags.load] = false;
        this[flags.icon] = true;

        // NO BORRAR — Alerta de confirmación de cambio de estatus.
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: '¡Confirmación Realizada!',
          html: `El estatus se cambió a <strong>${etiqueta}</strong>.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        }).then(() => {
          this.regresar();
        });
      },
      error: () => {
        this[flags.text] = etiqueta;
        this[flags.load] = false;
        this[flags.icon] = true;
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: 'Error',
          html: 'No se pudo actualizar el estatus. Intente de nuevo.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  get esDatosCorrectos(): boolean {
    return Number(this.informacion?.estatus) === 3;
  }

  private confirmarCambioEstatus(
    nombreEstatus: number,
    etiqueta: string,
    flags: {
      load: 'loadIndicatorVisible' | 'loadIndicatorVisibleSecond' | 'loadIndicatorVisibleThird' | 'loadIndicatorVisibleFourth';
      icon: 'icon' | 'iconSecond' | 'iconThird' | 'iconFourth';
      text: 'buttonText' | 'buttonTextSecond' | 'buttonTextThird' | 'buttonTextFourth';
      loadingText: string;
    }
  ): void {
    // NO BORRAR — Alerta confirmar cambio de estatus.
    Swal.fire({
      color: '#ffffff',
      background: '#141a21',
      title: '¡Cambiar Estatus!',
      html: `¿Está seguro que requiere cambiar el estatus a:<br> <strong>${etiqueta}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.aplicarCambioEstatusLocal(nombreEstatus, etiqueta, flags);
      }
    });
  }

  cambiarEstatus(nombreEstatus) {
    this.confirmarCambioEstatus(nombreEstatus, 'Información Faltante', {
      load: 'loadIndicatorVisible',
      icon: 'icon',
      text: 'buttonText',
      loadingText: 'Cargando...',
    });
  }

  cambiarEstatusSecond(nombreEstatus) {
    this.confirmarCambioEstatus(nombreEstatus, 'Revisión', {
      load: 'loadIndicatorVisibleSecond',
      icon: 'iconSecond',
      text: 'buttonTextSecond',
      loadingText: 'Cargando...',
    });
  }

  cambiarEstatusThird(nombreEstatus) {
    this.confirmarCambioEstatus(nombreEstatus, 'Rechazo', {
      load: 'loadIndicatorVisibleThird',
      icon: 'iconThird',
      text: 'buttonTextThird',
      loadingText: 'Cargando...',
    });
  }

  cambiarEstatusFourth(nombreEstatus) {
    this.confirmarCambioEstatus(nombreEstatus, 'Datos Correctos', {
      load: 'loadIndicatorVisibleFourth',
      icon: 'iconFourth',
      text: 'buttonTextFourth',
      loadingText: 'Cargando...',
    });
  }

/*------------------------------------
	Enrutamiento
------------------------------------*/
  regresar() {
    this.buttonTextFifth = 'Regresar...'
    this.loadIndicatorVisibleFifth = true;
    this.iconFifth = false;
    if (this.vieneDeMonitoreo) {
      this.router.navigateByUrl('/monitoreo');
      return;
    }
    this.router.navigateByUrl('/local-comercial/lista-local-comercial');
  }

  onClick(data) {
    this.loadIndicatorVisibleFifth = true;
    this.iconFifth = false;
    this.regresar();
    setTimeout(() => {
      this.regresar();
      this.buttonTextFifth = 'Regresar';
      this.loadIndicatorVisibleFifth = false;
      this.iconFifth = true;
    }, 300);
  }
  
}
