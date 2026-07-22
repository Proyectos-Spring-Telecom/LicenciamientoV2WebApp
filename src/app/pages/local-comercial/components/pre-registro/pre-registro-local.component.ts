import { animate, group, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { LayoutScrollService } from 'src/app/services/layout-scroll.service';
import {
  DOCUMENTOS_LICENCIAMIENTO,
  DocumentoLocalConfig,
  mapFotosToUrls,
  resolverValorDocumentoFormData,
  toDateInputValue,
} from '../../utils/documentos-local.config';
import {
  PreRegistroFilesState,
  PreRegistroStateService,
} from '../../services/pre-registro-state.service';
import { LocalComercialService } from '../../services/local-comercial.service';
import { SepomexService } from '../../services/sepomex.service';
import { SepomexCodigoPostal, SepomexColonia } from '../../models/sepomex-codigo-postal';
import {
  mostrarCargandoLocalComercial,
  mostrarSwalCodigoPostalNoEncontrado,
  mostrarSwalError,
  mostrarSwalExito,
  ocultarCargandoLocalComercial,
} from '../../utils/local-comercial-swal.util';
import {
  buildLocalComercialActualizarFormData,
  buildLocalComercialFormData,
  createRegistrosFormGroup,
  mapPredioObra,
  mapTipoRegistro,
} from '../../utils/local-comercial-form-payload.util';
import {
  mapDocumentosFromRegistro,
  mapRegistroToFormPatch,
  unwrapRegistroResponse,
} from '../../utils/map-registro-api.util';
import { SeleccionUbicacionResult } from '../formulario/seleccion-ubicacion-modal/seleccion-ubicacion-modal.component';
import {
  SubirDocumentoModalComponent,
  SubirDocumentoData,
} from '../formulario/subir-documento-modal/subir-documento-modal.component';

export interface CorresponsableItem {
  /** Id local de UI (lista). */
  id: number;
  /** Id del API para PATCH Corresponsables[i].Id (actualizar existente). */
  idApi?: number | null;
  nombre: string;
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
  'Licencias.fachada': 'FachadaEstablecimiento',
  'Licencias.bodega': 'Bodega',
  'Licencias.estacionamiento': 'EstacionamientoIMG',
  constanciaAlineamiento: 'LcConstanciaAlineamientoFile',
  constanciaNumero: 'LcConstanciaNumero',
  permisoSuelo: 'LcLicenciaUsoSueloFile',
  planoAutorizado: 'LcPlanoAutorizadoFile',
  licenciaFraccionamiento: 'LcLicenciaFraccionamientoFile',
  constanciaPropietario: 'LcConstanciaPropietario',
  factibilidad: 'LcFactibilidad',
  recibosPredial: 'LcRecibosImpuestoPredial',
  planos1: 'LcJuegoDePlanosArquitectonicos1',
  planos2: 'LcJuegoDePlanosArquitectonicos2',
  planos3: 'LcJuegoDePlanosArquitectonicos3',
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

  /** Id de registro cuando el flujo es editar */
  public idRegistro: number | null = null;

  /** false hasta confirmar ubicación en el mapa */
  public ubicacionConfirmada = false;
  /** true mientras el mapa full-page de selección está visible */
  public mostrarMapaUbicacion = false;
  public lat: number | null = null;
  public lng: number | null = null;
  public direccionSeleccionada = '';

  /** Paso extra (imágenes 2 y 3) cuando predio en obra = sí */
  public mostrarApartadoObra = false;
  private pendienteScrollInicio = false;

  @ViewChild('firmaPropietario')
  set firmaPropietarioRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.registrarCanvasFirma('propietario', ref.nativeElement);
  }

  @ViewChild('firmaDirector')
  set firmaDirectorRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.registrarCanvasFirma('director', ref.nativeElement);
  }

  @ViewChild('firmaCorresponsable')
  set firmaCorresponsableRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.registrarCanvasFirma('corresponsable', ref.nativeElement);
  }

  @ViewChild('firmaRecepcion')
  set firmaRecepcionRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    if (ref?.nativeElement) this.registrarCanvasFirma('recepcion', ref.nativeElement);
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

  /** URLs de firmas del GET /registros/{id}. */
  public firmasRemotas: Partial<Record<FirmaKey, string>> = {};
  /** true si el usuario dibujó o limpió (ya no se muestra la remota). */
  private firmasEditadas: Partial<Record<FirmaKey, boolean>> = {};
  /** true si hay trazo nuevo en el canvas (para exportar File). */
  private firmasConTrazo: Partial<Record<FirmaKey, boolean>> = {};

  private readonly FIRMA_URL_KEYS: Record<FirmaKey, string> = {
    propietario: 'LicenciaConstruccion.FirmaPropietario',
    director: 'LicenciaConstruccion.FirmaDRO',
    corresponsable: 'LicenciaConstruccion.FirmaCorresponsable',
    recepcion: 'LicenciaConstruccion.FirmaResponsableRecepcionDocumento',
  };

  public predioEnObra = false;
  public tipoRegistro: 'comercial' | 'vivienda' = 'comercial';

  /** Placeholders UI — sin servicios ni nombres definitivos de campos */
  public codigoPostal = '';
  public estado = '';
  public municipio = '';
  public colonia = '';
  public coloniasSepomex: SepomexColonia[] = [];
  /**
   * true solo si Sepomex respondió error: Estado/Municipio/Colonia pasan a texto libre.
   * Los valores se siguen enviando igual (EntidadFederativa, Municipio, Colonia).
   */
  public direccionManualPorErrorSepomex = false;
  public calleNumero = '';
  public noInterior = '';
  public noExterior = '';
  public localidad = '';

  public tipoLicencia = '';
  public descripcionProyecto = '';
  public claveCatastral = '';
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
  public fechaLicenciaConstruccion = '';
  public seguimientoObra = '';

  /** Documentos de licenciamiento sin Licencia de Funcionamiento (solo en tab Licenciamiento del formulario). */
  public readonly documentosCatalogo: DocumentoLocalConfig[] = DOCUMENTOS_LICENCIAMIENTO.filter(
    (doc) => doc.controlName !== 'Licencias.licenciaFuncionamiento'
  );
  public documentosExistentes: Record<string, string> = {};
  private readonly archivosSeleccionados: PreRegistroFilesState = {};
  /** Solo flags integer (sin IdTipoFoto propio en POST). */
  private readonly docsChecklistFlags: Record<string, File | null> = {
    escrituras: null,
    recibosMunicipales: null,
  };

  /** Lista ya confirmada (vista tipo card) */
  public corresponsables: CorresponsableItem[] = [];

  /** Formulario temporal para agregar uno nuevo */
  public mostrandoFormCorresponsable = true;
  public draftNombreCorresponsable = '';
  public draftNoRegCorresponsable = '';
  public draftCedulaCorresponsable = '';

  private nextCorresponsableId = 1;

  /** Con predio en obra solo hay 2 pasos; sin obra: Tipo de Local + 4 tabs de alta. */
  get pasosTotalesFlujo(): number {
    if (this.predioEnObra || this.mostrarApartadoObra) {
      return 2;
    }
    return 1 + 4;
  }

  get pasoActualFlujo(): number {
    return this.mostrarApartadoObra ? 2 : 1;
  }

  get porcentajeAvanceFlujo(): number {
    return Math.round((this.pasoActualFlujo / this.pasosTotalesFlujo) * 100);
  }

  /** Capturado en constructor: getCurrentNavigation() solo funciona ahí. */
  private navStateAlEntrar: Record<string, unknown> | null = null;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private layoutScroll: LayoutScrollService,
    private preRegistroState: PreRegistroStateService,
    private localComercialService: LocalComercialService,
    private sepomexService: SepomexService,
    private fb: FormBuilder,
  ) {
    this.navStateAlEntrar =
      (this.router.getCurrentNavigation()?.extras?.state as Record<string, unknown> | null) ??
      (history.state as Record<string, unknown> | null) ??
      null;
  }

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    const idNum = idParam != null ? Number(idParam) : NaN;
    this.idRegistro = Number.isFinite(idNum) && idNum > 0 ? idNum : null;

    // Evita mezclar borrador de otro registro / alta
    const scope = this.idRegistro ?? 'nuevo';
    if (!this.preRegistroState.isScope(scope)) {
      this.preRegistroState.beginFlow(scope);
    }

    // Si hay borrador (regreso desde formulario / atrás del navegador), restaurar
    if (this.restaurarDesdeRegreso()) {
      return;
    }

    if (this.idRegistro) {
      this.cargarRegistroParaEdicion(this.idRegistro);
      return;
    }

    this.abrirModalUbicacion();
  }

  buscarCodigoPostal(preservarColonia = false): void {
    const cp = String(this.codigoPostal ?? '').replace(/\D/g, '').slice(0, 5);
    const coloniaActual = this.colonia;
    this.codigoPostal = cp;
    if (cp.length !== 5) {
      return;
    }
    this.sepomexService.obtenerPorCp(cp).subscribe({
      next: (res: SepomexCodigoPostal) => {
        this.direccionManualPorErrorSepomex = false;
        this.estado = res?.estado?.nombre ?? '';
        this.municipio = res?.municipio?.nombre ?? '';
        this.coloniasSepomex = Array.isArray(res?.colonias) ? res.colonias : [];
        if (preservarColonia && coloniaActual) {
          this.colonia = coloniaActual;
          if (!this.coloniasSepomex.some((c) => c.nombre === coloniaActual)) {
            this.coloniasSepomex = [
              { idAsentamiento: '', nombre: coloniaActual, tipoAsentamiento: '' },
              ...this.coloniasSepomex,
            ];
          }
        } else {
          this.colonia = '';
        }
      },
      error: (err) => {
        this.activarDireccionManualPorErrorSepomex();
        mostrarSwalCodigoPostalNoEncontrado(err, cp);
      },
    });
  }

  /** Solo UI: libera Estado/Municipio/Colonia como texto. No cambia el body. */
  private activarDireccionManualPorErrorSepomex(): void {
    this.direccionManualPorErrorSepomex = true;
    this.coloniasSepomex = [];
  }

  private restaurarDesdeRegreso(): boolean {
    const navState = (this.navStateAlEntrar ?? history.state) as {
      regreso?: boolean;
      preRegistro?: boolean;
      abrirApartadoObra?: boolean;
      predioEnObra?: boolean;
      lat?: number | null;
      lng?: number | null;
      direccion?: string;
      tipoRegistro?: 'comercial' | 'vivienda' | number | string;
      idRegistro?: number | null;
    } | null;

    const stored = this.preRegistroState.peekScalar();
    if (!stored?.preRegistro) {
      return false;
    }

    if (navState?.idRegistro && !this.idRegistro) {
      this.idRegistro = Number(navState.idRegistro) || null;
    }

    this.ubicacionConfirmada = true;
    this.lat = navState?.lat ?? stored.lat ?? null;
    this.lng = navState?.lng ?? stored.lng ?? null;
    this.direccionSeleccionada =
      (navState?.direccion ?? stored.direccion)?.trim() || '';
    this.tipoRegistro =
      navState?.tipoRegistro === 'vivienda' ||
      navState?.tipoRegistro === 1 ||
      navState?.tipoRegistro === '1' ||
      stored.tipoRegistro === 'vivienda' ||
      stored.tipoRegistro === 1 ||
      stored.tipoRegistro === '1'
        ? 'vivienda'
        : 'comercial';
    this.predioEnObra =
      !!navState?.predioEnObra || !!navState?.abrirApartadoObra || !!stored.predioEnObra;
    this.mostrarApartadoObra = navState?.abrirApartadoObra != null
      ? !!navState.abrirApartadoObra
      : false;
    if (this.direccionSeleccionada) {
      this.ubicacionConstruccion = this.direccionSeleccionada;
    }
    this.aplicarScalarPreRegistro(stored);
    this.restaurarArchivosYCorresponsables();
    queueMicrotask(() => {
      if (this.mostrarApartadoObra) {
        this.programarInitFirmas();
      }
      this.scrollAlInicio();
    });
    return true;
  }

  private restaurarArchivosYCorresponsables(): void {
    const data = this.preRegistroState.peekScalar();
    const files = this.preRegistroState.peekFiles();

    if (data?.LcCorresponsables?.length) {
      this.corresponsables = data.LcCorresponsables.map((c, index) => ({
        id: index + 1,
        idApi: c.Id ?? null,
        nombre: c.NombreCompleto ?? '',
        noRegLicenciaConstruccion: c.NoRegLicenciaConstruccion ?? '',
        cedulaProfesional: c.CedulaProfesional ?? '',
      }));
      this.nextCorresponsableId = this.corresponsables.length + 1;
      this.mostrandoFormCorresponsable = this.corresponsables.length === 0;
    }

    Object.assign(this.archivosSeleccionados, files);

    const mapaPreview: Array<[keyof PreRegistroFilesState, string]> = [
      ['FachadaEstablecimiento', 'Licencias.fachada'],
      ['Bodega', 'Licencias.bodega'],
      ['EstacionamientoIMG', 'Licencias.estacionamiento'],
      ['LcConstanciaAlineamientoFile', 'constanciaAlineamiento'],
      ['LcConstanciaNumero', 'constanciaNumero'],
      ['LcLicenciaUsoSueloFile', 'permisoSuelo'],
      ['LcPlanoAutorizadoFile', 'planoAutorizado'],
      ['LcLicenciaFraccionamientoFile', 'licenciaFraccionamiento'],
      ['LcJuegoDePlanosArquitectonicos1', 'planos1'],
      ['LcJuegoDePlanosArquitectonicos2', 'planos2'],
      ['LcJuegoDePlanosArquitectonicos3', 'planos3'],
      ['LcConstanciaPropietario', 'constanciaPropietario'],
      ['LcFactibilidad', 'factibilidad'],
      ['LcRecibosImpuestoPredial', 'recibosPredial'],
      ['LcOtrosDocs', 'otrosDocs'],
    ];

    const docs: Record<string, string> = { ...this.documentosExistentes };
    mapaPreview.forEach(([key, control]) => {
      const valor = files[key];
      if (valor instanceof File) {
        docs[control] = URL.createObjectURL(valor);
      }
    });
    this.documentosExistentes = docs;
  }

  private cargarRegistroParaEdicion(id: number): void {
    this.localComercialService.obtenerRegistroPorId(id).subscribe({
      next: (response) => {
        const result = unwrapRegistroResponse(response);
        const patch = mapRegistroToFormPatch(result);
        this.hidratarDesdePatch(patch);
        const docs = {
          ...mapFotosToUrls(result?.fotos ?? []),
          ...mapDocumentosFromRegistro(result),
        };
        this.documentosExistentes = docs;
        this.hidratarFotosPredioDesdeDocumentos(docs);
        this.hidratarFirmasRemotasDesdeDocumentos(docs);
        this.abrirModalUbicacion();
      },
      error: () => {
        this.abrirModalUbicacion();
      },
    });
  }

  /** Hidrata preview de `otros` (máx. 1) desde GET. */
  private hidratarFotosPredioDesdeDocumentos(docs: Record<string, string>): void {
    const otros =
      docs['LicenciaConstruccion.otros'] ||
      docs['otrosDocs'] ||
      docs['fotosPredio_1'];
    if (otros) {
      this.documentosExistentes = {
        ...this.documentosExistentes,
        otrosDocs: otros,
      };
    }
  }

  private hidratarFirmasRemotasDesdeDocumentos(docs: Record<string, string>): void {
    const remotas: Partial<Record<FirmaKey, string>> = {};
    (Object.keys(this.FIRMA_URL_KEYS) as FirmaKey[]).forEach((key) => {
      const url = String(docs[this.FIRMA_URL_KEYS[key]] ?? '').trim();
      if (url) {
        remotas[key] = url;
      }
    });
    this.firmasRemotas = remotas;
    this.firmasEditadas = {};
    this.firmasConTrazo = {};
  }

  /** Muestra la firma del servicio mientras el usuario no la edite. */
  urlFirmaVisible(key: FirmaKey): string | null {
    if (this.firmasEditadas[key]) {
      return null;
    }
    const url = this.firmasRemotas[key]?.trim();
    return url || null;
  }

  private hidratarDesdePatch(patch: Record<string, unknown>): void {
    const lat = Number(patch['Latitud']);
    const lng = Number(patch['Longitud']);
    this.lat = Number.isFinite(lat) ? lat : null;
    this.lng = Number.isFinite(lng) ? lng : null;

    const tipo = Number(patch['TipoRegistro']);
    this.tipoRegistro = tipo === 1 ? 'vivienda' : 'comercial';
    this.predioEnObra = Number(patch['PredioObra']) === 1;

    this.estado = String(patch['EntidadFederativa'] ?? '');
    this.municipio = String(patch['Municipio'] ?? '');
    this.localidad = String(patch['Localidad'] ?? '');
    this.colonia = String(patch['Colonia'] ?? '');
    this.calleNumero = String(patch['Calle'] ?? '');
    this.noInterior = String(patch['NoInterior'] ?? '');
    this.noExterior = String(patch['NoExterior'] ?? '');
    this.codigoPostal = String(patch['CP'] ?? '').replace(/\D/g, '').slice(0, 5);

    const partes = [this.calleNumero, this.colonia, this.municipio, this.estado, this.codigoPostal]
      .map((p) => String(p || '').trim())
      .filter(Boolean);
    this.direccionSeleccionada = partes.join(', ');
    if (this.direccionSeleccionada) {
      this.ubicacionConstruccion = this.direccionSeleccionada;
    }

    const lc = (patch['LicenciaConstruccion'] || {}) as Record<string, unknown>;
    if (Object.keys(lc).length) {
      const tipoSol = lc['TipoSolicitudLicencia'];
      this.tipoLicencia =
        tipoSol == null || tipoSol === '' ? this.tipoLicencia : String(tipoSol);
      this.descripcionProyecto = String(lc['DescripcionProyecto'] ?? this.descripcionProyecto);
      this.claveCatastral = String(lc['ClaveCatastral'] ?? this.claveCatastral);
      this.superficieTerrenoM2 = String(lc['SuperficieTerrenoM2'] ?? this.superficieTerrenoM2);
      this.superficieTerrenoObraM2 = String(
        lc['SuperficieTerrenoObraM2'] ?? this.superficieTerrenoObraM2
      );
      this.descripcionSistemaConstructivo = String(
        lc['DescripcionSistemaConstructivo'] ?? this.descripcionSistemaConstructivo
      );
      this.propietarioNombre = String(lc['NombrePropietario'] ?? this.propietarioNombre);
      this.ubicacionConstruccion = String(
        lc['DomicilioNotificacion'] || this.ubicacionConstruccion || this.direccionSeleccionada
      );
      this.propietarioRfc = String(lc['RFC'] ?? this.propietarioRfc);
      this.directorNombre = String(lc['NombreDRO'] ?? this.directorNombre);
      this.directorLicencia = String(lc['NoRegLicenciaConstruccion'] ?? this.directorLicencia);
      this.directorCedula = String(lc['CedulaProfesional'] ?? this.directorCedula);
      this.numeroExpediente = String(lc['NumeroExpediente'] ?? this.numeroExpediente);
      this.numeroControl = String(lc['NumeroControl'] ?? this.numeroControl);
      this.fechaLicenciaConstruccion =
        toDateInputValue(lc['Fecha']) || this.fechaLicenciaConstruccion;
      this.seguimientoObra = String(lc['SeguimientoObra'] ?? this.seguimientoObra);

      const cors = Array.isArray(lc['Corresponsables']) ? (lc['Corresponsables'] as any[]) : [];
      if (cors.length) {
        this.corresponsables = cors.map((c, index) => ({
          id: index + 1,
          idApi: c?.Id != null && c?.Id !== '' ? Number(c.Id) : null,
          nombre: String(c?.NombreCompleto ?? ''),
          noRegLicenciaConstruccion: String(c?.NoRegLicenciaConstruccion ?? ''),
          cedulaProfesional: String(c?.CedulaProfesional ?? ''),
        }));
        this.nextCorresponsableId = this.corresponsables.length + 1;
        this.mostrandoFormCorresponsable = false;
      }
    }

    // Deja el estado listo para el formulario (texto + corresponsables)
    this.persistirEstadoPreRegistro();

    if (this.codigoPostal.length === 5) {
      this.sepomexService.obtenerPorCp(this.codigoPostal).subscribe({
        next: (res: SepomexCodigoPostal) => {
          this.direccionManualPorErrorSepomex = false;
          this.estado = this.estado || (res?.estado?.nombre ?? '');
          this.municipio = this.municipio || (res?.municipio?.nombre ?? '');
          this.coloniasSepomex = Array.isArray(res?.colonias) ? res.colonias : [];
          if (this.colonia && !this.coloniasSepomex.some((c) => c.nombre === this.colonia)) {
            this.coloniasSepomex = [
              { idAsentamiento: '', nombre: this.colonia, tipoAsentamiento: '' },
              ...this.coloniasSepomex,
            ];
          }
          this.persistirEstadoPreRegistro();
        },
        error: () => {
          this.activarDireccionManualPorErrorSepomex();
        },
      });
    } else if (this.colonia) {
      this.coloniasSepomex = [
        { idAsentamiento: '', nombre: this.colonia, tipoAsentamiento: '' },
      ];
    }
  }

  private aplicarScalarPreRegistro(data: ReturnType<PreRegistroStateService['peekScalar']>): void {
    if (!data?.preRegistro) {
      return;
    }
    this.estado = data.EntidadFederativa ?? this.estado;
    this.municipio = data.Municipio ?? this.municipio;
    this.localidad = data.Localidad ?? this.localidad;
    this.colonia = data.Colonia ?? this.colonia;
    this.calleNumero = data.Calle ?? this.calleNumero;
    this.noInterior = data.NoInterior ?? this.noInterior;
    this.noExterior = data.NoExterior ?? this.noExterior;
    this.codigoPostal = String(data.CP ?? this.codigoPostal).replace(/\D/g, '').slice(0, 5);
    this.tipoRegistro = data.tipoRegistro === 'vivienda' || data.tipoRegistro === 1 || data.tipoRegistro === '1'
      ? 'vivienda'
      : 'comercial';
    this.predioEnObra = !!data.predioEnObra;
    this.tipoLicencia = String(data.LcTipoSolicitudLicencia ?? this.tipoLicencia);
    this.descripcionProyecto = data.LcDescripcionProyecto ?? this.descripcionProyecto;
    this.claveCatastral = data.LcClaveCatastral ?? this.claveCatastral;
    this.superficieTerrenoM2 = String(data.LcSuperficieTerrenoM2 ?? this.superficieTerrenoM2);
    this.superficieTerrenoObraM2 = String(data.LcSuperficieTerrenoObraM2 ?? this.superficieTerrenoObraM2);
    this.descripcionSistemaConstructivo =
      data.LcDescripcionSistemaConstructivo ?? this.descripcionSistemaConstructivo;
    this.propietarioNombre = data.LcNombrePropietario ?? this.propietarioNombre;
    this.ubicacionConstruccion =
      data.LcDomicilioNotificacion || data.direccion || this.ubicacionConstruccion;
    this.propietarioRfc = data.LcRFC ?? this.propietarioRfc;
    this.directorNombre = data.LcNombreDRO ?? this.directorNombre;
    this.directorLicencia = data.LcNoRegLicenciaConstruccion ?? this.directorLicencia;
    this.directorCedula = data.LcCedulaProfesional ?? this.directorCedula;
    this.numeroExpediente = data.LcNumeroExpediente ?? this.numeroExpediente;
    this.numeroControl = data.LcNumeroControl ?? this.numeroControl;
    this.fechaLicenciaConstruccion =
      toDateInputValue(data.LcFecha) || this.fechaLicenciaConstruccion;
    this.seguimientoObra = String(data.LcSeguimientoObra ?? this.seguimientoObra);
    this.direccionSeleccionada = data.direccion || this.direccionSeleccionada;
    this.lat = data.lat ?? this.lat;
    this.lng = data.lng ?? this.lng;

    // No llamar Sepomex aquí: solo al buscar CP manualmente o al hidratar edición.
    // Al cambiar de paso/regresar basta con conservar colonia en el select.
    if (this.colonia && !this.coloniasSepomex.some((c) => c.nombre === this.colonia)) {
      this.coloniasSepomex = [
        { idAsentamiento: '', nombre: this.colonia, tipoAsentamiento: '' },
        ...this.coloniasSepomex,
      ];
    }
  }

  /** Muestra el mapa full-page (reemplaza al antiguo modal de ubicación). */
  abrirModalUbicacion(): void {
    this.mostrarMapaUbicacion = true;
    this.scrollAlInicio();
  }

  onUbicacionConfirmada(ubicacion: SeleccionUbicacionResult): void {
    this.mostrarMapaUbicacion = false;
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

    // Mapa ya cerrado: entra todo el formulario con animación
    this.ubicacionConfirmada = true;
    this.scrollAlInicio();
  }

  onUbicacionCancelada(): void {
    if (!this.ubicacionConfirmada) {
      this.redirigirLista();
      return;
    }
    this.mostrarMapaUbicacion = false;
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
    // Solo persistir: los valores ya están en el componente; no rehidratar ni tocar CP/Sepomex
    this.persistirEstadoPreRegistro();
    if (this.predioEnObra) {
      this.pendienteScrollInicio = true;
      this.mostrarApartadoObra = true;
      this.programarInitFirmas();
      this.scrollAlInicio();
      return;
    }
    this.irAlFormularioExistente();
  }

  volverATipoLocal(): void {
    this.persistirEstadoPreRegistro();
    this.pendienteScrollInicio = true;
    this.mostrarApartadoObra = false;
    queueMicrotask(() => this.scrollAlInicio());
  }

  onPreRegRevealDone(): void {
    if (this.mostrarApartadoObra) {
      this.programarInitFirmas();
    }
    if (!this.pendienteScrollInicio) return;
    this.pendienteScrollInicio = false;
    this.scrollAlInicio();
  }

  private programarInitFirmas(): void {
    const run = () => this.refrescarFirmasPads();
    queueMicrotask(run);
    requestAnimationFrame(() => requestAnimationFrame(run));
    setTimeout(run, 40);
    setTimeout(run, 120);
    setTimeout(run, 280);
  }

  private refrescarFirmasPads(): void {
    if (!this.mostrarApartadoObra) {
      return;
    }
    const prop = this.firmaPads.propietario?.canvas;
    const dir = this.firmaPads.director?.canvas;
    const corr = this.firmaPads.corresponsable?.canvas;
    const rec = this.firmaPads.recepcion?.canvas;
    if (prop) this.setupFirmaPad('propietario', prop);
    if (dir) this.setupFirmaPad('director', dir);
    if (corr) this.setupFirmaPad('corresponsable', corr);
    if (rec) this.setupFirmaPad('recepcion', rec);
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

  /**
   * Predio en obra: envía el registro con LicenciaConstruccion (sin Sapac/Catastral/Licenciamiento/PC).
   * Sin obra: no aplica aquí; Continuar ya manda al formulario de alta.
   */
  finalizarRegistro(): void {
    if (!this.predioEnObra) {
      this.irAlFormularioExistente();
      return;
    }
    this.persistirEstadoPreRegistro();
    this.enviarRegistroPredioObra();
  }

  private enviarRegistroPredioObra(): void {
    // Asegura Files del catálogo (fachada/bodega/estacionamiento) + LC en memoria antes del FormData
    this.sincronizarArchivosEnEstado();
    this.persistirEstadoPreRegistro();
    const form = this.construirFormularioEnvioObra();
    const formData = this.idRegistro
      ? buildLocalComercialActualizarFormData(
          this.idRegistro,
          form,
          (path) => this.valorDocumentoEnvio(form, path),
        )
      : buildLocalComercialFormData(
          form,
          (path) => this.valorDocumentoEnvio(form, path),
        );

    mostrarCargandoLocalComercial(
      this.idRegistro ? 'Actualizando local comercial' : 'Guardando local comercial',
    );

    const peticion$ = this.idRegistro
      ? this.localComercialService.actualizarLocal(this.idRegistro, formData)
      : this.localComercialService.agregarLocalComercial(formData);

    peticion$.subscribe({
      next: () => {
        ocultarCargandoLocalComercial(() => {
          mostrarSwalExito({
            title: '¡Operación exitosa!',
            text: this.idRegistro
              ? '¡Se ha actualizado de manera exitosa el local comercial!'
              : '¡Se ha agregado de manera exitosa el local comercial!',
          });
          this.redirigirLista();
        });
      },
      error: () => {
        ocultarCargandoLocalComercial(() => {
          mostrarSwalError({
            title: '¡Ops!',
            text: this.idRegistro
              ? '¡Error al intentar modificar los datos del local!'
              : '¡Error al agregar el local!',
          });
        });
      },
    });
  }

  private construirFormularioEnvioObra(): FormGroup {
    const data = this.preRegistroState.peekScalar();
    const files = this.preRegistroState.peekFiles();
    const form = createRegistrosFormGroup(this.fb);

    form.patchValue({
      Latitud: data?.lat ?? this.lat ?? '',
      Longitud: data?.lng ?? this.lng ?? '',
      TipoRegistro: Number(mapTipoRegistro(data?.tipoRegistro ?? this.tipoRegistro ?? 0) || '0'),
      PredioObra: Number(mapPredioObra(true)),
      EntidadFederativa: data?.EntidadFederativa ?? this.estado ?? '',
      Municipio: data?.Municipio ?? this.municipio ?? '',
      Localidad: data?.Localidad ?? this.localidad ?? '',
      Colonia: data?.Colonia ?? this.colonia ?? '',
      Calle: data?.Calle ?? this.calleNumero ?? '',
      NoInterior: data?.NoInterior ?? this.noInterior ?? '',
      NoExterior: data?.NoExterior ?? this.noExterior ?? '',
      CP: data?.CP ?? this.codigoPostal ?? '',
      LicenciaConstruccion: {
        TipoSolicitudLicencia: data?.LcTipoSolicitudLicencia ?? '',
        DescripcionProyecto: data?.LcDescripcionProyecto ?? '',
        ClaveCatastral: data?.LcClaveCatastral ?? '',
        SuperficieTerrenoM2: data?.LcSuperficieTerrenoM2 ?? '',
        SuperficieTerrenoObraM2: data?.LcSuperficieTerrenoObraM2 ?? '',
        DescripcionSistemaConstructivo: data?.LcDescripcionSistemaConstructivo ?? '',
        NombrePropietario: data?.LcNombrePropietario ?? '',
        DomicilioNotificacion:
          data?.LcDomicilioNotificacion ?? data?.direccion ?? this.direccionSeleccionada ?? '',
        RFC: data?.LcRFC ?? '',
        NombreDRO: data?.LcNombreDRO ?? '',
        NoRegLicenciaConstruccion: data?.LcNoRegLicenciaConstruccion ?? '',
        CedulaProfesional: data?.LcCedulaProfesional ?? '',
        Fecha:
          toDateInputValue(this.fechaLicenciaConstruccion || data?.LcFecha) ||
          this.fechaLicenciaConstruccion ||
          data?.LcFecha ||
          '',
        NumeroExpediente: data?.LcNumeroExpediente ?? '',
        NumeroControl: data?.LcNumeroControl ?? '',
        SeguimientoObra: data?.LcSeguimientoObra ?? '',
        ConstanciaAlineamiento: data?.LcConstanciaAlineamiento ?? '',
        LicenciaUsoSuelo: data?.LcLicenciaUsoSuelo ?? '',
        PlanoAutorizado: data?.LcPlanoAutorizado ?? '',
        LicenciaFraccionamiento: data?.LcLicenciaFraccionamiento ?? '',
        Escrituras: data?.LcEscrituras ?? '',
        FactibilidadAguaPotable: data?.LcFactibilidadAguaPotable ?? '',
        RecibosPagoPredial: data?.LcRecibosPagoPredial ?? '',
        RecibosMunicipales: data?.LcRecibosMunicipales ?? '',
        PlanoArquitectonicos: data?.LcPlanoArquitectonicos ?? '',
        Otros: data?.LcOtros ?? '',
      },
    });

    const array = form.get('LicenciaConstruccion.Corresponsables') as FormArray | null;
    if (array) {
      while (array.length) {
        array.removeAt(0);
      }
      const lista = data?.LcCorresponsables?.length
        ? data.LcCorresponsables
        : [{ Id: null, NombreCompleto: '', NoRegLicenciaConstruccion: '', CedulaProfesional: '' }];
      lista.forEach((item) => {
        array.push(
          this.fb.group({
            Id: [item?.Id ?? null],
            NombreCompleto: [item?.NombreCompleto ?? ''],
            NoRegLicenciaConstruccion: [item?.NoRegLicenciaConstruccion ?? ''],
            CedulaProfesional: [item?.CedulaProfesional ?? ''],
          }),
        );
      });
      while (array.length < 2) {
        array.push(
          this.fb.group({
            Id: [null],
            NombreCompleto: [''],
            NoRegLicenciaConstruccion: [''],
            CedulaProfesional: [''],
          }),
        );
      }
    }

    const setFile = (path: string, file: File | null | undefined) => {
      if (file instanceof File && file.name) {
        form.get(path)?.setValue(file);
      }
    };

    setFile('LicenciaConstruccion.constanciaAlineamiento', files.LcConstanciaAlineamientoFile);
    setFile('LicenciaConstruccion.constanciaNumero', files.LcConstanciaNumero);
    setFile('LicenciaConstruccion.fileLicenciaUsoSuelo', files.LcLicenciaUsoSueloFile);
    setFile('LicenciaConstruccion.filePlanoAutorizado', files.LcPlanoAutorizadoFile);
    setFile('LicenciaConstruccion.fileLicenciaFraccionamiento', files.LcLicenciaFraccionamientoFile);
    setFile('LicenciaConstruccion.ConstanciaPropietario', files.LcConstanciaPropietario);
    setFile('LicenciaConstruccion.Factibilidad', files.LcFactibilidad);
    setFile('LicenciaConstruccion.RecibosImpuestoPredial', files.LcRecibosImpuestoPredial);
    setFile('LicenciaConstruccion.JuegoDePlanosArquitectonicos1', files.LcJuegoDePlanosArquitectonicos1);
    setFile('LicenciaConstruccion.JuegoDePlanosArquitectonicos2', files.LcJuegoDePlanosArquitectonicos2);
    setFile('LicenciaConstruccion.JuegoDePlanosArquitectonicos3', files.LcJuegoDePlanosArquitectonicos3);
    setFile('LicenciaConstruccion.otros', files.LcOtrosDocs);
    setFile('LicenciaConstruccion.FirmaPropietario', files.LcFirmaPropietario);
    setFile('LicenciaConstruccion.FirmaDRO', files.LcFirmaDRO);
    setFile('LicenciaConstruccion.FirmaCorresponsable', files.LcFirmaCorresponsable);
    setFile(
      'LicenciaConstruccion.FirmaResponsableRecepcionDocumento',
      files.LcFirmaResponsableRecepcionDocumento,
    );
    // Transversales (también con PredioObra=1) — nombres exactos Untitled / swagger
    const fachada =
      files.FachadaEstablecimiento ??
      this.archivosSeleccionados.FachadaEstablecimiento ??
      null;
    const bodega = files.Bodega ?? this.archivosSeleccionados.Bodega ?? null;
    const estacionamiento =
      files.EstacionamientoIMG ?? this.archivosSeleccionados.EstacionamientoIMG ?? null;
    setFile('Licencias.fachada', fachada);
    setFile('Licencias.bodega', bodega);
    setFile('Licencias.estacionamiento', estacionamiento);

    return form;
  }

  private valorDocumentoEnvio(form: FormGroup, controlName: string): File | string {
    const delForm = resolverValorDocumentoFormData(form.get(controlName)?.value);
    if (delForm instanceof File) {
      return delForm;
    }
    const desdePre = this.archivoPreRegistroPorControl(controlName);
    if (desdePre instanceof File) {
      return desdePre;
    }
    return delForm;
  }

  private archivoPreRegistroPorControl(controlName: string): File | null {
    const files = this.preRegistroState.peekFiles();
    const mapa: Record<string, File | null | undefined> = {
      'Licencias.fachada': files.FachadaEstablecimiento ?? this.archivosSeleccionados.FachadaEstablecimiento,
      'Licencias.bodega': files.Bodega ?? this.archivosSeleccionados.Bodega,
      'Licencias.estacionamiento':
        files.EstacionamientoIMG ?? this.archivosSeleccionados.EstacionamientoIMG,
      'LicenciaConstruccion.constanciaAlineamiento': files.LcConstanciaAlineamientoFile,
      'LicenciaConstruccion.constanciaNumero': files.LcConstanciaNumero,
      'LicenciaConstruccion.fileLicenciaUsoSuelo': files.LcLicenciaUsoSueloFile,
      'LicenciaConstruccion.filePlanoAutorizado': files.LcPlanoAutorizadoFile,
      'LicenciaConstruccion.fileLicenciaFraccionamiento': files.LcLicenciaFraccionamientoFile,
      'LicenciaConstruccion.ConstanciaPropietario': files.LcConstanciaPropietario,
      'LicenciaConstruccion.Factibilidad': files.LcFactibilidad,
      'LicenciaConstruccion.RecibosImpuestoPredial': files.LcRecibosImpuestoPredial,
      'LicenciaConstruccion.JuegoDePlanosArquitectonicos1': files.LcJuegoDePlanosArquitectonicos1,
      'LicenciaConstruccion.JuegoDePlanosArquitectonicos2': files.LcJuegoDePlanosArquitectonicos2,
      'LicenciaConstruccion.JuegoDePlanosArquitectonicos3': files.LcJuegoDePlanosArquitectonicos3,
      'LicenciaConstruccion.otros': files.LcOtrosDocs,
      'LicenciaConstruccion.FirmaPropietario': files.LcFirmaPropietario,
      'LicenciaConstruccion.FirmaDRO': files.LcFirmaDRO,
      'LicenciaConstruccion.FirmaCorresponsable': files.LcFirmaCorresponsable,
      'LicenciaConstruccion.FirmaResponsableRecepcionDocumento':
        files.LcFirmaResponsableRecepcionDocumento,
    };
    return mapa[controlName] ?? null;
  }

  abrirFormCorresponsable(): void {
    this.mostrandoFormCorresponsable = true;
  }

  cancelarFormCorresponsable(): void {
    this.limpiarDraftCorresponsable();
    this.mostrandoFormCorresponsable = this.corresponsables.length === 0;
  }

  confirmarCorresponsable(): void {
    const nombre = this.draftNombreCorresponsable.trim();
    if (!nombre) return;

    this.corresponsables = [
      ...this.corresponsables,
      {
        id: this.nextCorresponsableId++,
        nombre,
        noRegLicenciaConstruccion: this.draftNoRegCorresponsable.trim(),
        cedulaProfesional: this.draftCedulaCorresponsable.trim(),
      },
    ];

    this.limpiarDraftCorresponsable();
    this.mostrandoFormCorresponsable = false;
  }

  quitarCorresponsable(id: number): void {
    this.corresponsables = this.corresponsables.filter((c) => c.id !== id);
    if (!this.corresponsables.length) {
      this.mostrandoFormCorresponsable = true;
    }
  }

  private limpiarDraftCorresponsable(): void {
    this.draftNombreCorresponsable = '';
    this.draftNoRegCorresponsable = '';
    this.draftCedulaCorresponsable = '';
  }

  onDocumentoSeleccionado(controlName: string, file: File): void {
    if (controlName in this.docsChecklistFlags) {
      this.docsChecklistFlags[controlName] = file;
      this.documentosExistentes = {
        ...this.documentosExistentes,
        [controlName]: URL.createObjectURL(file),
      };
      return;
    }

    const key = DOC_CONTROL_TO_FILE_KEY[controlName];
    if (!key) {
      return;
    }

    (this.archivosSeleccionados as Record<string, File | null>)[key] = file;

    this.documentosExistentes = {
      ...this.documentosExistentes,
      [controlName]: URL.createObjectURL(file),
    };
    this.sincronizarArchivosEnEstado();
  }

  /** Guarda de inmediato Fachada/Bodega/Estacionamiento (y resto) en el state. */
  private sincronizarArchivosEnEstado(): void {
    this.preRegistroState.patchFiles({ ...this.archivosSeleccionados });
  }

  onDocumentoRechazado(_controlName: string): void {
    mostrarSwalError({
      title: 'Archivo no válido',
      text: 'Solo se permiten imágenes PNG, JPG o JPEG, o PDF (máx. 3 MB).',
    });
  }

  verDocumentoExistente(
    doc: DocumentoLocalConfig | { titulo: string; controlName: string },
    event?: { url: string; fileName: string }
  ): void {
    const url = event?.url?.trim() || this.documentosExistentes[doc.controlName];
    if (!url) {
      return;
    }

    const data: SubirDocumentoData = {
      titulo: doc.titulo,
      controlName: doc.controlName,
      urlExistente: url,
      licenciaCargada: true,
      soloLectura: true,
    };

    this.dialog.open(SubirDocumentoModalComponent, {
      width: 'min(720px, 95vw)',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'documento-modal-panel',
      autoFocus: false,
      data,
    });
  }

  onFirmaPointerDown(key: FirmaKey, event: PointerEvent): void {
    let pad = this.firmaPads[key];
    if (!pad?.canvas) return;
    // Si el pad se midió oculto (ancho 0), redimensionar al primer toque
    if (pad.canvas.getBoundingClientRect().width < 8) {
      this.setupFirmaPad(key, pad.canvas);
      pad = this.firmaPads[key];
      if (!pad) return;
    }
    this.marcarFirmaEditada(key);
    event.preventDefault();
    pad.canvas.setPointerCapture?.(event.pointerId);
    const point = this.firmaPoint(pad.canvas, event);
    pad.drawing = true;
    this.firmasConTrazo[key] = true;
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
    this.marcarFirmaEditada(key);
    this.firmasConTrazo[key] = false;
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

  private marcarFirmaEditada(key: FirmaKey): void {
    if (this.firmasEditadas[key]) {
      return;
    }
    this.firmasEditadas = { ...this.firmasEditadas, [key]: true };
  }

  private registrarCanvasFirma(key: FirmaKey, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.firmaPads[key] = {
      canvas,
      ctx,
      drawing: false,
      lastX: 0,
      lastY: 0,
    };
    if (this.mostrarApartadoObra) {
      this.setupFirmaPad(key, canvas);
    }
  }

  private setupFirmaPad(key: FirmaKey, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // No medir ni fijar tamaño mientras el paso de obra está oculto
    if (!this.mostrarApartadoObra) {
      this.firmaPads[key] = {
        canvas,
        ctx,
        drawing: false,
        lastX: 0,
        lastY: 0,
      };
      return;
    }

    // CSS manda el tamaño visual (100% del contenedor); el bitmap usa DPR
    canvas.style.width = '100%';
    canvas.style.height = '160px';
    canvas.style.maxWidth = '100%';
    canvas.style.boxSizing = 'border-box';

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height || 160));

    if (width < 8) {
      this.firmaPads[key] = {
        canvas,
        ctx,
        drawing: false,
        lastX: 0,
        lastY: 0,
      };
      return;
    }

    const prev = this.firmaPads[key];
    const sameSize =
      !!prev &&
      prev.canvas === canvas &&
      canvas.width === width * ratio &&
      canvas.height === height * ratio;

    // Evita borrar el trazo al re-inicializar al volver al paso de obra
    if (sameSize && this.firmasConTrazo[key]) {
      this.firmaPads[key] = {
        canvas,
        ctx,
        drawing: false,
        lastX: 0,
        lastY: 0,
      };
      return;
    }

    let backup: ImageData | null = null;
    if (this.firmasConTrazo[key] && canvas.width > 0 && canvas.height > 0) {
      try {
        backup = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        backup = null;
      }
    }

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';

    if (backup) {
      try {
        const tmp = document.createElement('canvas');
        tmp.width = backup.width;
        tmp.height = backup.height;
        const tmpCtx = tmp.getContext('2d');
        tmpCtx?.putImageData(backup, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff';
      } catch {
        // si falla el restore, el usuario puede volver a firmar
      }
    } else {
      this.restaurarFirmaDesdeArchivo(key, canvas, ctx, ratio);
    }

    this.firmaPads[key] = {
      canvas,
      ctx,
      drawing: false,
      lastX: 0,
      lastY: 0,
    };
  }

  /** Restaura firma guardada en state/archivos al reabrir el paso de obra. */
  private restaurarFirmaDesdeArchivo(
    key: FirmaKey,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    ratio: number
  ): void {
    const mapa: Record<FirmaKey, keyof PreRegistroFilesState> = {
      propietario: 'LcFirmaPropietario',
      director: 'LcFirmaDRO',
      corresponsable: 'LcFirmaCorresponsable',
      recepcion: 'LcFirmaResponsableRecepcionDocumento',
    };
    const file =
      this.archivosSeleccionados[mapa[key]] ||
      this.preRegistroState.peekFiles()[mapa[key]];
    if (!(file instanceof File)) {
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#ffffff';
        this.firmasConTrazo[key] = true;
        this.firmasEditadas[key] = true;
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  private firmaPoint(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  redirigirLista(): void {
    this.preRegistroState.clear();
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
      idRegistro: this.idRegistro,
    };
    const destino = this.idRegistro
      ? `/local-comercial/actualizar-local-comercial/${this.idRegistro}`
      : '/local-comercial/alta-local-comercial';
    this.router.navigateByUrl(destino, { state });
  }

  private persistirEstadoPreRegistro(): void {
    const firmas = this.exportarFirmasComoArchivos();
    const prevFiles = this.preRegistroState.peekFiles();
    // No pisar firmas previas con null al cambiar de paso sin redibujar
    const files: PreRegistroFilesState = {
      ...prevFiles,
      ...this.archivosSeleccionados,
      ...(firmas.propietario ? { LcFirmaPropietario: firmas.propietario } : {}),
      ...(firmas.director ? { LcFirmaDRO: firmas.director } : {}),
      ...(firmas.corresponsable ? { LcFirmaCorresponsable: firmas.corresponsable } : {}),
      ...(firmas.recepcion
        ? { LcFirmaResponsableRecepcionDocumento: firmas.recepcion }
        : {}),
    };

    const tieneFile = (f: File | null | undefined) => f instanceof File && !!f.name;
    const tieneFlag = (key: string) => tieneFile(this.docsChecklistFlags[key]);

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
        LcClaveCatastral: this.claveCatastral,
        LcSuperficieTerrenoM2: this.superficieTerrenoM2,
        LcSuperficieTerrenoObraM2: this.superficieTerrenoObraM2,
        LcDescripcionSistemaConstructivo: this.descripcionSistemaConstructivo,
        LcNombrePropietario: this.propietarioNombre,
        LcDomicilioNotificacion: this.ubicacionConstruccion || this.direccionSeleccionada,
        LcRFC: this.propietarioRfc,
        LcNombreDRO: this.directorNombre,
        LcNoRegLicenciaConstruccion: this.directorLicencia,
        LcCedulaProfesional: this.directorCedula || this.directorLicencia,
        LcFecha: toDateInputValue(this.fechaLicenciaConstruccion) || this.fechaLicenciaConstruccion,
        LcNumeroExpediente: this.numeroExpediente,
        LcNumeroControl: this.numeroControl,
        LcSeguimientoObra: this.seguimientoObra,
        LcConstanciaAlineamiento: tieneFile(files.LcConstanciaAlineamientoFile) || tieneFile(files.LcConstanciaNumero) ? 1 : 0,
        LcLicenciaUsoSuelo: tieneFile(files.LcLicenciaUsoSueloFile) ? 1 : 0,
        LcPlanoAutorizado: tieneFile(files.LcPlanoAutorizadoFile) ? 1 : 0,
        LcLicenciaFraccionamiento: tieneFile(files.LcLicenciaFraccionamientoFile) ? 1 : 0,
        LcEscrituras: tieneFlag('escrituras') ? 1 : 0,
        LcFactibilidadAguaPotable: tieneFile(files.LcFactibilidad) ? 1 : 0,
        LcRecibosPagoPredial: tieneFile(files.LcRecibosImpuestoPredial) ? 1 : 0,
        LcRecibosMunicipales: tieneFlag('recibosMunicipales') ? 1 : 0,
        LcPlanoArquitectonicos:
          tieneFile(files.LcJuegoDePlanosArquitectonicos1) ||
          tieneFile(files.LcJuegoDePlanosArquitectonicos2) ||
          tieneFile(files.LcJuegoDePlanosArquitectonicos3)
            ? 1
            : 0,
        LcOtros: tieneFile(files.LcOtrosDocs) ? 1 : 0,
        LcCorresponsables: this.corresponsables.map((c) => ({
          // POST no envía Id; se conserva para PATCH
          Id: c.idApi ?? null,
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
      // Si solo está la firma remota (sin editar), no reenviar archivo
      if (!this.firmasConTrazo[key]) {
        resultado[key] = null;
        return;
      }
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
