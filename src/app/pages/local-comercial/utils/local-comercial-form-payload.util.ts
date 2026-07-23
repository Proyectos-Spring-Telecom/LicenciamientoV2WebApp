import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { formatApiDateTime } from './documentos-local.config';

export type LocalComercialOperacion = 'agregar' | 'actualizar';

export interface BuildLocalComercialFormDataOptions {
  /**
   * Si true, los opcionales vacíos se mandan como ''.
   * Si false, se omiten null/undefined (contrato appendIfPresent del backend).
   */
  usarValorVacioPorDefecto?: boolean;
}

type ValorDocumentoFn = (controlPath: string) => File | string;
type ValorDocumentoMultipleFn = (controlPath: string) => Array<File | string>;

const EXTENSIONES_PERMITIDAS = new Set(['jpg', 'jpeg', 'png', 'pdf']);

/** Campos raíz siempre (POST /registros). */
const CAMPOS_RAIZ = [
  'Latitud',
  'Longitud',
  'TipoRegistro',
  'PredioObra',
  'EntidadFederativa',
  'Municipio',
  'Localidad',
  'Colonia',
  'Calle',
  'NoInterior',
  'NoExterior',
  'CP',
] as const;

/**
 * POST: puede mandar '' para opcionales.
 * PATCH parcial: omite null/undefined/''/solo espacios; el `0` sí se envía.
 */
function appendCampo(
  formData: FormData,
  clave: string,
  valor: unknown,
  usarValorVacioPorDefecto: boolean,
  parcial = false
): void {
  if (valor instanceof File) {
    formData.append(clave, valor, valor.name);
    return;
  }
  if (parcial) {
    if (valor === undefined || valor === null) return;
    if (typeof valor === 'string' && valor.trim() === '') return;
    formData.append(clave, String(valor));
    return;
  }
  if (valor === undefined || valor === null) {
    if (usarValorVacioPorDefecto) {
      formData.append(clave, '');
    }
    return;
  }
  formData.append(clave, String(valor));
}

function appendDocumento(formData: FormData, clave: string, valor: File | string): void {
  // Solo File real cargado. Nombre con extensión permitida (jpg/jpeg/png/pdf).
  if (!(valor instanceof File) || !valor.name?.trim()) {
    return;
  }
  const nombre = nombreArchivoConExtensionPermitida(valor);
  if (!nombre) {
    console.warn(
      `[Local Comercial] Archivo omitido (${clave}): extensión no permitida →`,
      valor.name,
      valor.type
    );
    return;
  }
  formData.append(clave, valor, nombre);
}

function tieneArchivoCargado(valor: unknown): valor is File {
  return valor instanceof File && !!valor.name?.trim();
}

function extensionArchivo(nombre: string): string {
  const base = nombre.split(/[/\\]/).pop() || nombre;
  const partes = base.split('.');
  if (partes.length < 2) {
    return '';
  }
  return partes[partes.length - 1].trim().toLowerCase();
}

/** Extensión a partir del MIME (para archivos sin .jpg/.png/.pdf en el nombre). */
function extensionDesdeMime(mime: string): string {
  const m = (mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'application/pdf') return 'pdf';
  return '';
}

/**
 * Asegura filename con extensión permitida por el backend.
 * Evita el error: El archivo "Sapac.reciboSapac" tiene una extensión no permitida.
 */
function nombreArchivoConExtensionPermitida(file: File): string | null {
  const original = (file.name || '').trim().split(/[/\\]/).pop() || '';
  const ext = extensionArchivo(original);
  if (EXTENSIONES_PERMITIDAS.has(ext)) {
    // Quitar caracteres raros del nombre; conservar extensión
    const safeBase = original
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w.\-()\sÁÉÍÓÚáéíóúñÑ]/gi, '_')
      .trim() || 'archivo';
    return `${safeBase}.${ext}`;
  }
  const desdeMime = extensionDesdeMime(file.type);
  if (desdeMime) {
    const base =
      (original.replace(/\.[^.]+$/, '').trim() || 'archivo').replace(
        /[^\w.\-()\sÁÉÍÓÚáéíóúñÑ]/gi,
        '_'
      ) || 'archivo';
    return `${base}.${desdeMime}`;
  }
  return null;
}

function esArchivoEnviable(valor: unknown): valor is File {
  if (!(valor instanceof File) || !valor.name?.trim()) {
    return false;
  }
  return !!nombreArchivoConExtensionPermitida(valor);
}

function appendDocumentosMultiples(
  formData: FormData,
  clave: string,
  valores: Array<File | string> | null | undefined,
  max = 10
): void {
  // Mismo field name repetido (sin [i]), máx. N — Multer / contrato Angular.
  const archivos = (Array.isArray(valores) ? valores : [])
    .filter(esArchivoEnviable)
    .slice(0, max);
  archivos.forEach((archivo) => {
    formData.append(clave, archivo, archivo.name);
  });
}

