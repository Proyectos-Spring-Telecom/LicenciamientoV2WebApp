// @ts-nocheck
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { localFormTabPanelAnimation, proteccionEmpresaFieldsAnimation } from '../../animations/local-form-tab-panel.animation';
import { DetalleLocal, proteccionCivil } from '../../models/detalle-local-comercial';
import { LocalComercial } from '../../models/local-comercial';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormGenerico } from '../../models/form-generico';
import { LocalComercialService } from '../../services/local-comercial.service';
import { SepomexService } from '../../services/sepomex.service';
import { SepomexColonia } from '../../models/sepomex-codigo-postal';
import { ListaRol } from '../../models/Catalogos/roles';
import { ListaGrupo } from '../../models/Catalogos/grupo'
import { ListaTipoFoto } from '../../models/Catalogos/tipoFoto'
import { listaTipoServicio } from '../../models/Catalogos/tipoServicio';
import { ListaEstatus } from '../../models/Catalogos/estatus';
import { ListaGiro } from '../../models/Catalogos/giro';
import { User } from 'src/app/entities/User';
import { SeleccionUbicacionModalComponent } from './seleccion-ubicacion-modal/seleccion-ubicacion-modal.component';
import {
  SubirDocumentoModalComponent,
  SubirDocumentoData
} from './subir-documento-modal/subir-documento-modal.component';
import {
  DOCUMENTOS_CATASTRAL,
  DOCUMENTOS_LICENCIAMIENTO,
  DOCUMENTOS_PROTECCION,
  DOCUMENTOS_SAPAC,
  DocumentoLocalConfig,
  mapFotosToUrls,
  resolverIdCatalogoDesdeApi,
  resolverValorDocumentoFormData,
  tieneCoordenadasValidas,
  toDateInputValue,
} from '../../utils/documentos-local.config';
import {
  mostrarAlertaCamposObligatorios,
  mostrarCargandoLocalComercial,
  mostrarSwalCodigoPostalNoEncontrado,
  mostrarSwalError,
  mostrarSwalExito,
  ocultarCargandoLocalComercial,
} from '../../utils/local-comercial-swal.util';
import {
  buildLocalComercialFormData,
  createRegistrosFormGroup,
  generarJsonEnvioLocalComercial,
  mapPredioObra,
  mapTipoRegistro,
} from '../../utils/local-comercial-form-payload.util';
import { mapDocumentosFromRegistro, mapRegistroToFormPatch, unwrapRegistroResponse } from '../../utils/map-registro-api.util';
import {
  blockNonAlphanumericKey,
  blockNonNumericKey,
  sanitizeNumericValue,
  sanitizeRfcValue,
} from '../../utils/local-form-input.util';
import { LayoutScrollService } from 'src/app/services/layout-scroll.service';
import { PreRegistroStateService } from '../../services/pre-registro-state.service';


@Component({
  selector: 'app-local-comercial-formulario',
  templateUrl: './local-comercial-formulario.component.html',
  styleUrls: ['./local-comercial-formulario.component.css', '../../styles/local-form-tabs.css'],
  animations: [routeAnimation, localFormTabPanelAnimation, proteccionEmpresaFieldsAnimation],
  standalone: false,
})
export class LocalComercialFormularioComponent implements OnInit {
  public nombreCompleto: any;
  public titulo: string = 'Agregar Local Comercial';
  public title: string = 'Licenciamiento';
  readonly blockNonAlphanumericKey = blockNonAlphanumericKey;
  readonly blockNonNumericKey = blockNonNumericKey;
  public activeTab = 0;
  public activeTabPanelMinHeight = 0;
  private shouldScrollAfterTabNav = false;
  public readonly localFormTabCount = 4;
  readonly tabHeaders = [
    {
      title: 'Sapac',
      shortLabel: 'Sapac',
      subtitle: 'Sistema de Agua Potable y Alcantarillado',
      css: 'local-tab-header--sapac',
      icon: 'water_drop',
      accent: 'sapac',
    },
    {
      title: 'Catastral',
      shortLabel: 'Catastral',
      subtitle: 'Predial de Cuernavaca',
      css: 'local-tab-header--catastral',
      icon: 'map',
      accent: 'catastral',
    },
    {
      title: 'Licenciamiento',
      shortLabel: 'Licencia',
      subtitle: 'Licencias de Funcionamiento de Establecimientos Comerciales',
      css: 'local-tab-header--licenciamiento',
      icon: 'storefront',
      accent: 'licenciamiento',
    },
    {
      title: 'Protección Civil',
      shortLabel: 'Protección',
      subtitle: 'Coordinación estatal de protección civil Morelos',
      css: 'local-tab-header--proteccion',
      icon: 'health_and_safety',
      accent: 'proteccion',
    },
  ] as const;
  @ViewChild('tabPanels') tabPanelsRef: ElementRef<HTMLElement>;
  @ViewChild('formTop') formTopRef: ElementRef<HTMLElement>;
  public localesRegistros: LocalComercial[];
  public localForm: FormGroup;
  public detalleLocal: DetalleLocal[];

  /**Sapac */
  public estadosRegistros: FormGenerico[];
  public municipiosRegistros: FormGenerico[];
  public localidadesRegistros: FormGenerico[];
  public coloniasRegistros: FormGenerico[];
  public callesRegistros: FormGenerico[];
  public coloniasSepomex: SepomexColonia[] = [];
  /**Licenciamiento */
  public estadoRegistros: FormGenerico[];
  public municipioRegistros: FormGenerico[];
  public localidadeRegistros: FormGenerico[];
  public coloniaRegistros: FormGenerico[];
  public calleRegistros: FormGenerico[];
  public detalle: User;

  public roles: ListaRol[];
  public grupo: ListaGrupo[];
  public foto: ListaTipoFoto[];
  public tipos: listaTipoServicio[];
  public estatus: ListaEstatus[];
  public giros: ListaGiro[];


  public tipoPersona: any[] = [{ valor: 1, tipo: 'Fisica' }, { valor: 2, tipo: 'Moral' }];
  public esMoral: boolean = false;
  public estacionamiento: any[] = [{ valor: true, tipo: 'Si' }, { valor: false, tipo: 'No' },];
  public estacion: boolean = false;
  public tipoEmpresa: any[] = [{ valor: true, tipo: 'Si' }, { valor: false, tipo: 'No' },];
  public empresa: boolean = false;
  public tipoPrograma: any[] = [{ valor: true, tipo: 'Si' }, { valor: false, tipo: 'No' },];
  public programa: boolean = false;

