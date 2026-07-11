// @ts-nocheck
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { localFormTabPanelAnimation, proteccionEmpresaFieldsAnimation } from '../../animations/local-form-tab-panel.animation';
import { DetalleLocal, proteccionCivil } from '../../models/detalle-local-comercial';
import { LocalComercial } from '../../models/local-comercial';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormGenerico } from '../../models/form-generico';
import { LocalComercialService } from '../../services/local-comercial.service';
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
  tieneDocumentoAdjunto,
  toDateInputValue,
} from '../../utils/documentos-local.config';
import {
  mostrarAlertaCamposObligatorios,
  mostrarCargandoLocalComercial,
  mostrarSwalError,
  mostrarSwalExito,
  ocultarCargandoLocalComercial,
} from '../../utils/local-comercial-swal.util';
import {
  buildLocalComercialFormData,
  generarJsonEnvioLocalComercial
} from '../../utils/local-comercial-form-payload.util';
import {
  blockNonAlphanumericKey,
  blockNonNumericKey,
  sanitizeNumericValue,
  sanitizeRfcValue,
} from '../../utils/local-form-input.util';
import { LayoutScrollService } from 'src/app/services/layout-scroll.service';


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
    { title: 'Sapac', subtitle: 'Sistema de Agua Potable y Alcantarillado', css: 'local-tab-header--sapac' },
    { title: 'Catastral', subtitle: 'Predial de Cuernavaca', css: 'local-tab-header--catastral' },
    { title: 'Licenciamiento', subtitle: 'Licencias de Funcionamiento de Establecimientos Comerciales', css: 'local-tab-header--licenciamiento' },
    { title: 'Protección Civil', subtitle: 'Coordinación estatal de protección civil morelos', css: 'local-tab-header--proteccion' },
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
  readonly documentosLicenciamiento = DOCUMENTOS_LICENCIAMIENTO;
  readonly documentosProteccion = DOCUMENTOS_PROTECCION;
  readonly OTRO_ID = ' ';
  private cargandoDireccionEdicion = false;
  private sincronizandoDireccion = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private localComercialService: LocalComercialService,
    private layoutScroll: LayoutScrollService) { }

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

  async ngOnInit() {
    this.initForm();
    this.activatedRoute.params.subscribe((param) => {
      this.id = param['id'];
      if (this.id) {
        this.titulo = 'Actualizar Local Comercial';
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
    await this.obtenerLocalidades(906);
    await this.obtenerLocalidadesLicencia(906);

    //obtener Catalogos;
    this.obtenerServicios();
    this.obtenerTipoFoto();
    this.obtenerGiros();
    this.obtenerTipoPersona(this.id);
    this.obtenerTieneProgram();
  }

  initForm() {
    this.localForm = this.fb.group({
      /* Validaciones de Sapac */
      NumeroCuenta: [''],
      NombreSapac: [''],
      ApellidoPaternoSapac: [''],
      ApellidoMaternoSapac: [''],
      RfcSapac: [''],
      IdEntidadFederativaSapac: [''],
      IdMunicipioSapac: [''],
      IdLocalidadSapac: [''],
      IdColoniaSapac: [''],
      IdColoniaLicencia: [''],
      IdCalleSapac: [''],
      NombreLocalidadSapac: [''],
      NombreColoniaSapac: [''],
      NombreCalleSapac: [''],
      NoInteriorSapac: [''],
      NoExteriorSapac: [''],
      CPSapac: [''],
      Sector: [''],
      Ruta: [''],
      Folio: [''],
      IdTipoServicio: [''],
      Tipo: [1],
      Medidor: [''],
      ReciboSapac: [''],
      CaratulaMedidor: [''],
      CuadroMedidor: [''],
      /* Validaciones de Catastral */
      Clave: [''],
      M2: [''],
      Superficie: [''],
      UsoSuelo: [''],
      ReciboPredial: [''],
      /* Validaciones Licenciamiento */
      Registro: [''],
      RFC: [''],
      NombreComercial: ['', Validators.required],
      IdGiro: [''],
      LicenciaSuelo: [''],
      Nombre: [''],
      ApellidoPaterno: [''],
      ApellidoMaterno: [''],
      TipoPersona: [''],
      RazonSocial: [''],
      RepresentanteLegalNombre: [''],
      RepresentanteLegalPaterno: [''],
      RepresentanteLegalMaterno: [''],
      RepresentanteLegalTelefono: [''],
      RepresentanteLegalEmail: [''],
      ContactoNombre: [''],
      ContactoPaterno: [''],
      ContactoMaterno: [''],
      ContactoTelefono: [''],
      ContactoEmail: [''],
      FechaExpedicion: [''],
      FechaRefrendo: [''],
      IdEntidadFederativaLicencia: [''],
      IdMunicipioLicencia: [''],
      IdLocalidadLicencia: [''],
      IdCalleLicencia: [''],
      NombreLocalidadLicencia: [''],
      NombreColoniaLicencia: [''],
      NombreCalleLicencia: [''],
      NoInteriorLicencia: [''],
      NoExteriorLicencia: [''],
      CPLicencia: [''],
      TieneEstacionamiento: [''],
      Lat: [''],
      Lng: [''],
      LicenciaFuncionamiento: [''],
      FachadaEstablecimiento: ['', this.validarFachadaEstablecimiento.bind(this)],
      EstacionamientoIMG: [''],
      Bodega: [''],
      /* Validaciones P.Civil */
      EsEmpresa: [false],
      RazonSocialProteccionCivil: [''],
      RegistroAcreditacion: [''],
      RfcProteccionCivil: [''],
      NombreProteccionCivil: [''],
      ApellidoPaternoProteccionCivil: [''],
      ApellidoMaternoProteccionCivil: [''],
      TelefonoProteccionCivil: [''],
      TienePrograma: [''],
      VistoBueno: [''],
    });
  }

  obtenerLocalComercial(idLicencia: number) {
    this.cargandoDireccionEdicion = true;
    this.localComercialService.obtenerDetalleLocalComercial(idLicencia).subscribe(
      async (result: DetalleLocal) => {
        this.documentosExistentes = mapFotosToUrls(result.fotos);
        this.actualizarValidacionFachada();
        const idLocalidadSapac = resolverIdCatalogoDesdeApi(
          result.direccionSapac.idLocalidadSapac,
          result.direccionSapac.nombreLocalidadSapac,
          this.OTRO_ID
        );
        const idColoniaSapac = resolverIdCatalogoDesdeApi(
          result.direccionSapac.idColoniaSapac,
          result.direccionSapac.nombreColoniaSapac,
          this.OTRO_ID
        );
        const idCalleSapac = resolverIdCatalogoDesdeApi(
          result.direccionSapac.idCalleSapac,
          result.direccionSapac.nombreCalleSapac,
          this.OTRO_ID
        );
        const idLocalidadLicencia = resolverIdCatalogoDesdeApi(
          result.direccion.idLocalidadLicencia,
          result.direccion.nombreLocalidadLicencia,
          this.OTRO_ID
        );
        const idColoniaLicencia = resolverIdCatalogoDesdeApi(
          result.direccion.idColoniaLicencia,
          result.direccion.nombreColoniaLicencia,
          this.OTRO_ID
        );
        const idCalleLicencia = resolverIdCatalogoDesdeApi(
          result.direccion.idCalleLicencia,
          result.direccion.nombreCalleLicencia,
          this.OTRO_ID
        );
        this.idLocalidadGeneral = idLocalidadSapac;
        this.idColoniaGeneral = idColoniaSapac;
        this.calleLicenciaTemp = idCalleSapac;
        this.idLocalidadLicencia = idLocalidadLicencia;
        this.idColoniaLicenciaV = idColoniaLicencia;
        this.idCalleLicenciaV = idCalleLicencia;
        if (result.tipoPersona === 2) {
          this.localForm.patchValue({
            /**Sapac */
            NumeroCuenta: result.numeroCuenta,
            NombreSapac: result.nombreSapac,
            ApellidoPaternoSapac: result.apellidoPaternoSapac,
            ApellidoMaternoSapac: result.apellidoMaternoSapac,
            RfcSapac: result.rfcsapac,
            IdEntidadFederativaSapac: result.direccionSapac.idEntidadFederativaSapac,
            IdMunicipioSapac: result.direccionSapac.idMunicipioSapac,
            IdLocalidadSapac: idLocalidadSapac,
            NombreLocalidadSapac: result.direccionSapac.nombreLocalidadSapac,
            IdColoniaSapac: idColoniaSapac,
            IdColoniaLicencia: idColoniaLicencia,
            NombreColoniaSapac: result.direccionSapac.nombreColoniaSapac,
            IdCalleSapac: idCalleSapac,
            NombreCalleSapac: result.direccionSapac.nombreCalleSapac,
            NoInteriorSapac: result.direccionSapac.noInteriorSapac,
            NoExteriorSapac: result.direccionSapac.noExteriorSapac,
            CPSapac: result.direccionSapac.cpSapac,
            Sector: result.sector,
            Ruta: result.ruta,
            Folio: result.ruta,
            IdTipoServicio: result.idTipoServicio,
            Medidor: result.medidor,
            /**Catastral */
            Clave: result.clave,
            M2: result.m2,
            Superficie: result.superficie,
            UsoSuelo: result.usoSuelo,
            /**Licenciamiento*/
            Registro: result.registro,
            RFC: result.rfc,
            NombreComercial: result.nombreComercial,
            LicenciaSuelo: result.licenciaSuelo,
            IdGiro: result.idGiro,
            Nombre: result.nombre,
            ApellidoPaterno: result.apellidoPaterno,
            ApellidoMaterno: result.apellidoMaterno,
            TipoPersona: result.tipoPersona,
            IdEntidadFederativaLicencia: result.direccion.idEntidadFederativaLicencia,
            IdMunicipioLicencia: result.direccion.idMunicipioLicencia,
            IdLocalidadLicencia: idLocalidadLicencia,
            NombreLocalidadLicencia: result.direccion.nombreLocalidadLicencia,
            NombreColoniaLicencia: result.direccion.nombreColoniaLicencia,
            IdCalleLicencia: idCalleLicencia,
            NombreCalleLicencia: result.direccion.nombreCalleLicencia,
            RazonSocial: result.razonSocial,
            RepresentanteLegalNombre: result.representante.representanteLegalNombre,
            RepresentanteLegalPaterno: result.representante.representanteLegalPaterno,
            RepresentanteLegalMaterno: result.representante.representanteLegalMaterno,
            RepresentanteLegalTelefono: result.representante.representanteLegalTelefono,
            RepresentanteLegalEmail: result.representante.representanteLegalEmail,
            ContactoNombre: result.contacto.contactoNombre,
            ContactoPaterno: result.contacto.contactoPaterno,
            ContactoMaterno: result.contacto.contactoMaterno,
            ContactoTelefono: result.contacto.contactoTelefono,
            ContactoEmail: result.contacto.contactoEmail,
            FechaExpedicion: toDateInputValue(result.fechaExpedicion),
            FechaRefrendo: toDateInputValue(result.fechaRefrendo),
            NoInteriorLicencia: result.direccion.noInteriorLicencia,
            NoExteriorLicencia: result.direccion.noExteriorLicencia,
            CPLicencia: result.direccion.cpLicencia,
            TieneEstacionamiento: result.estacionamiento,
            Lat: result.lat,
            Lng: result.lng,
          /**P.Civil*/
            EsEmpresa: result.proteccionCivil.esEmpresa,
            RfcProteccionCivil: result.proteccionCivil.rfc,
            RazonSocialProteccionCivil: result.proteccionCivil.razonSocial,
            NombreProteccionCivil: result.proteccionCivil.nombre,
            ApellidoPaternoProteccionCivil: result.proteccionCivil.apellidoPaterno,
            ApellidoMaternoProteccionCivil: result.proteccionCivil.apellidoMaterno,
            TelefonoProteccionCivil: result.proteccionCivil.telefono,
            RegistroAcreditacion: result.proteccionCivil.registroAcreditacion,
            TienePrograma: result.proteccionCivil.tienePrograma,
          });

          this.obtenerMunicipios(false);
          this.obtenerLocalidades(result.direccionSapac.idMunicipioSapac);
          this.obtenerColonias(idLocalidadSapac, 'sapac');
          this.obtenerCalles(idColoniaSapac, 'sapac');

          this.obtenerMunicipiosLicencia(false);
          this.obtenerLocalidadesLicencia(result.direccion.idMunicipioLicencia);
          this.obtenerColonias(idLocalidadLicencia, 'licencia');
          this.obtenerCallesLicencia(idColoniaLicencia);
        }

        else
          this.localForm.patchValue({
            /**Sapac */
            NumeroCuenta: result.numeroCuenta,
            NombreSapac: result.nombreSapac,
            ApellidoPaternoSapac: result.apellidoPaternoSapac,
            ApellidoMaternoSapac: result.apellidoMaternoSapac,
            RfcSapac: result.rfcsapac,
            IdEntidadFederativaSapac: result.direccionSapac.idEntidadFederativaSapac,
            IdMunicipioSapac: result.direccionSapac.idMunicipioSapac,
            IdLocalidadSapac: idLocalidadSapac,
            NombreLocalidadSapac: result.direccionSapac.nombreLocalidadSapac,
            IdColoniaSapac: idColoniaSapac,
            IdColoniaLicencia: idColoniaLicencia,
            NombreColoniaSapac: result.direccionSapac.nombreColoniaSapac,
            IdCalleSapac: idCalleSapac,
            NombreCalleSapac: result.direccionSapac.nombreCalleSapac,
            NoInteriorSapac: result.direccionSapac.noInteriorSapac,
            NoExteriorSapac: result.direccionSapac.noExteriorSapac,
            CPSapac: result.direccionSapac.cpSapac,
            Sector: result.sector,
            Ruta: result.ruta,
            Folio: result.ruta,
            IdTipoServicio: result.idTipoServicio,
            Medidor: result.medidor,
            /**Catastral */
            Clave: result.clave,
            M2: result.m2,
            Superficie: result.superficie,
            UsoSuelo: result.usoSuelo,
            /**Licenciamiento*/
            Registro: result.registro,
            RFC: result.rfc,
            NombreComercial: result.nombreComercial,
            LicenciaSuelo: result.licenciaSuelo,
            IdGiro: result.idGiro,
            Nombre: result.nombre,
            ApellidoPaterno: result.apellidoPaterno,
            ApellidoMaterno: result.apellidoMaterno,
            TipoPersona: result.tipoPersona,
            IdEntidadFederativaLicencia: result.direccion.idEntidadFederativaLicencia,
            IdMunicipioLicencia: result.direccion.idMunicipioLicencia,
            IdLocalidadLicencia: idLocalidadLicencia,
            NombreLocalidadLicencia: result.direccion.nombreLocalidadLicencia,
            NombreColoniaLicencia: result.direccion.nombreColoniaLicencia,
            IdCalleLicencia: idCalleLicencia,
            NombreCalleLicencia: result.direccion.nombreCalleLicencia,
            ContactoNombre: result.contacto.contactoNombre,
            ContactoPaterno: result.contacto.contactoPaterno,
            ContactoMaterno: result.contacto.contactoMaterno,
            ContactoTelefono: result.contacto.contactoTelefono,
            ContactoEmail: result.contacto.contactoEmail,
            FechaExpedicion: toDateInputValue(result.fechaExpedicion),
            FechaRefrendo: toDateInputValue(result.fechaRefrendo),
            NoInteriorLicencia: result.direccion.noInteriorLicencia,
            NoExteriorLicencia: result.direccion.noExteriorLicencia,
            CPLicencia: result.direccion.cpLicencia,
            TieneEstacionamiento: result.estacionamiento,
            Lat: result.lat,
            Lng: result.lng,
            /**P.Civil*/
            EsEmpresa: result.proteccionCivil.esEmpresa,
            RfcProteccionCivil: result.proteccionCivil.rfc,
            RazonSocialProteccionCivil: result.proteccionCivil.razonSocial,
            NombreProteccionCivil: result.proteccionCivil.nombre,
            ApellidoPaternoProteccionCivil: result.proteccionCivil.apellidoPaterno,
            ApellidoMaternoProteccionCivil: result.proteccionCivil.apellidoMaterno,
            TelefonoProteccionCivil: result.proteccionCivil.telefono,
            RegistroAcreditacion: result.proteccionCivil.registroAcreditacion,
            TienePrograma: result.proteccionCivil.tienePrograma,
          });

        this.obtenerMunicipios(false);
        this.obtenerLocalidades(result.direccionSapac.idMunicipioSapac);
        this.obtenerColonias(idLocalidadSapac, 'sapac');
        this.obtenerCalles(idColoniaSapac, 'sapac');

        this.obtenerMunicipiosLicencia(false);
        this.obtenerLocalidadesLicencia(result.direccion.idMunicipioLicencia);
        this.obtenerColonias(idLocalidadLicencia, 'licencia');
        this.obtenerCallesLicencia(idColoniaLicencia);
        setTimeout(() => {
          this.cargandoDireccionEdicion = false;
        }, 600);
    }, err => {
        this.cargandoDireccionEdicion = false;
        console.log('Error al consultar:', err)
    });
  }

  changeValue(checked) {
    if (checked) {
      this.localForm.patchValue({
        EsEmpresa: true
      })
    }
    else {
      this.localForm.patchValue({
        EsEmpresa: false
      })
    }
  }

  checkedBox() {
    let checked = false;
    // let permisos: string[] = this.usuarioForm.get('permisos').value;
    let local = this.localForm.get('EsEmpresa').value;

    if (local == true) {
      checked = true;
    }
    return checked;
  }

  obtenerEstadosLicencia() {
    this.localComercialService.obtenerEstados().subscribe(
      (res: FormGenerico[]) => {
        this.estadoRegistros = res;
        if (!this.cargandoDireccionEdicion) {
          const dataTime = this.estadoRegistros.find(c => c.id === 17);
          if (dataTime) {
            this.localForm.get('IdEntidadFederativaLicencia').setValue(dataTime.id);
          }
        }
      },
      (err) => { }
    );
  }

  obtenerMunicipiosLicencia(aplicarDefault = true) {
    this.localComercialService.obtenerMunicipiosEstado().subscribe(
      (res: FormGenerico[]) => {
        this.municipioRegistros = res;
        if (aplicarDefault && !this.cargandoDireccionEdicion) {
          const dataTime = this.municipioRegistros.find(c => c.id === 906);
          if (dataTime) {
            this.localForm.get('IdMunicipioLicencia').setValue(dataTime.id);
          }
        }
        if (!this.cargandoDireccionEdicion) {
          this.municipiosRegistros = [...this.municipioRegistros];
        }
      },
      (err) => { }
    );
  }

  obtenerTipoPersona(id) {
    this.localComercialService.obtenerDetalleLocalComercial(this.id).subscribe(
      (Response) => {
        if (Response.tipoPersona === 1 || Response.tipoPersona === 0) {
          this.fisica = true;
        }
      }
    )
  }

  obtenerTieneProgram() {
    this.localComercialService.obtenerDetalleLocalComercial(this.id).subscribe(
      (Response) => {
        if (Response.proteccionCivil.tienePrograma === null) {
          this.tieneprograma = "No";
        }
        else
          this.tieneprograma = "Sí";
      }
    )
  }

  obtenerEstacionamiento() {
    this.localComercialService.obtenerDetalleLocalComercial(this.id).subscribe(
      (Response) => {
        if (Response.estacionamiento === null) {
          this.tieneestacionamiento = "No";
        }
        else
          this.tieneestacionamiento = "Sí";
      }
    )
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
    this.loadIndicatorVisible = true;
    this.botonSuccess = 'Enviando...'
    const formData = buildLocalComercialFormData(
      this.localForm,
      (controlName) => this.valorDocumento(controlName)
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
    this.loading = true;
    const formData = buildLocalComercialFormData(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      { id: this.id }
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
    this.router.navigateByUrl('/local-comercial/lista-local-comercial');
  }

  onDocumentoSeleccionado(controlName: string, archivo: File): void {
    const control = this.localForm.get(controlName);
    control.setValue(archivo);
    control.setErrors(null);
    if (archivo.type.startsWith('image/')) {
      this.documentosExistentes[controlName] = URL.createObjectURL(archivo);
    }
    if (controlName === 'FachadaEstablecimiento') {
      this.actualizarValidacionFachada();
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

  private validarFachadaEstablecimiento(control: AbstractControl) {
    return tieneDocumentoAdjunto(control.value, this.documentosExistentes['FachadaEstablecimiento'])
      ? null
      : { required: true };
  }

  private actualizarValidacionFachada(): void {
    this.localForm.get('FachadaEstablecimiento')?.updateValueAndValidity({ emitEvent: false });
  }

  private prepararValidacionObligatoria(): void {
    const nombre = this.localForm.get('NombreComercial');
    const fachada = this.localForm.get('FachadaEstablecimiento');
    nombre?.markAsTouched();
    fachada?.markAsTouched();
    this.actualizarValidacionFachada();
    nombre?.updateValueAndValidity();
  }

  private obtenerCamposObligatoriosFaltantes(): string[] {
    const faltantes: string[] = [];

    if (this.localForm.get('NombreComercial')?.invalid) {
      faltantes.push('Nombre Comercial');
    }
    if (this.localForm.get('FachadaEstablecimiento')?.invalid) {
      faltantes.push('Fachada del Establecimiento');
    }

    return faltantes;
  }

  private validarCamposObligatorios(): boolean {
    this.prepararValidacionObligatoria();
    return this.obtenerCamposObligatoriosFaltantes().length === 0;
  }

  private irATabLicenciamiento(): void {
    this.reservarAlturaTabPanels();
    this.shouldScrollAfterTabNav = true;
    this.activeTab = 2;
    this.scrollFormToTop();
  }

  submit() {
    generarJsonEnvioLocalComercial(
      this.localForm,
      (controlName) => this.valorDocumento(controlName),
      'agregar'
    );

    this.submitted = true;
    this.loadIndicatorVisible = false;
    this.primerIcon = true;
    this.botonSuccess = 'Guardar';
    this.primerSpan = true;
    this.validSpan = true;

    this.prepararValidacionObligatoria();
    const faltanNombreOFachada =
      this.localForm.get('NombreComercial')?.invalid ||
      this.localForm.get('FachadaEstablecimiento')?.invalid;

    if (faltanNombreOFachada) {
      this.irATabLicenciamiento();
      mostrarAlertaCamposObligatorios(this.obtenerCamposObligatoriosFaltantes());
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
        lat: this.localForm.get('Lat').value,
        lng: this.localForm.get('Lng').value
      }
    });

    dialogRef.afterClosed().subscribe((ubicacion) => {
      if (!ubicacion) {
        return;
      }

      this.localForm.patchValue({
        Lat: ubicacion.lat,
        Lng: ubicacion.lng
      });

      if (!tieneCoordenadasValidas(ubicacion.lat, ubicacion.lng)) {
        mostrarAlertaCamposObligatorios(['Ubicación del Lugar']);
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
    const valor = event.target.value;
    this.localForm.patchValue({ NoInteriorSapac: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ NoInteriorLicencia: valor });
    }
  }

  onChangeEventNE(event: any) {
    const valor = event.target.value;
    this.localForm.patchValue({ NoExteriorSapac: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ NoExteriorLicencia: valor });
    }
  }

  onChangeEventCP(event: any) {
    const valor = sanitizeNumericValue(event.target.value, 5);
    this.localForm.patchValue({ CPSapac: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ CPLicencia: valor });
    }
  }

  onChangeEventNILicencia(event: any) {
    const valor = event.target.value;
    this.localForm.patchValue({ NoInteriorLicencia: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ NoInteriorSapac: valor });
    }
  }

  onChangeEventNELicencia(event: any) {
    const valor = event.target.value;
    this.localForm.patchValue({ NoExteriorLicencia: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ NoExteriorSapac: valor });
    }
  }

  onChangeEventCPLicencia(event: any) {
    const valor = sanitizeNumericValue(event.target.value, 5);
    this.localForm.patchValue({ CPLicencia: valor });
    if (!this.cargandoDireccionEdicion) {
      this.localForm.patchValue({ CPSapac: valor });
    }
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
        if (!this.cargandoDireccionEdicion) {
          const dataTime = this.estadosRegistros.find(c => c.id === 17);
          if (dataTime) {
            this.localForm.get('IdEntidadFederativaSapac').setValue(dataTime.id);
          }
        }
      }
    );
  }

  obtenerMunicipios(aplicarDefault = true) {
    this.localComercialService.obtenerMunicipiosEstado().subscribe(
      (res: FormGenerico[]) => {
        this.municipiosRegistros = res;
        if (aplicarDefault && !this.cargandoDireccionEdicion) {
          const dataTime = this.municipiosRegistros.find(c => c.id === 906);
          if (dataTime) {
            this.localForm.get('IdMunicipioSapac').setValue(dataTime.id);
          }
        }
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