function tieneTexto(valor: unknown): boolean {
  return String(valor ?? '').trim() !== '';
}

function corresponsableConDatos(
  item: { get: (n: string) => { value: unknown } | null } | null | undefined
): boolean {
  if (!item) {
    return false;
  }
  return (
    tieneTexto(item.get('NombreCompleto')?.value) ||
    tieneTexto(item.get('NoRegLicenciaConstruccion')?.value) ||
    tieneTexto(item.get('CedulaProfesional')?.value)
  );
}

function asFlag01(valor: unknown): string {
  if (valor === true || valor === 1 || valor === '1' || valor === 'true') return '1';
  if (valor === false || valor === 0 || valor === '0' || valor === 'false') return '0';
  if (valor == null || valor === '') return '';
  return String(valor);
}

/** Sapac.IdTipoServicio: 1 = SM, 2 = SP. */
export function mapIdTipoServicio(valor: unknown): string {
  const n = Number(valor);
  if (n === 1 || n === 2) {
    return String(n);
  }
  return '';
}

/** TipoRegistro: 0 local comercial, 1 vivienda. */
export function mapTipoRegistro(valor: unknown): string {
  if (valor === 'comercial' || valor === 0 || valor === '0') return '0';
  if (valor === 'vivienda' || valor === 1 || valor === '1') return '1';
  if (valor == null || valor === '') return '';
  return String(valor);
}

/** PredioObra: 0 no construcción, 1 en construcción. */
export function mapPredioObra(valor: unknown): string {
  return asFlag01(valor);
}

/**
 * ProteccionCivil.EsEmpresa (API): 1 = persona física, 2 = persona moral.
 * En UI el toggle guarda 0 (física) y 1 (empresa / moral).
 */
export function mapEsEmpresa(valor: unknown): string {
  if (valor === 2 || valor === '2') return '2';
  // UI checkbox ON (1) o true → moral
  if (valor === true || valor === 1 || valor === '1' || valor === 'true') return '2';
  // UI checkbox OFF (0) o false → física
  if (valor === false || valor === 0 || valor === '0' || valor === 'false') return '1';
  return '';
}

/** API EsEmpresa 1|2 → valor del checkbox del formulario (0|1). */
export function esEmpresaApiAForm(valor: unknown): 0 | 1 {
  if (valor === 2 || valor === '2' || valor === true || valor === 'true') {
    return 1;
  }
  return 0;
}

/** Licencias.TipoPersona: 1 | 2. */
export function mapTipoPersona(valor: unknown): string {
  const n = Number(valor);
  if (n === 1 || n === 2) {
    return String(n);
  }
  return '';
}

/** LicenciaConstruccion.TipoSolicitudLicencia: 1|2|3|4. */
export function mapTipoSolicitudLicencia(valor: unknown): string {
  const n = Number(valor);
  if (n === 1 || n === 2 || n === 3 || n === 4) {
    return String(n);
  }
  return '';
}

function asEntero(valor: unknown): string {
  if (valor == null || valor === '') {
    return '';
  }
  const n = Number(valor);
  return Number.isFinite(n) ? String(Math.trunc(n)) : '';
}

function asNumero(valor: unknown): string {
  if (valor == null || valor === '') {
    return '';
  }
  const n = Number(valor);
  return Number.isFinite(n) ? String(n) : '';
}