  public _user: any;
  public loading: boolean = false;
  public addCalle: boolean = false;
  public addCalleLicencia: boolean = false;
  public noSelect: boolean = false;
  public fisica: boolean = true;
  public btnCuadroMedidor: boolean = false;
  public btnFachada: boolean = false;
  public btnBodega: boolean = false;
  public btnEstacionamiento: boolean = false;
  public tieneprograma;
  public tieneestacionamiento;

  public value;
  public idLocalidadGeneral;
  public idColoniaGeneral;
  public calleLicenciaTemp;

  public idLocalidadLicencia;
  public idColoniaLicenciaV;
  public idObtenerColoniasLicencias;
  public idObtenerLocalidadesLicencia;
  public idCalleLicenciaV;
  public idObtenerCallesLicencia;
  public nombreObtenerLocalidadesLicencia;
  public id: any;
  public idLocalMod: any;
  public param: any;
  Swal: any;
  private _gap = 16;
  col2 = `1 1 calc(50% - ${this._gap / 2}px)`;

  botonSuccess = 'Guardar';
  loadIndicatorVisible = false;
  public primerSpan = true;
  public validSpan = true;
  public iconSuccess = true;
  public botonValid = 'Guardar';
  public primerIcon = true;
  submitted = false;
  loadingg = false;
  public documentosExistentes: Record<string, string> = {};
  readonly documentosSapac = DOCUMENTOS_SAPAC;
  readonly documentosCatastral = DOCUMENTOS_CATASTRAL;
  readonly documentosLicenciamiento = DOCUMENTOS_LICENCIAMIENTO.filter(
    (doc) => doc.controlName === 'Licencias.licenciaFuncionamiento'
  );
  readonly documentosProteccion = DOCUMENTOS_PROTECCION;
  readonly OTRO_ID = ' ';
  private cargandoDireccionEdicion = false;
  private sincronizandoDireccion = false;

