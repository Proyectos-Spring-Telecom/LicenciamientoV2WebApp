import { animate, group, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { LayoutScrollService } from 'src/app/services/layout-scroll.service';
import { DOCUMENTOS_LICENCIAMIENTO, DocumentoLocalConfig } from '../../utils/documentos-local.config';
import {
  PreRegistroFilesState,
  PreRegistroStateService,
} from '../../services/pre-registro-state.service';
import { SepomexService } from '../../services/sepomex.service';
import { SepomexCodigoPostal, SepomexColonia } from '../../models/sepomex-codigo-postal';
import { mostrarSwalCodigoPostalNoEncontrado } from '../../utils/local-comercial-swal.util';
import {
  SeleccionUbicacionModalComponent,
  SeleccionUbicacionResult,
} from '../formulario/seleccion-ubicacion-modal/seleccion-ubicacion-modal.component';

export interface CorresponsableOcupacion {
  value: string;
  label: string;
  icon: string;
}

export interface CorresponsableItem {
  id: number;
  nombre: string;
  especialidad: string;
  icon: string;
  noRegLicenciaConstruccion: string;
  cedulaProfesional: string;
}

type FirmaKey = 'propietario' | 'director' | 'corresponsable' | 'recepcion';

const TIPO_SOLICITUD_MAP: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  'obra-nueva': 1,
  'licencia-sencilla': 2,
  regularizacion: 3,
  otros: 4,
};

const DOC_CONTROL_TO_FILE_KEY: Record<string, keyof PreRegistroFilesState> = {
  ReciboSapac: 'ReciboSapac',
  CaratulaMedidor: 'CaratulaMedidor',
  CuadroMedidor: 'CuadroMedidor',
  ReciboPredial: 'ReciboPredial',
  LicenciaFuncionamiento: 'LicenciaFuncionamiento',
  FachadaEstablecimiento: 'FachadaEstablecimiento',
  EstacionamientoIMG: 'EstacionamientoIMG',
  Bodega: 'Bodega',
  VistoBueno: 'VistoBueno',
  planos: 'LcJuegoDePlanosArquitectonicos',
  permisoSuelo: 'LcLicenciaUsoyPlano',
  constanciaAlineamiento: 'LcConstanciaAlineamientoyNumero',
  constanciaPropietario: 'LcConstanciaPropietario',
  factibilidad: 'LcFactibilidad',
  recibosPredial: 'LcRecibosImpuestoPredial',
  otrosDocs: 'LcOtrosDocs',
};

@Component({
  selector: 'app-pre-registro-local',
  templateUrl: './pre-registro-local.component.html',
  styleUrls: ['./pre-registro-local.component.scss', '../../styles/local-form-tabs.css'],
  animations: [
    routeAnimation,
    trigger('preRegReveal', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(56px) scale(0.94)',
          filter: 'blur(8px)',
        }),
        group([
          animate(
            '520ms cubic-bezier(0.16, 1, 0.3, 1)',
            style({
              opacity: 1,
              transform: 'translateY(0) scale(1)',
              filter: 'blur(0)',
            })
          ),
          query(
            '.perm-head, .local-form-banner, .local-form-section, .local-form-tab-nav',
            [
              style({ opacity: 0, transform: 'translateY(28px)' }),
              stagger(85, [
                animate(
                  '420ms cubic-bezier(0.16, 1, 0.3, 1)',
                  style({ opacity: 1, transform: 'translateY(0)' })
                ),
              ]),
            ],
            { optional: true }
          ),
        ]),
      ]),
    ]),
    trigger('correspForm', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        group([
          animate(
            '320ms cubic-bezier(0.16, 1, 0.3, 1)',
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
          query(
            '.pre-reg-corresp-row__field, .pre-reg-corresp-row__actions',
            [
              style({ opacity: 0, transform: 'translateY(20px)' }),
              stagger(75, [
                animate(
                  '340ms cubic-bezier(0.16, 1, 0.3, 1)',
                  style({ opacity: 1, transform: 'translateY(0)' })
                ),
              ]),
            ],
            { optional: true }
          ),
        ]),
      ]),
      transition(':leave', [
        animate(
          '240ms ease',
          style({ opacity: 0, transform: 'translateY(-14px)' })
        ),
      ]),
    ]),
    trigger('correspCard', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.96)' }),
        animate(
          '380ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '220ms ease',
          style({ opacity: 0, transform: 'translateX(16px) scale(0.96)' })
        ),
      ]),
    ]),
    trigger('correspOtroField', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(12px)' }),
        animate(
          '280ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate('180ms ease', style({ opacity: 0, transform: 'translateX(-10px)' })),
      ]),
    ]),
  ],
  standalone: false,
})
export class PreRegistroLocalComponent implements OnInit {
  public titulo = 'Tipo de Local';
  public title = 'Licenciamiento';