/** FormGroup anidado 1:1 con el body de POST /registros. */
export function createRegistrosFormGroup(fb: FormBuilder): FormGroup {
  return fb.group({
    Latitud: [''],
    Longitud: [''],
    TipoRegistro: [0],
    PredioObra: [0],
    EntidadFederativa: [''],
    Municipio: [''],
    Localidad: [''],
    Colonia: [''],
    Calle: [''],
    NoInterior: [''],
    NoExterior: [''],
    CP: [''],
    Sapac: fb.group({
      NumeroCuenta: [''],
      Nombre: [''],
      ApellidoPaterno: [''],
      ApellidoMaterno: [''],
      RFC: [''],
      Sector: [''],
      Ruta: [''],
      Folio: [''],
      IdTipoServicio: [''],
      Medidor: [''],
      reciboSapac: [''],
      caratulamedidor: [''],
      cuadromedidor: [''],
    }),
    Catastro: fb.group({
      Clave: [''],
      M2: [''],
      Superficie: [''],
      UsoSuelo: [''],
      reciboPredial: [''],
    }),
    Licencias: fb.group({
      Registro: [''],
      NombreComercial: [''],
      Giro: [''],
      LicenciaSuelo: [''],
      NombrePropietario: [''],
      ApellidoPaternoPropietario: [''],
      ApellidoMaternoPropietario: [''],
      TipoPersona: [''],
      RFC: [''],
      RazonSocial: [''],
      FechaExpedicion: [''],
      FechaRefrendo: [''],
      Estacionamiento: [''],
      Tipo: [1],
      FechaHora: [''],
      Contacto: fb.group({
        Nombre: [''],
        ApellidoPaterno: [''],
        ApellidoMaterno: [''],
        Telefono: [''],
        Correo: [''],
      }),
      ContactoRepresentante: fb.group({
        Nombre: [''],
        ApellidoPaterno: [''],
        ApellidoMaterno: [''],
        Telefono: [''],
        Correo: [''],
      }),
      licenciaFuncionamiento: [''],
      fachada: [''],
      estacionamiento: [''],
      bodega: [''],
    }),
    ProteccionCivil: fb.group({
      EsEmpresa: [0],
      RazonSocial: [''],
      RFC: [''],
      Nombre: [''],
      ApellidoPaterno: [''],
      ApellidoMaterno: [''],
      Telefono: [''],
      RegistroAcreditacion: [''],
      TienePrograma: [''],
      vistoBueno: [''],
    }),
    LicenciaConstruccion: fb.group({
      TipoSolicitudLicencia: [''],
      DescripcionProyecto: [''],
      ClaveCatastral: [''],
      SuperficieTerrenoM2: [''],
      SuperficieTerrenoObraM2: [''],
      DescripcionSistemaConstructivo: [''],
      NombrePropietario: [''],
      DomicilioNotificacion: [''],
      RFC: [''],
      NombreDRO: [''],
      NoRegLicenciaConstruccion: [''],
      CedulaProfesional: [''],
      Fecha: [''],
      NumeroExpediente: [''],
      NumeroControl: [''],
      SeguimientoObra: [''],
      ConstanciaAlineamiento: [''],
      LicenciaUsoSuelo: [''],
      PlanoAutorizado: [''],
      LicenciaFraccionamiento: [''],
      Escrituras: [''],
      FactibilidadAguaPotable: [''],
      RecibosPagoPredial: [''],
      RecibosMunicipales: [''],
      PlanoArquitectonicos: [''],
      Otros: [''],
      Corresponsables: fb.array([
        fb.group({
          Id: [null as number | null],
          NombreCompleto: [''],
          NoRegLicenciaConstruccion: [''],
          CedulaProfesional: [''],
        }),
        fb.group({
          Id: [null as number | null],
          NombreCompleto: [''],
          NoRegLicenciaConstruccion: [''],
          CedulaProfesional: [''],
        }),
      ]),
      /** Archivos LC: máx. 1 por campo (nombres POST /registros). */
      constanciaAlineamiento: [''],
      constanciaNumero: [''],
      /** File con mismo nombre API que el flag tinyint (se envían por separado). */
      fileLicenciaUsoSuelo: [''],
      filePlanoAutorizado: [''],
      fileLicenciaFraccionamiento: [''],
      ConstanciaPropietario: [''],
      Factibilidad: [''],
      RecibosImpuestoPredial: [''],
      JuegoDePlanosArquitectonicos1: [''],
      JuegoDePlanosArquitectonicos2: [''],
      JuegoDePlanosArquitectonicos3: [''],
      otros: [''],
      FirmaPropietario: [''],
      FirmaDRO: [''],
      FirmaCorresponsable: [''],
      FirmaResponsableRecepcionDocumento: [''],
    }),
  });
}

/**
 * Arma multipart/form-data POST /registros:
 * - FormData plano con notación de puntos
 * - Obligatorios: Latitud, Longitud, TipoRegistro, PredioObra (0|1 válidos)
 * - PredioObra=0 → Sapac / Catastro / Licencias / ProteccionCivil (+ fotos 1–9)
 * - PredioObra=1 → LicenciaConstruccion (+ corresponsables sin Id, archivos LC máx. 1)
 * - Transversales con PredioObra=1: Licencias.fachada|estacionamiento|bodega
 * - No envía IdCapturista, IdGrupo, Estatus ni Registro
 * - Archivos: JPG / JPEG / PNG / PDF
 */