  /** Flujo pre-registro → alta: para regresar a Tipo de Local o Finalización (obra). */
  public vieneDePreRegistro = false;
  public predioEnObraPreRegistro = false;
  private static readonly PRE_REGISTRO_STORAGE_KEY = 'lc.preRegistro';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private localComercialService: LocalComercialService,
    private sepomexService: SepomexService,
    private layoutScroll: LayoutScrollService,
    private preRegistroState: PreRegistroStateService) {
    this.cargarEstadoPreRegistro(
      this.router.getCurrentNavigation()?.extras?.state ?? history.state ?? null
    );
  }

  get activeTabHeader() {
    return this.tabHeaders[this.activeTab] ?? this.tabHeaders[0];
  }

  setActiveTab(index: number): void {
    if (index >= 0 && index < this.localFormTabCount && index !== this.activeTab) {
      this.reservarAlturaTabPanels();
      this.activeTab = index;
    }
  }

  onTabPanelAnimationDone(): void {
    this.activeTabPanelMinHeight = 0;
    if (this.shouldScrollAfterTabNav) {
      this.shouldScrollAfterTabNav = false;
      this.scrollFormToTop();
    }
  }

  private reservarAlturaTabPanels(): void {
    const panels = this.tabPanelsRef?.nativeElement;
    if (panels) {
      this.activeTabPanelMinHeight = panels.offsetHeight;
    }
  }

  nextTab(): void {
    if (this.activeTab < this.localFormTabCount - 1) {
      this.reservarAlturaTabPanels();
      this.shouldScrollAfterTabNav = true;
      this.activeTab++;
      this.scrollFormToTop();
    }
  }

  prevTab(): void {
    if (this.activeTab > 0) {
      this.reservarAlturaTabPanels();
      this.shouldScrollAfterTabNav = true;
      this.activeTab--;
      this.scrollFormToTop();
    }
  }

  private scrollFormToTop(): void {
    const goTop = () => this.layoutScroll.scrollToTop('auto');
    goTop();
    queueMicrotask(goTop);
    requestAnimationFrame(goTop);
    setTimeout(goTop, 0);
    setTimeout(goTop, 50);
    setTimeout(goTop, 150);
    setTimeout(goTop, 300);
  }

  private cargarEstadoPreRegistro(state: any): void {
    const stored = this.preRegistroState.peekScalar();
    const data = state?.preRegistro ? state : stored;
    if (!data?.preRegistro) {
      this.vieneDePreRegistro = false;
      this.predioEnObraPreRegistro = false;
      return;
    }

    this.vieneDePreRegistro = true;
    this.predioEnObraPreRegistro = !!data.predioEnObra;
  }

  private aplicarDatosPreRegistroAlFormulario(): void {
    const data = this.preRegistroState.peekScalar();
    if (!data?.preRegistro || !this.localForm) {
      return;
    }

    const files = this.preRegistroState.peekFiles();
    this.localForm.patchValue({
      Latitud: data.lat ?? '',
      Longitud: data.lng ?? '',
      TipoRegistro: Number(mapTipoRegistro(data.tipoRegistro ?? 0) || '0'),
      PredioObra: Number(mapPredioObra(data.predioEnObra ?? 0)),
      EntidadFederativa: data.EntidadFederativa ?? '',
      Municipio: data.Municipio ?? '',
      Localidad: data.Localidad ?? '',
      Colonia: data.Colonia ?? '',
      Calle: data.Calle ?? '',
      NoInterior: data.NoInterior ?? '',
      NoExterior: data.NoExterior ?? '',
      CP: data.CP ?? '',
      LicenciaConstruccion: {
        TipoSolicitudLicencia: data.LcTipoSolicitudLicencia ?? '',
        DescripcionProyecto: data.LcDescripcionProyecto ?? '',
        SuperficieTerrenoM2: data.LcSuperficieTerrenoM2 ?? '',
        SuperficieTerrenoObraM2: data.LcSuperficieTerrenoObraM2 ?? '',
        DescripcionSistemaConstructivo: data.LcDescripcionSistemaConstructivo ?? '',
        NombrePropietario: data.LcNombrePropietario ?? '',
        DomicilioNotificacion: data.LcDomicilioNotificacion ?? data.direccion ?? '',
        RFC: data.LcRFC ?? '',
        NombreDRO: data.LcNombreDRO ?? '',
        NoRegLicenciaConstruccion: data.LcNoRegLicenciaConstruccion ?? '',
        CedulaProfesional: data.LcCedulaProfesional ?? '',
        Fecha: data.LcFecha ?? '',
        NumeroExpediente: data.LcNumeroExpediente ?? '',
        NumeroControl: data.LcNumeroControl ?? '',
        SeguimientoObra: data.LcSeguimientoObra ?? '',
        ConstanciaAlineamiento: data.LcConstanciaAlineamiento ?? '',
        LicenciaUsoSuelo: data.LcLicenciaUsoSuelo ?? '',
        PlanoAutorizado: data.LcPlanoAutorizado ?? '',
        LicenciaFraccionamiento: data.LcLicenciaFraccionamiento ?? '',
        Escrituras: data.LcEscrituras ?? '',
        FactibilidadAguaPotable: data.LcFactibilidadAguaPotable ?? '',
        RecibosPagoPredial: data.LcRecibosPagoPredial ?? '',
        RecibosMunicipales: data.LcRecibosMunicipales ?? '',
        PlanoArquitectonicos: data.LcPlanoArquitectonicos ?? '',
        Otros: data.LcOtros ?? '',
        constanciaAlineamientoyNumero: files.LcConstanciaAlineamientoyNumero ?? [],
        LicenciaUsoyPlano: files.LcLicenciaUsoyPlano ?? [],
        ConstanciaPropietario: files.LcConstanciaPropietario ?? [],
        Factibilidad: files.LcFactibilidad ?? [],
        RecibosImpuestoPredial: files.LcRecibosImpuestoPredial ?? [],
        JuegoDePlanosArquitectonicos: files.LcJuegoDePlanosArquitectonicos ?? [],
        otros: files.LcOtrosDocs ?? [],
        FirmaPropietario: files.LcFirmaPropietario ?? '',
        FirmaDRO: files.LcFirmaDRO ?? '',
        FirmaCorresponsable: files.LcFirmaCorresponsable ?? '',
        FirmaResponsableRecepcionDocumento: files.LcFirmaResponsableRecepcionDocumento ?? '',
      },
    });

    const mapaArchivos: Array<[keyof typeof files, string]> = [
      ['ReciboSapac', 'Sapac.reciboSapac'],
      ['CaratulaMedidor', 'Sapac.caratulamedidor'],
      ['CuadroMedidor', 'Sapac.cuadromedidor'],
      ['ReciboPredial', 'Catastro.reciboPredial'],
      ['LicenciaFuncionamiento', 'Licencias.licenciaFuncionamiento'],
      ['FachadaEstablecimiento', 'Licencias.fachada'],
      ['EstacionamientoIMG', 'Licencias.estacionamiento'],
      ['Bodega', 'Licencias.bodega'],
      ['VistoBueno', 'ProteccionCivil.vistoBueno'],
    ];
    mapaArchivos.forEach(([origen, path]) => {
      const file = files[origen];
      if (file instanceof File) {
        this.localForm.get(path)?.setValue(file);
        if (file.type.startsWith('image/')) {
          this.documentosExistentes[path] = URL.createObjectURL(file);
        }
      }
    });
  }

  get etiquetaBannerRegresar(): string {
    if (!this.vieneDePreRegistro) return 'Regresar';
    return this.predioEnObraPreRegistro ? 'Finalización del Trámite' : 'Tipo de Local';
  }

  onBannerRegresar(): void {
    if (this.vieneDePreRegistro) {
      this.volverAPreRegistro();
      return;
    }
    this.redirigir();
  }

  volverAPreRegistro(): void {
    const data = this.preRegistroState.peekScalar() ?? {
      preRegistro: true as const,
      predioEnObra: this.predioEnObraPreRegistro,
      lat: null,
      lng: null,
      direccion: '',
      tipoRegistro: 'comercial' as const,
    };

    this.router.navigateByUrl('/local-comercial/pre-alta-local-comercial', {
      state: {
        regreso: true,
        abrirApartadoObra: !!data.predioEnObra,
        preRegistro: true,
        predioEnObra: !!data.predioEnObra,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        direccion: data.direccion ?? '',
        tipoRegistro: data.tipoRegistro ?? 'comercial',
      },
    });
  }

  async ngOnInit() {
    this.initForm();
    this.aplicarDatosPreRegistroAlFormulario();
    this.activatedRoute.params.subscribe((param) => {
      this.id = param['id'];
      if (this.id) {
        this.titulo = 'Actualizar Local Comercial';
        this.vieneDePreRegistro = false;
        this.predioEnObraPreRegistro = false;
        this.preRegistroState.clear();
        this.obtenerLocalComercial(this.id);
        this.btnCuadroMedidor = true;
        this.btnFachada = true;
        this.btnBodega = true;
        this.btnEstacionamiento = true;
      }
    });
    await this.obtenerEstados();
    await this.obtenerMunicipios();
    await this.obtenerEstadosLicencia();
    await this.obtenerMunicipiosLicencia();

    //obtener Catalogos;
    this.obtenerServicios();
    this.obtenerTipoFoto();
    this.obtenerGiros();
    this.obtenerTipoPersona(this.id);
    this.obtenerTieneProgram();
  }

  initForm() {
    // Solo campos del body POST /registros (Untitled-1).
    this.localForm = createRegistrosFormGroup(this.fb);
  }

  obtenerLocalComercial(idRegistro: number) {
    this.cargandoDireccionEdicion = true;
    this.localComercialService.obtenerRegistroPorId(idRegistro).subscribe({
      next: (response) => {
        const result = unwrapRegistroResponse(response);
        const patch = mapRegistroToFormPatch(result);
        this.documentosExistentes = {
          ...mapFotosToUrls(result?.fotos ?? []),
          ...mapDocumentosFromRegistro(result),
        };
        this.localForm.patchValue(patch);

        const tipoPersona = Number(this.localForm.get('Licencias.TipoPersona')?.value);
        this.fisica = tipoPersona === 1 || tipoPersona === 0;

        const tienePrograma = this.localForm.get('ProteccionCivil.TienePrograma')?.value;
        this.tieneprograma =
          tienePrograma === true || tienePrograma === 1 || tienePrograma === '1' ? 'Sí' : 'No';

        const estacionamiento = this.localForm.get('Licencias.Estacionamiento')?.value;
        this.tieneestacionamiento =
          estacionamiento === true || estacionamiento === 1 || estacionamiento === '1' ? 'Sí' : 'No';

        const cp = String(this.localForm.get('CP')?.value ?? '').replace(/\D/g, '');
        if (cp.length === 5) {
          const coloniaActual = String(this.localForm.get('Colonia')?.value ?? '');
          this.sepomexService.obtenerPorCp(cp).subscribe({
            next: (res) => {
              this.coloniasSepomex = Array.isArray(res?.colonias) ? res.colonias : [];
              this.localForm.patchValue(
                {
                  EntidadFederativa:
                    this.localForm.get('EntidadFederativa')?.value || res?.estado?.nombre || '',
                  Municipio: this.localForm.get('Municipio')?.value || res?.municipio?.nombre || '',
                  Colonia: coloniaActual,
                },
                { emitEvent: false }
              );
            },
            error: (err) => {
              this.coloniasSepomex = [];
              mostrarSwalCodigoPostalNoEncontrado(err, cp);
            },
          });
        }

        setTimeout(() => {
          this.cargandoDireccionEdicion = false;
        }, 300);
      },
      error: () => {
        this.cargandoDireccionEdicion = false;
      },
    });
  }

  changeValue(checked) {
    this.localForm.get('ProteccionCivil.EsEmpresa')?.setValue(checked ? 1 : 0);
  }

  checkedBox() {
    const local = this.localForm.get('ProteccionCivil.EsEmpresa')?.value;
    return local == true || local === 1 || local === '1';
  }

  obtenerEstadosLicencia() {
    this.localComercialService.obtenerEstados().subscribe(
      (res: FormGenerico[]) => {
        this.estadoRegistros = res;
      },
      (err) => { }
    );
  }

  obtenerMunicipiosLicencia(_aplicarDefault = true) {
    this.localComercialService.obtenerMunicipiosEstado().subscribe(
      (res: FormGenerico[]) => {
        this.municipioRegistros = res;
        if (!this.cargandoDireccionEdicion) {
          this.municipiosRegistros = [...this.municipioRegistros];
        }
      },
      (err) => { }
    );
  }

  obtenerTipoPersona(_id?) {
    const tipoPersona = Number(this.localForm?.get('Licencias.TipoPersona')?.value);
    this.fisica = tipoPersona === 1 || tipoPersona === 0 || Number.isNaN(tipoPersona);
  }

  obtenerTieneProgram() {
    const tienePrograma = this.localForm?.get('ProteccionCivil.TienePrograma')?.value;
    this.tieneprograma =
      tienePrograma === true || tienePrograma === 1 || tienePrograma === '1' ? 'Sí' : 'No';
  }

  obtenerEstacionamiento() {
    const estacionamiento = this.localForm?.get('Licencias.Estacionamiento')?.value;
    this.tieneestacionamiento =
      estacionamiento === true || estacionamiento === 1 || estacionamiento === '1' ? 'Sí' : 'No';
  }

  obtenerTipoPersonaSelect(value) {
    if (value === 1 || value === 0) {
      this.fisica = true;
    }
    if (value === 2) {
      this.fisica = false;
    }
  }

  agregarCalleLicencia() {
    this.addCalleLicencia = true;
  }
  /**Fin ubicaciones */

  /**Registrar Local Comercial */
  agregarLocal() {
    this.sincronizarCamposRaizAntesDeEnviar();
    this.loadIndicatorVisible = true;
    this.botonSuccess = 'Enviando...'
    const opciones = this.opcionesPayloadRegistros();
    const formData = buildLocalComercialFormData(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      opciones,
      (controlName) => this.valorDocumentoMultiple(controlName)
    );
    generarJsonEnvioLocalComercial(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      'agregar',
      opciones,
      (controlName) => this.valorDocumentoMultiple(controlName)
    );
    mostrarCargandoLocalComercial('Guardando local comercial');
      this.localComercialService.agregarLocalComercial(formData).subscribe(
        () => {
          ocultarCargandoLocalComercial(() => {
            mostrarSwalExito({
              title: '¡Operación exitosa!',
              text: '¡Se ha agregado de manera exitosa el local comercial!',
            });
            this.redirigir();
          });
        },
        () => {
          ocultarCargandoLocalComercial(() => {
            mostrarSwalError({
              title: '¡Ops!',
              text: '¡Error al agregar el local!',
            });
            this.loadIndicatorVisible = false;
            this.botonSuccess = 'Guardar';
            this.primerIcon = true;
            this.loading = false;
          });
        }
      );
  }

  /**Actualizar local */
  actualizarLocal() {
    this.sincronizarCamposRaizAntesDeEnviar();
    this.loading = true;
    const formData = buildLocalComercialFormData(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      this.opcionesPayloadRegistros(),
      (controlName) => this.valorDocumentoMultiple(controlName)
    );
    mostrarCargandoLocalComercial('Actualizando local comercial');
      this.localComercialService.actualizarLocal(formData).subscribe(
        () => {
          ocultarCargandoLocalComercial(() => {
            mostrarSwalExito({
              title: '¡Operación exitosa!',
              html: '¡Los datos de la <b>Licencia</b> se han modificado de manera exitosa!',
            });
            this.redirigir();
          });
        },
        () => {
          ocultarCargandoLocalComercial(() => {
            mostrarSwalError({
              title: '¡Ops!',
              text: '¡Error al intentar modificar los datos del local!',
            });
            this.loadIndicatorVisible = false;
            this.botonSuccess = 'Guardar';
            this.primerIcon = true;
            this.loading = false;
          });
        }
      );
  }

  redirigir() {
    this.preRegistroState.clear();
    this.router.navigateByUrl('/local-comercial/lista-local-comercial');
  }

  onDocumentoSeleccionado(controlName: string, archivo: File): void {
    const control = this.localForm.get(controlName);
    control.setValue(archivo);
    control.setErrors(null);
    if (archivo.type.startsWith('image/')) {
      this.documentosExistentes[controlName] = URL.createObjectURL(archivo);
    }
  }

  onDocumentoRechazado(_controlName: string): void {
    mostrarSwalError({
      title: 'Archivo no válido',
      text: 'Seleccione una imagen o PDF compatible.',
    });
  }

  verDocumentoExistente(doc: DocumentoLocalConfig): void {
    const url = this.documentosExistentes[doc.controlName];
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
      width: '720px',
      maxWidth: '95vw',
      panelClass: 'documento-modal-panel',
      data,
    });
  }

  private valorDocumento(controlName: string): File | string {
    return resolverValorDocumentoFormData(this.localForm.get(controlName)?.value);
  }

  private valorDocumentoMultiple(controlName: string): Array<File | string> {
    const valor = this.localForm.get(controlName)?.value;
    if (Array.isArray(valor)) {
      return valor.filter((item) => item instanceof File || (typeof item === 'string' && item.trim()));
    }
    if (valor instanceof File) {
      return [valor];
    }
    if (typeof valor === 'string' && valor.trim()) {
      return [valor];
    }
    return [];
  }

  /** Completa Latitud/Longitud/TipoRegistro/PredioObra antes de enviar. */
  private sincronizarCamposRaizAntesDeEnviar(): void {
    const v = (campo: string) => this.localForm.get(campo)?.value;
    const patch: Record<string, unknown> = {};

    if (!v('Licencias.FechaHora')) {
      patch['Licencias'] = {
        ...(this.localForm.get('Licencias')?.value || {}),
        FechaHora: new Date(),
      };
    }
    if (v('PredioObra') === '' || v('PredioObra') == null) {
      patch['PredioObra'] = Number(mapPredioObra(this.predioEnObraPreRegistro));
    }
    if (v('TipoRegistro') === '' || v('TipoRegistro') == null) {
      const stored = this.preRegistroState.peekScalar();
      patch['TipoRegistro'] = Number(mapTipoRegistro(stored?.tipoRegistro ?? 0) || '0');
    }

    // Giro: nombre string desde catálogo si el select aún usa id temporalmente
    const giroCtrl = this.localForm.get('Licencias.Giro');
    const giroVal = giroCtrl?.value;
    if (giroVal != null && giroVal !== '' && !Number.isNaN(Number(giroVal))) {
      const nombre = this.giros?.find((g) => String(g.id) === String(giroVal))?.nombre;
      if (nombre) {
        patch['Licencias'] = {
          ...(patch['Licencias'] as object || this.localForm.get('Licencias')?.value || {}),
          Giro: nombre,
        };
      }
    }

    if (Object.keys(patch).length) {
      this.localForm.patchValue(patch);
    }
  }

  private opcionesPayloadRegistros(): Record<string, never> {
    return {};
  }

  private tieneValorObligatorio(valor: unknown): boolean {
    return valor !== null && valor !== undefined && String(valor).trim() !== '';
  }

  private prepararValidacionObligatoria(): void {
    ['Latitud', 'Longitud', 'TipoRegistro', 'PredioObra'].forEach((campo) => {
      this.localForm.get(campo)?.markAsTouched();
    });
  }

  private obtenerCamposObligatoriosFaltantes(): string[] {
    const faltantes: string[] = [];
    const lat = this.localForm.get('Latitud')?.value;
    const lng = this.localForm.get('Longitud')?.value;
    const tipoRegistro = this.localForm.get('TipoRegistro')?.value;
    const predioObra = this.localForm.get('PredioObra')?.value;

    if (!tieneCoordenadasValidas(lat, lng)) {
      if (!this.tieneValorObligatorio(lat)) {
        faltantes.push('Latitud');
      }
      if (!this.tieneValorObligatorio(lng)) {
        faltantes.push('Longitud');
      }
      if (this.tieneValorObligatorio(lat) && this.tieneValorObligatorio(lng)) {
        faltantes.push('Ubicación (Latitud / Longitud)');
      }
    }
    if (!this.tieneValorObligatorio(tipoRegistro)) {
      faltantes.push('TipoRegistro');
    }
    if (!this.tieneValorObligatorio(predioObra) && predioObra !== 0 && predioObra !== false) {
      faltantes.push('PredioObra');
    }

    return faltantes;
  }

  private validarCamposObligatorios(): boolean {
    this.prepararValidacionObligatoria();
    return this.obtenerCamposObligatoriosFaltantes().length === 0;
  }

  submit() {
    this.sincronizarCamposRaizAntesDeEnviar();
    generarJsonEnvioLocalComercial(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      'agregar',
      this.opcionesPayloadRegistros(),
      (controlName) => this.valorDocumentoMultiple(controlName)
    );

    this.submitted = true;
    this.loadIndicatorVisible = false;
    this.primerIcon = true;
    this.botonSuccess = 'Guardar';
    this.primerSpan = true;
    this.validSpan = true;

    const latActual = this.localForm.get('Latitud')?.value;
    const lngActual = this.localForm.get('Longitud')?.value;

    // Si ya hay coordenadas del pre-registro, validar solo los 4 obligatorios y enviar
    if (tieneCoordenadasValidas(latActual, lngActual) && this.vieneDePreRegistro) {
      this.localForm.patchValue({
        Latitud: latActual,
        Longitud: lngActual,
        Licencias: {
          ...(this.localForm.get('Licencias')?.value || {}),
          FechaHora: this.localForm.get('Licencias.FechaHora')?.value || new Date(),
        },
      });
      this.sincronizarCamposRaizAntesDeEnviar();
      if (!this.validarCamposObligatorios()) {
        mostrarAlertaCamposObligatorios(this.obtenerCamposObligatoriosFaltantes());
        return;
      }
      this.loadIndicatorVisible = true;
      this.botonSuccess = 'Enviando...';
      this.primerIcon = false;
      this.agregarLocal();
      this.validSpan = false;
      return;
    }

    const dialogRef = this.dialog.open(SeleccionUbicacionModalComponent, {
      width: '95vw',
      maxWidth: '960px',
      maxHeight: '95vh',
      panelClass: 'ubicacion-modal-panel',
      autoFocus: false,
      disableClose: true,
      data: {
        lat: latActual,
        lng: lngActual
      }
    });

    dialogRef.afterClosed().subscribe((ubicacion) => {
      if (!ubicacion) {
        return;
      }

      this.localForm.patchValue({
        Latitud: ubicacion.lat,
        Longitud: ubicacion.lng,
        Licencias: {
          ...(this.localForm.get('Licencias')?.value || {}),
          FechaHora: this.localForm.get('Licencias.FechaHora')?.value || new Date(),
        },
      });
      this.sincronizarCamposRaizAntesDeEnviar();

      if (!this.validarCamposObligatorios()) {
        mostrarAlertaCamposObligatorios(this.obtenerCamposObligatoriosFaltantes());
        return;
      }

      this.loadIndicatorVisible = true;
      this.botonSuccess = 'Enviando...';
      this.primerIcon = false;
      this.agregarLocal();
      this.validSpan = false;
    });
  }

  onChangeEventNI(event: any) {
    this.localForm.patchValue({ NoInterior: event.target.value });
  }

  onChangeEventNE(event: any) {
    this.localForm.patchValue({ NoExterior: event.target.value });
  }

  onChangeEventCP(event: any) {
    const valor = sanitizeNumericValue(event.target.value, 5);
    this.localForm.patchValue({ CP: valor });
    this.buscarCodigoPostalSiCompleto(valor);
  }

  onChangeEventNILicencia(event: any) {
    this.localForm.patchValue({ NoInterior: event.target.value });
  }

  onChangeEventNELicencia(event: any) {
    this.localForm.patchValue({ NoExterior: event.target.value });
  }

  onChangeEventCPLicencia(event: any) {
    const valor = sanitizeNumericValue(event.target.value, 5);
    this.localForm.patchValue({ CP: valor });
    this.buscarCodigoPostalSiCompleto(valor);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    blockNonNumericKey(event);
  }

  onRfcInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeRfcValue(input.value);
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.localForm.get(controlName)?.setValue(sanitized, { emitEvent: false });
  }

  onNumericInput(event: Event, controlName: string, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const sanitized = sanitizeNumericValue(input.value, maxLength);
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.localForm.get(controlName)?.setValue(sanitized, { emitEvent: false });
    if (
      maxLength === 5 &&
      (controlName === 'CP' || controlName === 'CPLicencia')
    ) {
      this.buscarCodigoPostalSiCompleto(sanitized);
    }
  }

  private buscarCodigoPostalSiCompleto(cp: string): void {
    if (!cp || cp.length !== 5) {
      return;
    }
    this.sepomexService.obtenerPorCp(cp).subscribe({
      next: (res) => {
        this.coloniasSepomex = Array.isArray(res?.colonias) ? res.colonias : [];
        this.localForm.patchValue({
          EntidadFederativa: res?.estado?.nombre ?? '',
          Municipio: res?.municipio?.nombre ?? '',
          Colonia: '',
        });
      },
      error: (err) => {
        this.coloniasSepomex = [];
        mostrarSwalCodigoPostalNoEncontrado(err, cp);
      },
    });
  }

  esOtroSeleccionado(id: any): boolean {
    return id === this.OTRO_ID;
  }

  esOtroLocalidadSapac(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdLocalidadSapac')?.value);
  }

  esOtroColoniaSapac(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdColoniaSapac')?.value);
  }

  esOtroCalleSapac(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdCalleSapac')?.value);
  }

  esOtroLocalidadLicencia(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdLocalidadLicencia')?.value);
  }

  esOtroColoniaLicencia(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdColoniaLicencia')?.value);
  }

  esOtroCalleLicencia(): boolean {
    return this.esOtroSeleccionado(this.localForm.get('IdCalleLicencia')?.value);
  }

  private agregarOpcionOtro(lista: FormGenerico[]): FormGenerico[] {
    const copia = (lista || []).map((x) => ({ id: x.id, nombre: x.nombre }));
    if (!copia.some((x) => x.id === this.OTRO_ID)) {
      copia.push({ id: this.OTRO_ID, nombre: 'Otro' });
    }
    return copia;
  }

  private nombreDesdeCatalogo(lista: FormGenerico[], id: any): string {
    if (this.esOtroSeleccionado(id)) {
      return '';
    }
    return lista?.find((x) => x.id === id)?.nombre ?? '';
  }

  private sincronizarDireccion(desde: 'sapac' | 'licencia'): void {
    if (this.sincronizandoDireccion || this.cargandoDireccionEdicion) {
      return;
    }

    this.sincronizandoDireccion = true;
    const origen = desde === 'sapac' ? 'Sapac' : 'Licencia';
    const destino = desde === 'sapac' ? 'Licencia' : 'Sapac';

    this.localForm.patchValue({
      [`IdEntidadFederativa${destino}`]: this.localForm.get(`IdEntidadFederativa${origen}`).value,
      [`IdMunicipio${destino}`]: this.localForm.get(`IdMunicipio${origen}`).value,
      [`IdLocalidad${destino}`]: this.localForm.get(`IdLocalidad${origen}`).value,
      [`NombreLocalidad${destino}`]: this.localForm.get(`NombreLocalidad${origen}`).value,
      [`IdColonia${destino}`]: this.localForm.get(`IdColonia${origen}`).value,
      [`NombreColonia${destino}`]: this.localForm.get(`NombreColonia${origen}`).value,
      [`IdCalle${destino}`]: this.localForm.get(`IdCalle${origen}`).value,
      [`NombreCalle${destino}`]: this.localForm.get(`NombreCalle${origen}`).value,
      [`NoInterior${destino}`]: this.localForm.get(`NoInterior${origen}`).value,
      [`NoExterior${destino}`]: this.localForm.get(`NoExterior${origen}`).value,
      [`CP${destino}`]: this.localForm.get(`CP${origen}`).value,
    }, { emitEvent: false });

    if (desde === 'sapac') {
      this.municipioRegistros = this.municipiosRegistros ? [...this.municipiosRegistros] : this.municipioRegistros;
      this.localidadeRegistros = this.localidadesRegistros ? [...this.localidadesRegistros] : this.localidadeRegistros;
      this.coloniaRegistros = this.coloniasRegistros ? [...this.coloniasRegistros] : this.coloniaRegistros;
      this.calleRegistros = this.callesRegistros ? [...this.callesRegistros] : this.calleRegistros;
    } else {
      this.municipiosRegistros = this.municipioRegistros ? [...this.municipioRegistros] : this.municipiosRegistros;
      this.localidadesRegistros = this.localidadeRegistros ? [...this.localidadeRegistros] : this.localidadesRegistros;
      this.coloniasRegistros = this.coloniaRegistros ? [...this.coloniaRegistros] : this.coloniasRegistros;
      this.callesRegistros = this.calleRegistros ? [...this.calleRegistros] : this.callesRegistros;
    }

    this.sincronizandoDireccion = false;
  }

  onEstadoSapacChange(): void {
    this.obtenerMunicipios(false);
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        IdEntidadFederativaLicencia: this.localForm.get('IdEntidadFederativaSapac').value,
      }, { emitEvent: false });
      this.municipioRegistros = this.municipiosRegistros ? [...this.municipiosRegistros] : this.municipioRegistros;
    }
  }

  onEstadoLicenciaChange(): void {
    this.obtenerMunicipiosLicencia(false);
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        IdEntidadFederativaSapac: this.localForm.get('IdEntidadFederativaLicencia').value,
      }, { emitEvent: false });
      this.municipiosRegistros = this.municipioRegistros ? [...this.municipioRegistros] : this.municipiosRegistros;
    }
  }

  onMunicipioSapacChange(idMunicipio: any): void {
    this.obtenerLocalidades(idMunicipio);
  }

  onMunicipioLicenciaChange(idMunicipio: any): void {
    this.obtenerLocalidadesLicencia(idMunicipio);
  }

  onLocalidadSapacChange(idLocalidad: any): void {
    if (this.esOtroSeleccionado(idLocalidad)) {
      this.localForm.patchValue({ NombreLocalidadSapac: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreLocalidadSapac: this.nombreDesdeCatalogo(this.localidadesRegistros, idLocalidad),
      }, { emitEvent: false });
    }
    this.obtenerColonias(idLocalidad, 'sapac');
  }

  onLocalidadLicenciaChange(idLocalidad: any): void {
    if (this.esOtroSeleccionado(idLocalidad)) {
      this.localForm.patchValue({ NombreLocalidadLicencia: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreLocalidadLicencia: this.nombreDesdeCatalogo(this.localidadeRegistros, idLocalidad),
      }, { emitEvent: false });
    }
    this.obtenerColonias(idLocalidad, 'licencia');
  }

  onColoniaSapacChange(idColonia: any): void {
    if (this.esOtroSeleccionado(idColonia)) {
      this.localForm.patchValue({ NombreColoniaSapac: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreColoniaSapac: this.nombreDesdeCatalogo(this.coloniasRegistros, idColonia),
      }, { emitEvent: false });
    }
    this.obtenerCalles(idColonia, 'sapac');
  }

  onColoniaLicenciaChange(idColonia: any): void {
    if (this.esOtroSeleccionado(idColonia)) {
      this.localForm.patchValue({ NombreColoniaLicencia: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreColoniaLicencia: this.nombreDesdeCatalogo(this.coloniaRegistros, idColonia),
      }, { emitEvent: false });
    }
    this.obtenerCalles(idColonia, 'licencia');
  }

  onCalleSapacChange(idCalle: any): void {
    if (this.esOtroSeleccionado(idCalle)) {
      this.localForm.patchValue({ NombreCalleSapac: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreCalleSapac: this.nombreDesdeCatalogo(this.callesRegistros, idCalle),
      }, { emitEvent: false });
    }
    this.obtenerCalle(idCalle, 'sapac');
  }

  onCalleLicenciaChange(idCalle: any): void {
    if (this.esOtroSeleccionado(idCalle)) {
      this.localForm.patchValue({ NombreCalleLicencia: '' }, { emitEvent: false });
    } else {
      this.localForm.patchValue({
        NombreCalleLicencia: this.nombreDesdeCatalogo(this.calleRegistros, idCalle),
      }, { emitEvent: false });
    }
    this.obtenerCalle(idCalle, 'licencia');
  }

  onNombreLocalidadSapacChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreLocalidadLicencia: this.localForm.get('NombreLocalidadSapac').value,
      }, { emitEvent: false });
    }
  }

  onNombreColoniaSapacChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreColoniaLicencia: this.localForm.get('NombreColoniaSapac').value,
      }, { emitEvent: false });
    }
  }

  onNombreCalleSapacChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreCalleLicencia: this.localForm.get('NombreCalleSapac').value,
      }, { emitEvent: false });
    }
  }

  onNombreLocalidadLicenciaChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreLocalidadSapac: this.localForm.get('NombreLocalidadLicencia').value,
      }, { emitEvent: false });
    }
  }

  onNombreColoniaLicenciaChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreColoniaSapac: this.localForm.get('NombreColoniaLicencia').value,
      }, { emitEvent: false });
    }
  }

  onNombreCalleLicenciaChange(): void {
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({
        NombreCalleSapac: this.localForm.get('NombreCalleLicencia').value,
      }, { emitEvent: false });
    }
  }

  /*Obtener Ubicaciones sapac para Formulario */
  obtenerEstados() {
    this.localComercialService.obtenerEstados().subscribe(
      (res: FormGenerico[]) => {
        this.estadosRegistros = res;
      }
    );
  }

  obtenerMunicipios(_aplicarDefault = true) {
    this.localComercialService.obtenerMunicipiosEstado().subscribe(
      (res: FormGenerico[]) => {
        this.municipiosRegistros = res;
        if (!this.cargandoDireccionEdicion) {
          this.municipioRegistros = [...this.municipiosRegistros];
        }
      },
      (err) => { }
    );
  }

  googleMaps(){
    window.open("https://www.google.com.mx/maps/preview", "_blank");
  }

  obtenerLocalidades(idMunicipio) {
    this.localComercialService.obtenerLocalidadesMunicipio(idMunicipio).subscribe(
      (res: FormGenerico[]) => {
        this.localidadesRegistros = this.agregarOpcionOtro(res);
        const idLocalidad = this.localForm.get('IdLocalidadSapac').value;
        if (!this.esOtroSeleccionado(idLocalidad)) {
          this.localForm.patchValue({
            NombreLocalidadSapac: this.nombreDesdeCatalogo(this.localidadesRegistros, idLocalidad),
          }, { emitEvent: false });
        }
        this.sincronizarDireccion('sapac');
      },
      (err) => {
        this.localidadesRegistros = this.agregarOpcionOtro([]);
      }
    );
  }

  obtenerLocalidadesLicencia(idMunicipio) {
    this.localComercialService.obtenerLocalidadesMunicipio(idMunicipio).subscribe(
      (res: FormGenerico[]) => {
        this.localidadeRegistros = this.agregarOpcionOtro(res);
        const idLocalidad = this.localForm.get('IdLocalidadLicencia').value;
        if (!this.esOtroSeleccionado(idLocalidad)) {
          this.localForm.patchValue({
            NombreLocalidadLicencia: this.nombreDesdeCatalogo(this.localidadeRegistros, idLocalidad),
          }, { emitEvent: false });
        }
        this.sincronizarDireccion('licencia');
      },
      (err) => {
        this.localidadeRegistros = this.agregarOpcionOtro([]);
      }
    );
  }

  obtenerCalle(idCalle, origen: 'sapac' | 'licencia') {
    this.calleLicenciaTemp = idCalle;

    if (this.esOtroSeleccionado(idCalle)) {
      this.sincronizarDireccion(origen);
      return;
    }

    const idColonia = origen === 'sapac'
      ? this.localForm.get('IdColoniaSapac').value
      : this.localForm.get('IdColoniaLicencia').value;

    if (this.esOtroSeleccionado(idColonia)) {
      this.sincronizarDireccion(origen);
      return;
    }

    this.localComercialService.obtenerCallesColonia(idColonia).subscribe(
      (res: FormGenerico[]) => {
        const calles = this.agregarOpcionOtro(res);
        if (origen === 'sapac') {
          this.callesRegistros = calles;
          this.addCalle = false;
          if (!this.esOtroSeleccionado(idCalle)) {
            this.localForm.patchValue({
              NombreCalleSapac: this.nombreDesdeCatalogo(this.callesRegistros, idCalle),
            }, { emitEvent: false });
          }
          this.calleLicenciaTemp = idCalle;
          this.sincronizarDireccion('sapac');
        } else {
          this.calleRegistros = calles;
          this.addCalleLicencia = true;
          if (!this.esOtroSeleccionado(idCalle)) {
            this.localForm.patchValue({
              NombreCalleLicencia: this.nombreDesdeCatalogo(this.calleRegistros, idCalle),
            }, { emitEvent: false });
          }
          this.calleLicenciaTemp = idCalle;
          this.sincronizarDireccion('licencia');
        }
      },
      err => {
        if (origen === 'sapac') {
          this.callesRegistros = this.agregarOpcionOtro([]);
        } else {
          this.calleRegistros = this.agregarOpcionOtro([]);
        }
      });
  }

  obtenerColonias(idLocalidad, origen: 'sapac' | 'licencia') {
    if (origen === 'sapac') {
      this.idLocalidadGeneral = idLocalidad;
    } else {
      this.idLocalidadLicencia = idLocalidad;
    }

    if (this.esOtroSeleccionado(idLocalidad)) {
      const colonias = this.agregarOpcionOtro([]);
      if (origen === 'sapac') {
        this.coloniasRegistros = colonias;
        this.callesRegistros = this.agregarOpcionOtro([]);
      } else {
        this.coloniaRegistros = colonias;
        this.calleRegistros = this.agregarOpcionOtro([]);
      }
      this.sincronizarDireccion(origen);
      return;
    }

    this.localComercialService.obtenerColoniasLocalidad(idLocalidad).subscribe(
      (res: FormGenerico[]) => {
        const colonias = this.agregarOpcionOtro(res);
        if (origen === 'sapac') {
          this.coloniasRegistros = colonias;
          const idColonia = this.localForm.get('IdColoniaSapac').value;
          if (!this.esOtroSeleccionado(idColonia)) {
            this.localForm.patchValue({
              NombreColoniaSapac: this.nombreDesdeCatalogo(this.coloniasRegistros, idColonia),
            }, { emitEvent: false });
          }
          this.sincronizarDireccion('sapac');
        } else {
          this.coloniaRegistros = colonias;
          const idColonia = this.localForm.get('IdColoniaLicencia').value;
          if (!this.esOtroSeleccionado(idColonia)) {
            this.localForm.patchValue({
              NombreColoniaLicencia: this.nombreDesdeCatalogo(this.coloniaRegistros, idColonia),
            }, { emitEvent: false });
          }
          this.sincronizarDireccion('licencia');
        }
      },
      (err) => {
        if (origen === 'sapac') {
          this.coloniasRegistros = this.agregarOpcionOtro([]);
        } else {
          this.coloniaRegistros = this.agregarOpcionOtro([]);
        }
      }
    );
  }

  obtenerCalles(idColonia, origen: 'sapac' | 'licencia') {
    if (origen === 'sapac') {
      this.idColoniaGeneral = idColonia;
    } else {
      this.idColoniaLicenciaV = idColonia;
    }

    if (this.esOtroSeleccionado(idColonia)) {
      const calles = this.agregarOpcionOtro([]);
      if (origen === 'sapac') {
        this.callesRegistros = calles;
      } else {
        this.calleRegistros = calles;
      }
      this.sincronizarDireccion(origen);
      return;
    }

    this.localComercialService.obtenerCallesColonia(idColonia).subscribe(
      (res: FormGenerico[]) => {
        const calles = this.agregarOpcionOtro(res);
        if (origen === 'sapac') {
          this.callesRegistros = calles;
          this.addCalle = false;
          const idCalle = this.localForm.get('IdCalleSapac').value;
          if (!this.esOtroSeleccionado(idCalle)) {
            this.localForm.patchValue({
              NombreCalleSapac: this.nombreDesdeCatalogo(this.callesRegistros, idCalle),
            }, { emitEvent: false });
          }
          this.sincronizarDireccion('sapac');
        } else {
          this.calleRegistros = calles;
          this.addCalleLicencia = true;
          const idCalle = this.localForm.get('IdCalleLicencia').value;
          if (!this.esOtroSeleccionado(idCalle)) {
            this.localForm.patchValue({
              NombreCalleLicencia: this.nombreDesdeCatalogo(this.calleRegistros, idCalle),
            }, { emitEvent: false });
          }
          this.sincronizarDireccion('licencia');
        }
      },
      err => {
        if (origen === 'sapac') {
          this.callesRegistros = this.agregarOpcionOtro([]);
        } else {
          this.calleRegistros = this.agregarOpcionOtro([]);
        }
      });
  }

  obtenerCallesLicencia(idColonia) {
    this.obtenerCalles(idColonia, 'licencia');
  }

  agregarCalle() {
    this.addCalle = true;
  }
  /*Fin de ubicaciones */

  /*Obtener Catalogos */
  obtenerRoles() {
    this.localComercialService.obtenerRoles().subscribe((response) => {
      this.roles = response;
    });
  }

  obtenerGrupo() {
    this.localComercialService.obtenerGrupos().subscribe((response) => {
      this.grupo = response;
    });
  }

  obtenerTipoFoto() {
    this.localComercialService.obtenerTipoFoto().subscribe((response) => {
      this.foto = response;
    });
  }

  obtenerServicios() {
    this.localComercialService.obtenerTiposServicios().subscribe((response) => {
      this.tipos = response;
    });
  }

  obtenerEstatus() {
    this.localComercialService.obtenerEstatus().subscribe((response) => {
      this.estatus = response;
    });
  }

  obtenerGiros() {
    this.localComercialService.obtenerGiros().subscribe((response) => {
      this.giros = response;
    });
  }
  /*Fin de Catalogos */

  validarTipoPersona(tipoPersona) {
    if (tipoPersona == 1) {
      this.esMoral = false;
    } else {
      this.esMoral = true;
    }
  }

  validarEstacionamiento(estacionamiento) {
    if (estacionamiento == 1) {
      this.estacion = false;
    } else {
      this.estacion = true;
    }
  }

  validarEmpresa(tipoEmpresa) {
    if (tipoEmpresa == 1) {
      this.empresa = false;
    } else {
      this.empresa = true;
    }
  }

  validarPrograma(tipoPrograma) {
    if (tipoPrograma == false) {
      this.programa = false;
    } else {
      this.programa = true;
    }
  }
}