  /** false hasta confirmar ubicación en el modal */
  public ubicacionConfirmada = false;
  public lat: number | null = null;
  public lng: number | null = null;
  public direccionSeleccionada = '';

  /** Paso extra (imágenes 2 y 3) cuando predio en obra = sí */
  public mostrarApartadoObra = false;
  private pendienteScrollInicio = false;

  @ViewChild('firmaPropietario')
  set firmaPropietarioRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.setupFirmaPad('propietario', ref.nativeElement);
  }

  @ViewChild('firmaDirector')
  set firmaDirectorRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.setupFirmaPad('director', ref.nativeElement);
  }

  private firmaPads: Partial<
    Record<
      FirmaKey,
      {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        drawing: boolean;
        lastX: number;
        lastY: number;
      }
    >
  > = {};

  public predioEnObra = false;
  public tipoRegistro: 'comercial' | 'vivienda' = 'comercial';

  /** Placeholders UI — sin servicios ni nombres definitivos de campos */
  public codigoPostal = '';
  public estado = '';
  public municipio = '';
  public colonia = '';
  public coloniasSepomex: SepomexColonia[] = [];
  public calleNumero = '';
  public noInterior = '';
  public noExterior = '';
  public localidad = '';

  public tipoLicencia = '';
  public descripcionProyecto = '';
  public ubicacionConstruccion = '';
  public propietarioNombre = '';
  public propietarioRfc = '';
  public directorNombre = '';
  public directorLicencia = '';
  public directorCedula = '';
  public superficieTerrenoM2 = '';
  public superficieTerrenoObraM2 = '';
  public descripcionSistemaConstructivo = '';
  public numeroExpediente = '';
  public numeroControl = '';

  /** Documentos de licenciamiento sin Licencia de Funcionamiento (solo en tab Licenciamiento del formulario). */
  public readonly documentosCatalogo: DocumentoLocalConfig[] = DOCUMENTOS_LICENCIAMIENTO.filter(
    (doc) => doc.controlName !== 'Licencias.licenciaFuncionamiento'
  );
  public readonly documentosExistentes: Record<string, string> = {};
  private readonly archivosSeleccionados: PreRegistroFilesState = {};
  private readonly fotosPredioFiles: File[] = [];

  /** Cards extra de Fotos del Predio (row debajo de las 3 columnas) */
  public fotosPredioExtras: { id: number }[] = [];
  private nextFotoPredioId = 2;

  public readonly ocupacionesCorresponsable: CorresponsableOcupacion[] = [
    { value: 'seguridad-estructural', label: 'Seguridad Estructural', icon: 'architecture' },
    { value: 'instalaciones-electricas', label: 'Instalaciones Eléctricas', icon: 'bolt' },
    { value: 'instalaciones-hidraulicas', label: 'Instalaciones Hidráulicas', icon: 'water_drop' },
    { value: 'proteccion-civil', label: 'Protección Civil', icon: 'health_and_safety' },
    { value: 'diseno-arquitectonico', label: 'Diseño Arquitectónico', icon: 'design_services' },
    { value: 'otro', label: 'Otro', icon: 'work' },
  ];

  /** Lista ya confirmada (vista tipo card) */
  public corresponsables: CorresponsableItem[] = [];

  /** Formulario temporal para agregar uno nuevo */
  public mostrandoFormCorresponsable = true;
  public draftNombreCorresponsable = '';
  public draftOcupacionCorresponsable = '';
  public draftOcupacionOtroTexto = '';
  public draftNoRegCorresponsable = '';
  public draftCedulaCorresponsable = '';

  private nextCorresponsableId = 1;

  get esOcupacionOtro(): boolean {
    return this.draftOcupacionCorresponsable === 'otro';
  }

  /** Pre-registro + 4 tabs del formulario de alta (Sapac…Protección). */
  get pasosTotalesFlujo(): number {
    const tabsAlta = 4;
    const pasosPre = this.predioEnObra || this.mostrarApartadoObra ? 2 : 1;
    return pasosPre + tabsAlta;
  }

  get pasoActualFlujo(): number {
    return this.mostrarApartadoObra ? 2 : 1;
  }

  get porcentajeAvanceFlujo(): number {
    return Math.round((this.pasoActualFlujo / this.pasosTotalesFlujo) * 100);
  }

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private layoutScroll: LayoutScrollService,
    private preRegistroState: PreRegistroStateService,
    private sepomexService: SepomexService
  ) {}

  ngOnInit(): void {
    if (this.restaurarDesdeRegreso()) {
      return;
    }
    this.abrirModalUbicacion();
  }

  buscarCodigoPostal(): void {
    const cp = String(this.codigoPostal ?? '').replace(/\D/g, '').slice(0, 5);
    this.codigoPostal = cp;
    if (cp.length !== 5) {
      return;
    }
    this.sepomexService.obtenerPorCp(cp).subscribe({
      next: (res: SepomexCodigoPostal) => {
        this.estado = res?.estado?.nombre ?? '';
        this.municipio = res?.municipio?.nombre ?? '';
        this.coloniasSepomex = Array.isArray(res?.colonias) ? res.colonias : [];
        this.colonia = '';
      },
      error: (err) => {
        this.coloniasSepomex = [];
        mostrarSwalCodigoPostalNoEncontrado(err, cp);
      },
    });
  }

  private restaurarDesdeRegreso(): boolean {
    const state = history.state as {
      regreso?: boolean;
      abrirApartadoObra?: boolean;
      predioEnObra?: boolean;
      lat?: number | null;
      lng?: number | null;
      direccion?: string;
      tipoRegistro?: 'comercial' | 'vivienda';
    } | null;

    if (!state?.regreso) {
      return false;
    }

    this.ubicacionConfirmada = true;
    this.lat = state.lat ?? null;
    this.lng = state.lng ?? null;
    this.direccionSeleccionada = state.direccion?.trim() || '';
    this.tipoRegistro = state.tipoRegistro === 'vivienda' ? 'vivienda' : 'comercial';
    this.predioEnObra = !!state.predioEnObra || !!state.abrirApartadoObra;
    this.mostrarApartadoObra = !!state.abrirApartadoObra;
    if (this.direccionSeleccionada) {
      this.ubicacionConstruccion = this.direccionSeleccionada;
    }
    queueMicrotask(() => this.scrollAlInicio());
    return true;
  }

  abrirModalUbicacion(): void {
    const dialogRef = this.dialog.open(SeleccionUbicacionModalComponent, {
      width: '95vw',
      maxWidth: '960px',
      maxHeight: '95vh',
      panelClass: ['ubicacion-modal-panel', 'ubicacion-modal-panel--animated'],
      autoFocus: false,
      disableClose: true,
      // Animación propia en CSS; evita el flash de Material al cerrar
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        lat: this.lat ?? undefined,
        lng: this.lng ?? undefined,
      },
    });

    dialogRef.afterClosed().subscribe((ubicacion: SeleccionUbicacionResult | undefined) => {
      if (!ubicacion) {
        if (!this.ubicacionConfirmada) {
          this.redirigirLista();
        }
        return;
      }
      this.lat = ubicacion.lat;
      this.lng = ubicacion.lng;
      this.direccionSeleccionada = ubicacion.direccion?.trim() || '';
      if (!this.ubicacionConstruccion || this.direccionSeleccionada) {
        this.ubicacionConstruccion = this.direccionSeleccionada
          || `${ubicacion.lat.toFixed(5)}, ${ubicacion.lng.toFixed(5)}`;
      }

      if (this.ubicacionConfirmada) {
        // Solo actualizó la ubicación; el form ya está visible
        return;
      }

      // Modal ya cerrado: entra todo el formulario con animación
      this.ubicacionConfirmada = true;
    });
  }

  seleccionarTipoRegistro(tipo: 'comercial' | 'vivienda'): void {
    this.tipoRegistro = tipo;
  }

  onPredioEnObraChange(checked: boolean): void {
    this.predioEnObra = checked;
    if (!checked) {
      this.mostrarApartadoObra = false;
    }
  }

  continuar(): void {
    if (!this.ubicacionConfirmada) {
      this.abrirModalUbicacion();
      return;
    }
    if (this.predioEnObra) {
      this.pendienteScrollInicio = true;
      this.mostrarApartadoObra = true;
      this.scrollAlInicio();
      return;
    }
    this.irAlFormularioExistente();
  }

  volverATipoLocal(): void {
    this.pendienteScrollInicio = true;
    this.mostrarApartadoObra = false;
    this.scrollAlInicio();
  }

  onPreRegRevealDone(): void {
    if (this.mostrarApartadoObra) {
      requestAnimationFrame(() => this.refrescarFirmasPads());
    }
    if (!this.pendienteScrollInicio) return;
    this.pendienteScrollInicio = false;
    this.scrollAlInicio();
  }

  private refrescarFirmasPads(): void {
    const prop = this.firmaPads.propietario?.canvas;
    const dir = this.firmaPads.director?.canvas;
    if (prop) this.setupFirmaPad('propietario', prop);
    if (dir) this.setupFirmaPad('director', dir);
  }

  private scrollAlInicio(): void {
    const goTop = () => this.layoutScroll.scrollToTop('auto');
    goTop();
    queueMicrotask(goTop);
    requestAnimationFrame(goTop);
    setTimeout(goTop, 0);
    setTimeout(goTop, 50);
    setTimeout(goTop, 150);
    setTimeout(goTop, 300);
  }

  finalizarRegistro(): void {
    this.irAlFormularioExistente();
  }

  abrirFormCorresponsable(): void {
    this.mostrandoFormCorresponsable = true;
  }

  cancelarFormCorresponsable(): void {
    this.limpiarDraftCorresponsable();
    this.mostrandoFormCorresponsable = this.corresponsables.length === 0;
  }

  onOcupacionDraftChange(event: MatSelectChange): void {
    if (event.value === 'otro') {
      this.draftOcupacionOtroTexto = '';
    }
  }

  volverASelectOcupacion(): void {
    this.draftOcupacionCorresponsable = '';
    this.draftOcupacionOtroTexto = '';
  }

  confirmarCorresponsable(): void {
    const nombre = this.draftNombreCorresponsable.trim();
    if (!nombre) return;

    if (this.esOcupacionOtro) {
      const especialidad = this.draftOcupacionOtroTexto.trim();
      if (!especialidad) return;
      this.corresponsables = [
        ...this.corresponsables,
        {
          id: this.nextCorresponsableId++,
          nombre,
          especialidad,
          icon: 'work',
          noRegLicenciaConstruccion: this.draftNoRegCorresponsable.trim(),
          cedulaProfesional: this.draftCedulaCorresponsable.trim(),
        },
      ];
    } else {
      const ocupacion = this.ocupacionesCorresponsable.find(
        (o) => o.value === this.draftOcupacionCorresponsable
      );
      if (!ocupacion) return;
      this.corresponsables = [
        ...this.corresponsables,
        {
          id: this.nextCorresponsableId++,
          nombre,
          especialidad: ocupacion.label,
          icon: ocupacion.icon,
          noRegLicenciaConstruccion: this.draftNoRegCorresponsable.trim(),
          cedulaProfesional: this.draftCedulaCorresponsable.trim(),
        },
      ];
    }

    this.limpiarDraftCorresponsable();
    this.mostrandoFormCorresponsable = false;
  }

  quitarCorresponsable(id: number): void {
    this.corresponsables = this.corresponsables.filter((c) => c.id !== id);
    if (!this.corresponsables.length) {
      this.mostrandoFormCorresponsable = true;
    }
  }

  iconoDraftOcupacion(): string {
    if (this.esOcupacionOtro) return 'work';
    return (
      this.ocupacionesCorresponsable.find((o) => o.value === this.draftOcupacionCorresponsable)
        ?.icon ?? 'work'
    );
  }

  etiquetaDraftOcupacion(): string {
    return (
      this.ocupacionesCorresponsable.find((o) => o.value === this.draftOcupacionCorresponsable)
        ?.label ?? ''
    );
  }

  private limpiarDraftCorresponsable(): void {
    this.draftNombreCorresponsable = '';
    this.draftOcupacionCorresponsable = '';
    this.draftOcupacionOtroTexto = '';
    this.draftNoRegCorresponsable = '';
    this.draftCedulaCorresponsable = '';
  }

  agregarFotoPredio(): void {
    this.fotosPredioExtras = [
      ...this.fotosPredioExtras,
      { id: this.nextFotoPredioId++ },
    ];
  }

  quitarFotoPredio(id: number): void {
    this.fotosPredioExtras = this.fotosPredioExtras.filter((f) => f.id !== id);
  }

  onDocumentoSeleccionado(controlName: string, file: File): void {
    if (controlName.startsWith('fotosPredio_')) {
      this.fotosPredioFiles.push(file);
      this.documentosExistentes[controlName] = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : file.name;
      return;
    }

    const key = DOC_CONTROL_TO_FILE_KEY[controlName];
    if (!key) {
      return;
    }

    if (
      key === 'LcJuegoDePlanosArquitectonicos' ||
      key === 'LcLicenciaUsoyPlano' ||
      key === 'LcConstanciaAlineamientoyNumero' ||
      key === 'LcConstanciaPropietario' ||
      key === 'LcFactibilidad' ||
      key === 'LcRecibosImpuestoPredial' ||
      key === 'LcOtrosDocs'
    ) {
      const actuales = this.archivosSeleccionados[key] ?? [];
      this.archivosSeleccionados[key] = [...actuales, file];
    } else {
      (this.archivosSeleccionados as Record<string, File | null>)[key] = file;
    }

    this.documentosExistentes[controlName] = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : file.name;
  }

  onDocumentoRechazado(_controlName: string): void {
    // UI feedback handled by uploader card
  }

  verDocumentoExistente(_doc: DocumentoLocalConfig): void {
    // Solo lectura en pre-registro
  }

  onFirmaPointerDown(key: FirmaKey, event: PointerEvent): void {
    const pad = this.firmaPads[key];
    if (!pad) return;
    event.preventDefault();
    pad.canvas.setPointerCapture?.(event.pointerId);
    const point = this.firmaPoint(pad.canvas, event);
    pad.drawing = true;
    pad.lastX = point.x;
    pad.lastY = point.y;
    pad.ctx.beginPath();
    pad.ctx.moveTo(point.x, point.y);
    pad.ctx.lineTo(point.x, point.y);
    pad.ctx.stroke();
  }

  onFirmaPointerMove(key: FirmaKey, event: PointerEvent): void {
    const pad = this.firmaPads[key];
    if (!pad?.drawing) return;
    event.preventDefault();
    const point = this.firmaPoint(pad.canvas, event);
    pad.ctx.beginPath();
    pad.ctx.moveTo(pad.lastX, pad.lastY);
    pad.ctx.lineTo(point.x, point.y);
    pad.ctx.stroke();
    pad.lastX = point.x;
    pad.lastY = point.y;
  }

  onFirmaPointerUp(key: FirmaKey, event: PointerEvent): void {
    const pad = this.firmaPads[key];
    if (!pad) return;
    pad.drawing = false;
    try {
      pad.canvas.releasePointerCapture?.(event.pointerId);
    } catch {
      // ignore
    }
  }

  limpiarFirma(key: FirmaKey): void {
    const pad = this.firmaPads[key];
    if (!pad) return;
    const { canvas, ctx } = pad;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    pad.drawing = false;
  }

  private setupFirmaPad(key: FirmaKey, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height || 160));

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    this.firmaPads[key] = {
      canvas,
      ctx,
      drawing: false,
      lastX: 0,
      lastY: 0,
    };
  }

  private firmaPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  redirigirLista(): void {
    this.router.navigateByUrl('/local-comercial/lista-local-comercial');
  }

  private irAlFormularioExistente(): void {
    this.persistirEstadoPreRegistro();
    const state = {
      preRegistro: true,
      lat: this.lat,
      lng: this.lng,
      direccion: this.direccionSeleccionada,
      tipoRegistro: this.tipoRegistro,
      predioEnObra: this.predioEnObra,
    };
    this.router.navigateByUrl('/local-comercial/alta-local-comercial', { state });
  }

  private persistirEstadoPreRegistro(): void {
    const firmas = this.exportarFirmasComoArchivos();
    const files: PreRegistroFilesState = {
      ...this.archivosSeleccionados,
      LcOtrosDocs: [
        ...(this.archivosSeleccionados.LcOtrosDocs ?? []),
        ...this.fotosPredioFiles,
      ],
      LcFirmaPropietario: firmas.propietario,
      LcFirmaDRO: firmas.director,
      LcFirmaCorresponsable: firmas.corresponsable,
      LcFirmaResponsableRecepcionDocumento: firmas.recepcion,
    };

    this.preRegistroState.setState(
      {
        preRegistro: true,
        lat: this.lat,
        lng: this.lng,
        direccion: this.direccionSeleccionada,
        tipoRegistro: this.tipoRegistro,
        predioEnObra: this.predioEnObra,
        EntidadFederativa: this.estado,
        Municipio: this.municipio,
        Localidad: this.localidad,
        Colonia: this.colonia,
        Calle: this.calleNumero,
        NoInterior: this.noInterior,
        NoExterior: this.noExterior,
        CP: this.codigoPostal,
        LcTipoSolicitudLicencia: TIPO_SOLICITUD_MAP[this.tipoLicencia] ?? this.tipoLicencia,
        LcDescripcionProyecto: this.descripcionProyecto,
        LcSuperficieTerrenoM2: this.superficieTerrenoM2,
        LcSuperficieTerrenoObraM2: this.superficieTerrenoObraM2,
        LcDescripcionSistemaConstructivo: this.descripcionSistemaConstructivo,
        LcNombrePropietario: this.propietarioNombre,
        LcDomicilioNotificacion: this.ubicacionConstruccion || this.direccionSeleccionada,
        LcRFC: this.propietarioRfc,
        LcNombreDRO: this.directorNombre,
        LcNoRegLicenciaConstruccion: this.directorLicencia,
        LcCedulaProfesional: this.directorCedula || this.directorLicencia,
        LcFecha: '',
        LcNumeroExpediente: this.numeroExpediente,
        LcNumeroControl: this.numeroControl,
        LcSeguimientoObra: '',
        LcConstanciaAlineamiento: '',
        LcLicenciaUsoSuelo: '',
        LcPlanoAutorizado: '',
        LcLicenciaFraccionamiento: '',
        LcEscrituras: '',
        LcFactibilidadAguaPotable: '',
        LcRecibosPagoPredial: '',
        LcRecibosMunicipales: '',
        LcPlanoArquitectonicos: '',
        LcOtros: '',
        LcCorresponsables: this.corresponsables.map((c) => ({
          NombreCompleto: c.nombre,
          NoRegLicenciaConstruccion: c.noRegLicenciaConstruccion,
          CedulaProfesional: c.cedulaProfesional,
        })),
      },
      files
    );
  }

  private exportarFirmasComoArchivos(): Partial<
    Record<'propietario' | 'director' | 'corresponsable' | 'recepcion', File | null>
  > {
    const resultado: Partial<
      Record<'propietario' | 'director' | 'corresponsable' | 'recepcion', File | null>
    > = {};
    (['propietario', 'director', 'corresponsable', 'recepcion'] as const).forEach((key) => {
      const canvas = this.firmaPads[key]?.canvas;
      if (!canvas) {
        resultado[key] = null;
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      if (!dataUrl || dataUrl.length < 100) {
        resultado[key] = null;
        return;
      }
      resultado[key] = this.dataUrlToFile(dataUrl, `firma-${key}.png`);
    });
    return resultado;
  }

  private dataUrlToFile(dataUrl: string, filename: string): File | null {
    try {
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch?.[1] || 'image/png';
      const bstr = atob(arr[1] || '');
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch {
      return null;
    }
  }
}