export function buildLocalComercialFormData(
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  options: BuildLocalComercialFormDataOptions = {},
  _valorDocumentoMultiple: ValorDocumentoMultipleFn = () => []
): FormData {
  // POST: omitir null/undefined (appendIfPresent); 0 se conserva
  const { usarValorVacioPorDefecto: empty = false } = options;
  const v = (path: string) => form.get(path)?.value;
  const formData = new FormData();
  const predioObra = mapPredioObra(v('PredioObra'));
  const esObra = predioObra === '1';

  // Raíz (siempre) — valores 0 se conservan
  appendCampo(formData, 'Latitud', asNumero(v('Latitud')) || v('Latitud'), empty);
  appendCampo(formData, 'Longitud', asNumero(v('Longitud')) || v('Longitud'), empty);
  appendCampo(formData, 'TipoRegistro', mapTipoRegistro(v('TipoRegistro')), empty);
  appendCampo(formData, 'PredioObra', predioObra, empty);
  appendCampo(formData, 'EntidadFederativa', v('EntidadFederativa'), empty);
  appendCampo(formData, 'Municipio', v('Municipio'), empty);
  appendCampo(formData, 'Localidad', v('Localidad'), empty);
  appendCampo(formData, 'Colonia', v('Colonia'), empty);
  appendCampo(formData, 'Calle', v('Calle'), empty);
  appendCampo(formData, 'NoInterior', v('NoInterior'), empty);
  appendCampo(formData, 'NoExterior', v('NoExterior'), empty);
  // CP como string para conservar ceros a la izquierda
  appendCampo(formData, 'CP', v('CP') == null || v('CP') === '' ? null : String(v('CP')), empty);

  if (esObra) {
    appendLicenciaConstruccion(formData, form, v, empty, valorDocumento, false);
    // Transversales 6/7/8 también con PredioObra=1
    appendArchivosTransversalesLicencias(formData, valorDocumento);
  } else {
    appendSapacCatastroLicenciasProteccion(formData, v, empty, valorDocumento, false);
    // Fotos 1–9 (incluye fachada/estacionamiento/bodega)
    appendArchivosTransversalesLicencias(formData, valorDocumento);
  }

  return formData;
}

/**
 * Arma multipart/form-data PATCH /registros_actualizar:
 * - `idRegistro` obligatorio en el body
 * - Parcial: omite '' / null / undefined (no sobrescriben); `0` sí se envía
 * - No envía `Estatus`
 * - PredioObra efectivo: si se omite PredioObra vacío, el backend usa el almacenado
 * - Archivos: solo File recién cargados (string($binary) del contrato actualizar)
 */
export function buildLocalComercialActualizarFormData(
  idRegistro: number,
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  _valorDocumentoMultiple: ValorDocumentoMultipleFn = () => []
): FormData {
  const id = Number(idRegistro);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('idRegistro es obligatorio y debe ser un entero ≥ 1');
  }

  const v = (path: string) => form.get(path)?.value;
  const formData = new FormData();
  const empty = false;
  const parcial = true;
  const predioObra = mapPredioObra(v('PredioObra'));
  const esObra = predioObra === '1';

  formData.append('idRegistro', String(Math.trunc(id)));

  appendCampo(formData, 'Latitud', asNumero(v('Latitud')) || v('Latitud'), empty, parcial);
  appendCampo(formData, 'Longitud', asNumero(v('Longitud')) || v('Longitud'), empty, parcial);
  appendCampo(formData, 'TipoRegistro', mapTipoRegistro(v('TipoRegistro')), empty, parcial);
  appendCampo(formData, 'PredioObra', predioObra, empty, parcial);
  appendCampo(formData, 'EntidadFederativa', v('EntidadFederativa'), empty, parcial);
  appendCampo(formData, 'Municipio', v('Municipio'), empty, parcial);
  appendCampo(formData, 'Localidad', v('Localidad'), empty, parcial);
  appendCampo(formData, 'Colonia', v('Colonia'), empty, parcial);
  appendCampo(formData, 'Calle', v('Calle'), empty, parcial);
  appendCampo(formData, 'NoInterior', v('NoInterior'), empty, parcial);
  appendCampo(formData, 'NoExterior', v('NoExterior'), empty, parcial);
  appendCampo(
    formData,
    'CP',
    v('CP') == null || v('CP') === '' ? '' : String(v('CP')),
    empty,
    parcial
  );

  if (esObra) {
    appendLicenciaConstruccion(formData, form, v, empty, valorDocumento, parcial);
    // Transversales IdTipoFoto 6/7/8
    appendArchivosTransversalesLicencias(formData, valorDocumento);
  } else {
    appendSapacCatastroLicenciasProteccion(formData, v, empty, valorDocumento, parcial);
    appendArchivosTransversalesLicencias(formData, valorDocumento);
  }

  return formData;
}

/**
 * Archivos transversales (PATCH/POST): fachada, estacionamiento, bodega.
 * Se procesan con PredioObra=0 y PredioObra=1.
 */
function appendArchivosTransversalesLicencias(
  formData: FormData,
  valorDocumento: ValorDocumentoFn
): void {
  appendDocumento(formData, 'Licencias.fachada', valorDocumento('Licencias.fachada'));
  appendDocumento(formData, 'Licencias.bodega', valorDocumento('Licencias.bodega'));
  appendDocumento(
    formData,
    'Licencias.estacionamiento',
    valorDocumento('Licencias.estacionamiento')
  );
}

function appendSapacCatastroLicenciasProteccion(
  formData: FormData,
  v: (path: string) => unknown,
  empty: boolean,
  valorDocumento: ValorDocumentoFn,
  parcial = false
): void {
  // Sapac.*
  appendCampo(formData, 'Sapac.NumeroCuenta', v('Sapac.NumeroCuenta'), empty, parcial);
  appendCampo(formData, 'Sapac.Nombre', v('Sapac.Nombre'), empty, parcial);
  appendCampo(formData, 'Sapac.ApellidoPaterno', v('Sapac.ApellidoPaterno'), empty, parcial);
  appendCampo(formData, 'Sapac.ApellidoMaterno', v('Sapac.ApellidoMaterno'), empty, parcial);
  appendCampo(formData, 'Sapac.RFC', v('Sapac.RFC'), empty, parcial);
  appendCampo(formData, 'Sapac.Sector', asEntero(v('Sapac.Sector')), empty, parcial);
  appendCampo(formData, 'Sapac.Ruta', asEntero(v('Sapac.Ruta')), empty, parcial);
  appendCampo(formData, 'Sapac.Folio', v('Sapac.Folio'), empty, parcial);
  appendCampo(
    formData,
    'Sapac.IdTipoServicio',
    mapIdTipoServicio(v('Sapac.IdTipoServicio')),
    empty,
    parcial
  );
  appendCampo(formData, 'Sapac.Medidor', v('Sapac.Medidor'), empty, parcial);
  // Nombres exactos del contrato (caratulamedidor en minúsculas)
  appendDocumento(formData, 'Sapac.reciboSapac', valorDocumento('Sapac.reciboSapac'));
  appendDocumento(formData, 'Sapac.caratulamedidor', valorDocumento('Sapac.caratulamedidor'));
  appendDocumento(formData, 'Sapac.cuadromedidor', valorDocumento('Sapac.cuadromedidor'));

  // Catastro.*
  appendCampo(formData, 'Catastro.Clave', v('Catastro.Clave'), empty, parcial);
  appendCampo(formData, 'Catastro.M2', v('Catastro.M2'), empty, parcial);
  appendCampo(formData, 'Catastro.Superficie', asNumero(v('Catastro.Superficie')), empty, parcial);
  appendCampo(formData, 'Catastro.UsoSuelo', v('Catastro.UsoSuelo'), empty, parcial);
  appendDocumento(formData, 'Catastro.reciboPredial', valorDocumento('Catastro.reciboPredial'));

  // Licencias.* — no se envía Registro raíz (lo fija el backend)
  appendCampo(formData, 'Licencias.Registro', v('Licencias.Registro'), empty, parcial);
  appendCampo(formData, 'Licencias.NombreComercial', v('Licencias.NombreComercial'), empty, parcial);
  appendCampo(formData, 'Licencias.Giro', v('Licencias.Giro'), empty, parcial);
  appendCampo(formData, 'Licencias.LicenciaSuelo', v('Licencias.LicenciaSuelo'), empty, parcial);
  const tipoPersona = mapTipoPersona(v('Licencias.TipoPersona'));
  const esPersonaMoral = tipoPersona === '2';
  appendCampo(formData, 'Licencias.TipoPersona', tipoPersona, empty, parcial);
  if (esPersonaMoral) {
    appendCampo(formData, 'Licencias.RazonSocial', v('Licencias.RazonSocial'), empty, parcial);
  } else {
    appendCampo(formData, 'Licencias.NombrePropietario', v('Licencias.NombrePropietario'), empty, parcial);
    appendCampo(
      formData,
      'Licencias.ApellidoPaternoPropietario',
      v('Licencias.ApellidoPaternoPropietario'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.ApellidoMaternoPropietario',
      v('Licencias.ApellidoMaternoPropietario'),
      empty,
      parcial
    );
  }
  appendCampo(formData, 'Licencias.RFC', v('Licencias.RFC'), empty, parcial);
  appendCampo(
    formData,
    'Licencias.FechaExpedicion',
    formatApiDateTime(v('Licencias.FechaExpedicion')),
    empty,
    parcial
  );
  appendCampo(
    formData,
    'Licencias.FechaRefrendo',
    formatApiDateTime(v('Licencias.FechaRefrendo')),
    empty,
    parcial
  );
  appendCampo(
    formData,
    'Licencias.Estacionamiento',
    asFlag01(v('Licencias.Estacionamiento')),
    empty,
    parcial
  );
  // POST fuerza Tipo=1 y FechaHora=now; PATCH solo envía si hay valor útil
  const tipoLicencia = asEntero(v('Licencias.Tipo'));
  appendCampo(
    formData,
    'Licencias.Tipo',
    parcial ? tipoLicencia : tipoLicencia || '1',
    empty,
    parcial
  );
  const fechaHora =
    formatApiDateTime(v('Licencias.FechaHora')) ||
    (parcial ? '' : formatApiDateTime(new Date()));
  appendCampo(formData, 'Licencias.FechaHora', fechaHora, empty, parcial);

  // Contacto solo si trae información
  if (
    tieneTexto(v('Licencias.Contacto.Nombre')) ||
    tieneTexto(v('Licencias.Contacto.ApellidoPaterno')) ||
    tieneTexto(v('Licencias.Contacto.ApellidoMaterno')) ||
    tieneTexto(v('Licencias.Contacto.Telefono')) ||
    tieneTexto(v('Licencias.Contacto.Correo'))
  ) {
    appendCampo(formData, 'Licencias.Contacto.Nombre', v('Licencias.Contacto.Nombre'), empty, parcial);
    appendCampo(
      formData,
      'Licencias.Contacto.ApellidoPaterno',
      v('Licencias.Contacto.ApellidoPaterno'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.Contacto.ApellidoMaterno',
      v('Licencias.Contacto.ApellidoMaterno'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.Contacto.Telefono',
      v('Licencias.Contacto.Telefono'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.Contacto.Correo',
      v('Licencias.Contacto.Correo'),
      empty,
      parcial
    );
  }

  // Contacto representante de Licencias solo con persona moral
  if (
    esPersonaMoral &&
    (tieneTexto(v('Licencias.ContactoRepresentante.Nombre')) ||
      tieneTexto(v('Licencias.ContactoRepresentante.ApellidoPaterno')) ||
      tieneTexto(v('Licencias.ContactoRepresentante.ApellidoMaterno')) ||
      tieneTexto(v('Licencias.ContactoRepresentante.Telefono')) ||
      tieneTexto(v('Licencias.ContactoRepresentante.Correo')))
  ) {
    appendCampo(
      formData,
      'Licencias.ContactoRepresentante.Nombre',
      v('Licencias.ContactoRepresentante.Nombre'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.ContactoRepresentante.ApellidoPaterno',
      v('Licencias.ContactoRepresentante.ApellidoPaterno'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.ContactoRepresentante.ApellidoMaterno',
      v('Licencias.ContactoRepresentante.ApellidoMaterno'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.ContactoRepresentante.Telefono',
      v('Licencias.ContactoRepresentante.Telefono'),
      empty,
      parcial
    );
    appendCampo(
      formData,
      'Licencias.ContactoRepresentante.Correo',
      v('Licencias.ContactoRepresentante.Correo'),
      empty,
      parcial
    );
  }

  appendDocumento(
    formData,
    'Licencias.licenciaFuncionamiento',
    valorDocumento('Licencias.licenciaFuncionamiento')
  );
  // Fachada / Bodega / Estacionamiento → appendArchivosTransversalesLicencias (siempre)

  // ProteccionCivil.*
  appendCampo(
    formData,
    'ProteccionCivil.EsEmpresa',
    mapEsEmpresa(v('ProteccionCivil.EsEmpresa')),
    empty,
    parcial
  );
  appendCampo(formData, 'ProteccionCivil.RazonSocial', v('ProteccionCivil.RazonSocial'), empty, parcial);
  appendCampo(formData, 'ProteccionCivil.RFC', v('ProteccionCivil.RFC'), empty, parcial);
  appendCampo(formData, 'ProteccionCivil.Nombre', v('ProteccionCivil.Nombre'), empty, parcial);
  appendCampo(
    formData,
    'ProteccionCivil.ApellidoPaterno',
    v('ProteccionCivil.ApellidoPaterno'),
    empty,
    parcial
  );
  appendCampo(
    formData,
    'ProteccionCivil.ApellidoMaterno',
    v('ProteccionCivil.ApellidoMaterno'),
    empty,
    parcial
  );
  appendCampo(formData, 'ProteccionCivil.Telefono', v('ProteccionCivil.Telefono'), empty, parcial);
  appendCampo(
    formData,
    'ProteccionCivil.RegistroAcreditacion',
    v('ProteccionCivil.RegistroAcreditacion'),
    empty,
    parcial
  );
  appendCampo(
    formData,
    'ProteccionCivil.TienePrograma',
    asFlag01(v('ProteccionCivil.TienePrograma')),
    empty,
    parcial
  );

  appendDocumento(formData, 'ProteccionCivil.vistoBueno', valorDocumento('ProteccionCivil.vistoBueno'));
}

function appendLicenciaConstruccion(
  formData: FormData,
  form: FormGroup,
  v: (path: string) => unknown,
  empty: boolean,
  valorDocumento: ValorDocumentoFn,
  parcial = false
): void {
  const lc = 'LicenciaConstruccion';

  appendCampo(
    formData,
    `${lc}.TipoSolicitudLicencia`,
    mapTipoSolicitudLicencia(v(`${lc}.TipoSolicitudLicencia`)),
    empty,
    parcial
  );
  appendCampo(formData, `${lc}.DescripcionProyecto`, v(`${lc}.DescripcionProyecto`), empty, parcial);
  appendCampo(formData, `${lc}.ClaveCatastral`, v(`${lc}.ClaveCatastral`), empty, parcial);
  appendCampo(
    formData,
    `${lc}.SuperficieTerrenoM2`,
    asNumero(v(`${lc}.SuperficieTerrenoM2`)),
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.SuperficieTerrenoObraM2`,
    asNumero(v(`${lc}.SuperficieTerrenoObraM2`)),
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.DescripcionSistemaConstructivo`,
    v(`${lc}.DescripcionSistemaConstructivo`),
    empty,
    parcial
  );
  appendCampo(formData, `${lc}.NombrePropietario`, v(`${lc}.NombrePropietario`), empty, parcial);
  appendCampo(formData, `${lc}.DomicilioNotificacion`, v(`${lc}.DomicilioNotificacion`), empty, parcial);
  appendCampo(formData, `${lc}.RFC`, v(`${lc}.RFC`), empty, parcial);
  appendCampo(formData, `${lc}.NombreDRO`, v(`${lc}.NombreDRO`), empty, parcial);
  appendCampo(
    formData,
    `${lc}.NoRegLicenciaConstruccion`,
    v(`${lc}.NoRegLicenciaConstruccion`),
    empty,
    parcial
  );
  appendCampo(formData, `${lc}.CedulaProfesional`, v(`${lc}.CedulaProfesional`), empty, parcial);
  appendCampo(formData, `${lc}.Fecha`, formatApiDateTime(v(`${lc}.Fecha`)), empty, parcial);
  appendCampo(formData, `${lc}.NumeroExpediente`, v(`${lc}.NumeroExpediente`), empty, parcial);
  appendCampo(formData, `${lc}.NumeroControl`, v(`${lc}.NumeroControl`), empty, parcial);
  appendCampo(formData, `${lc}.SeguimientoObra`, v(`${lc}.SeguimientoObra`), empty, parcial);

  // Flags 0|1. Homónimos con archivo: si hay File cargado, solo el File (no texto).
  const fileLicUso = valorDocumento(`${lc}.fileLicenciaUsoSuelo`);
  const filePlano = valorDocumento(`${lc}.filePlanoAutorizado`);
  const fileFrac = valorDocumento(`${lc}.fileLicenciaFraccionamiento`);
  appendCampo(
    formData,
    `${lc}.ConstanciaAlineamiento`,
    asFlag01(v(`${lc}.ConstanciaAlineamiento`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  if (!tieneArchivoCargado(fileLicUso)) {
    appendCampo(
      formData,
      `${lc}.LicenciaUsoSuelo`,
      asFlag01(v(`${lc}.LicenciaUsoSuelo`)) === '1' ? '1' : '0',
      empty,
      parcial
    );
  }
  if (!tieneArchivoCargado(filePlano)) {
    appendCampo(
      formData,
      `${lc}.PlanoAutorizado`,
      asFlag01(v(`${lc}.PlanoAutorizado`)) === '1' ? '1' : '0',
      empty,
      parcial
    );
  }
  if (!tieneArchivoCargado(fileFrac)) {
    appendCampo(
      formData,
      `${lc}.LicenciaFraccionamiento`,
      asFlag01(v(`${lc}.LicenciaFraccionamiento`)) === '1' ? '1' : '0',
      empty,
      parcial
    );
  }
  appendCampo(
    formData,
    `${lc}.Escrituras`,
    asFlag01(v(`${lc}.Escrituras`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.FactibilidadAguaPotable`,
    asFlag01(v(`${lc}.FactibilidadAguaPotable`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.RecibosPagoPredial`,
    asFlag01(v(`${lc}.RecibosPagoPredial`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.RecibosMunicipales`,
    asFlag01(v(`${lc}.RecibosMunicipales`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.PlanoArquitectonicos`,
    asFlag01(v(`${lc}.PlanoArquitectonicos`)) === '1' ? '1' : '0',
    empty,
    parcial
  );
  appendCampo(
    formData,
    `${lc}.Otros`,
    asFlag01(v(`${lc}.Otros`)) === '1' ? '1' : '0',
    empty,
    parcial
  );

  // Corresponsables[i].* — POST: sin Id. PATCH: puede enviar Id. Nunca IdLicenciaConstruccion.
  const corresponsables = form.get(`${lc}.Corresponsables`) as FormArray | null;
  const items = (corresponsables?.controls ?? []).filter((c) => corresponsableConDatos(c));
  items.forEach((item, i) => {
    if (parcial) {
      const idCors = asEntero(item.get('Id')?.value);
      appendCampo(formData, `${lc}.Corresponsables[${i}].Id`, idCors, empty, parcial);
    }
    appendCampo(
      formData,
      `${lc}.Corresponsables[${i}].NombreCompleto`,
      item.get('NombreCompleto')?.value ?? '',
      empty,
      parcial
    );
    appendCampo(
      formData,
      `${lc}.Corresponsables[${i}].NoRegLicenciaConstruccion`,
      item.get('NoRegLicenciaConstruccion')?.value ?? '',
      empty,
      parcial
    );
    appendCampo(
      formData,
      `${lc}.Corresponsables[${i}].CedulaProfesional`,
      item.get('CedulaProfesional')?.value ?? '',
      empty,
      parcial
    );
  });

  // Archivos LC (contrato actualizar/POST): máx. 1 por campo — solo si hay File cargado
  appendDocumento(formData, `${lc}.constanciaAlineamiento`, valorDocumento(`${lc}.constanciaAlineamiento`));
  appendDocumento(formData, `${lc}.constanciaNumero`, valorDocumento(`${lc}.constanciaNumero`));
  appendDocumento(formData, `${lc}.LicenciaUsoSuelo`, fileLicUso);
  appendDocumento(formData, `${lc}.PlanoAutorizado`, filePlano);
  appendDocumento(formData, `${lc}.LicenciaFraccionamiento`, fileFrac);
  appendDocumento(formData, `${lc}.ConstanciaPropietario`, valorDocumento(`${lc}.ConstanciaPropietario`));
  appendDocumento(formData, `${lc}.Factibilidad`, valorDocumento(`${lc}.Factibilidad`));
  appendDocumento(
    formData,
    `${lc}.RecibosImpuestoPredial`,
    valorDocumento(`${lc}.RecibosImpuestoPredial`)
  );
  appendDocumento(
    formData,
    `${lc}.JuegoDePlanosArquitectonicos1`,
    valorDocumento(`${lc}.JuegoDePlanosArquitectonicos1`)
  );
  appendDocumento(
    formData,
    `${lc}.JuegoDePlanosArquitectonicos2`,
    valorDocumento(`${lc}.JuegoDePlanosArquitectonicos2`)
  );
  appendDocumento(
    formData,
    `${lc}.JuegoDePlanosArquitectonicos3`,
    valorDocumento(`${lc}.JuegoDePlanosArquitectonicos3`)
  );
  appendDocumento(formData, `${lc}.otros`, valorDocumento(`${lc}.otros`));
  appendDocumento(formData, `${lc}.FirmaPropietario`, valorDocumento(`${lc}.FirmaPropietario`));
  appendDocumento(formData, `${lc}.FirmaDRO`, valorDocumento(`${lc}.FirmaDRO`));
  appendDocumento(formData, `${lc}.FirmaCorresponsable`, valorDocumento(`${lc}.FirmaCorresponsable`));
  appendDocumento(
    formData,
    `${lc}.FirmaResponsableRecepcionDocumento`,
    valorDocumento(`${lc}.FirmaResponsableRecepcionDocumento`)
  );
}

function serializarValorFormData(valor: FormDataEntryValue): unknown {
  if (valor instanceof File) {
    return { _tipo: 'archivo', nombre: valor.name, tamano: valor.size, mimeType: valor.type };
  }
  return valor;
}

export function formDataToJson(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  formData.forEach((valor, clave) => {
    if (Object.prototype.hasOwnProperty.call(payload, clave)) {
      const actual = payload[clave];
      payload[clave] = Array.isArray(actual)
        ? [...actual, serializarValorFormData(valor)]
        : [actual, serializarValorFormData(valor)];
      return;
    }
    payload[clave] = serializarValorFormData(valor);
  });
  return payload;
}

export function generarJsonEnvioLocalComercial(
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  operacion: LocalComercialOperacion,
  options: BuildLocalComercialFormDataOptions = {},
  valorDocumentoMultiple: ValorDocumentoMultipleFn = () => [],
  idRegistro?: number
): Record<string, unknown> {
  const formData =
    operacion === 'actualizar' && idRegistro != null
      ? buildLocalComercialActualizarFormData(
          idRegistro,
          form,
          valorDocumento,
          valorDocumentoMultiple
        )
      : buildLocalComercialFormData(
          form,
          valorDocumento,
          options,
          valorDocumentoMultiple
        );
  const payload = formDataToJson(formData);
  const archivosEnviados: Array<{ campo: string; nombre: string; tamano: number }> = [];
  formData.forEach((valor, clave) => {
    if (valor instanceof File) {
      archivosEnviados.push({ campo: clave, nombre: valor.name, tamano: valor.size });
    }
  });
  console.group(`[Local Comercial] Payload (${operacion})`);
  console.log('Archivos en FormData:', archivosEnviados);
  console.log('Objeto:', payload);
  console.log('JSON:', JSON.stringify(payload, null, 2));
  console.groupEnd();
  return payload;
}

export { CAMPOS_RAIZ, EXTENSIONES_PERMITIDAS, esArchivoEnviable };
