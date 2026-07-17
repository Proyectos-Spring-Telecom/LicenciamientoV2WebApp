import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { formatApiDateTime } from './documentos-local.config';

export type LocalComercialOperacion = 'agregar' | 'actualizar';

export interface BuildLocalComercialFormDataOptions {
  usarValorVacioPorDefecto?: boolean;
}

type ValorDocumentoFn = (controlPath: string) => File | string;
type ValorDocumentoMultipleFn = (controlPath: string) => Array<File | string>;

function appendCampo(
  formData: FormData,
  clave: string,
  valor: unknown,
  usarValorVacioPorDefecto: boolean
): void {
  if (valor instanceof File) {
    formData.append(clave, valor);
    return;
  }
  const normalizado = usarValorVacioPorDefecto ? (valor ?? '') : valor;
  formData.append(clave, normalizado == null ? '' : String(normalizado));
}

function appendDocumento(formData: FormData, clave: string, valor: File | string): void {
  formData.append(clave, valor ?? '');
}

function appendDocumentosMultiples(
  formData: FormData,
  clave: string,
  valores: Array<File | string> | null | undefined
): void {
  const lista = Array.isArray(valores) ? valores : [];
  if (!lista.length) {
    formData.append(clave, '');
    return;
  }
  lista.forEach((valor) => {
    formData.append(clave, valor instanceof File ? valor : (valor ?? ''));
  });
}

function asFlag01(valor: unknown): string {
  if (valor === true || valor === 1 || valor === '1' || valor === 'true') return '1';
  if (valor === false || valor === 0 || valor === '0' || valor === 'false') return '0';
  if (valor == null || valor === '') return '';
  return String(valor);
}

export function mapTipoRegistro(valor: unknown): string {
  if (valor === 'comercial' || valor === 0 || valor === '0') return '0';
  if (valor === 'vivienda' || valor === 1 || valor === '1') return '1';
  if (valor == null || valor === '') return '';
  return String(valor);
}

export function mapPredioObra(valor: unknown): string {
  return asFlag01(valor);
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
      ContactoRepresentante: fb.group({
        Nombre: [''],
        ApellidoPaterno: [''],
        ApellidoMaterno: [''],
        Telefono: [''],
        Correo: [''],
      }),
      vistoBueno: [''],
    }),
    LicenciaConstruccion: fb.group({
      TipoSolicitudLicencia: [''],
      DescripcionProyecto: [''],
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
          NombreCompleto: [''],
          NoRegLicenciaConstruccion: [''],
          CedulaProfesional: [''],
        }),
        fb.group({
          NombreCompleto: [''],
          NoRegLicenciaConstruccion: [''],
          CedulaProfesional: [''],
        }),
      ]),
      constanciaAlineamientoyNumero: [[]],
      LicenciaUsoyPlano: [[]],
      ConstanciaPropietario: [[]],
      Factibilidad: [[]],
      RecibosImpuestoPredial: [[]],
      JuegoDePlanosArquitectonicos: [[]],
      otros: [[]],
      FirmaPropietario: [''],
      FirmaDRO: [''],
      FirmaCorresponsable: [''],
      FirmaResponsableRecepcionDocumento: [''],
    }),
  });
}

/**
 * Arma multipart form-data POST /registros
 * SOLO con las claves exactas del body (Untitled-1).
 */
export function buildLocalComercialFormData(
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  options: BuildLocalComercialFormDataOptions = {},
  valorDocumentoMultiple: ValorDocumentoMultipleFn = () => []
): FormData {
  const { usarValorVacioPorDefecto: empty = true } = options;
  const v = (path: string) => form.get(path)?.value;
  const formData = new FormData();

  // Raíz
  appendCampo(formData, 'Latitud', v('Latitud'), empty);
  appendCampo(formData, 'Longitud', v('Longitud'), empty);
  appendCampo(formData, 'TipoRegistro', mapTipoRegistro(v('TipoRegistro')), empty);
  appendCampo(formData, 'PredioObra', mapPredioObra(v('PredioObra')), empty);
  appendCampo(formData, 'EntidadFederativa', v('EntidadFederativa'), empty);
  appendCampo(formData, 'Municipio', v('Municipio'), empty);
  appendCampo(formData, 'Localidad', v('Localidad'), empty);
  appendCampo(formData, 'Colonia', v('Colonia'), empty);
  appendCampo(formData, 'Calle', v('Calle'), empty);
  appendCampo(formData, 'NoInterior', v('NoInterior'), empty);
  appendCampo(formData, 'NoExterior', v('NoExterior'), empty);
  appendCampo(formData, 'CP', v('CP'), empty);

  // Sapac.*
  appendCampo(formData, 'Sapac.NumeroCuenta', v('Sapac.NumeroCuenta'), empty);
  appendCampo(formData, 'Sapac.Nombre', v('Sapac.Nombre'), empty);
  appendCampo(formData, 'Sapac.ApellidoPaterno', v('Sapac.ApellidoPaterno'), empty);
  appendCampo(formData, 'Sapac.ApellidoMaterno', v('Sapac.ApellidoMaterno'), empty);
  appendCampo(formData, 'Sapac.RFC', v('Sapac.RFC'), empty);
  appendCampo(formData, 'Sapac.Sector', v('Sapac.Sector'), empty);
  appendCampo(formData, 'Sapac.Ruta', v('Sapac.Ruta'), empty);
  appendCampo(formData, 'Sapac.Folio', v('Sapac.Folio'), empty);
  appendCampo(formData, 'Sapac.IdTipoServicio', v('Sapac.IdTipoServicio'), empty);
  appendCampo(formData, 'Sapac.Medidor', v('Sapac.Medidor'), empty);
  appendDocumento(formData, 'Sapac.reciboSapac', valorDocumento('Sapac.reciboSapac'));
  appendDocumento(formData, 'Sapac.caratulamedidor', valorDocumento('Sapac.caratulamedidor'));
  appendDocumento(formData, 'Sapac.cuadromedidor', valorDocumento('Sapac.cuadromedidor'));

  // Catastro.*
  appendCampo(formData, 'Catastro.Clave', v('Catastro.Clave'), empty);
  appendCampo(formData, 'Catastro.M2', v('Catastro.M2'), empty);
  appendCampo(formData, 'Catastro.Superficie', v('Catastro.Superficie'), empty);
  appendCampo(formData, 'Catastro.UsoSuelo', v('Catastro.UsoSuelo'), empty);
  appendDocumento(formData, 'Catastro.reciboPredial', valorDocumento('Catastro.reciboPredial'));

  // Licencias.*
  appendCampo(formData, 'Licencias.Registro', v('Licencias.Registro'), empty);
  appendCampo(formData, 'Licencias.NombreComercial', v('Licencias.NombreComercial'), empty);
  appendCampo(formData, 'Licencias.Giro', v('Licencias.Giro'), empty);
  appendCampo(formData, 'Licencias.LicenciaSuelo', v('Licencias.LicenciaSuelo'), empty);
  appendCampo(formData, 'Licencias.NombrePropietario', v('Licencias.NombrePropietario'), empty);
  appendCampo(formData, 'Licencias.ApellidoPaternoPropietario', v('Licencias.ApellidoPaternoPropietario'), empty);
  appendCampo(formData, 'Licencias.ApellidoMaternoPropietario', v('Licencias.ApellidoMaternoPropietario'), empty);
  appendCampo(formData, 'Licencias.TipoPersona', v('Licencias.TipoPersona'), empty);
  appendCampo(formData, 'Licencias.RFC', v('Licencias.RFC'), empty);
  appendCampo(formData, 'Licencias.FechaExpedicion', formatApiDateTime(v('Licencias.FechaExpedicion')), empty);
  appendCampo(formData, 'Licencias.FechaRefrendo', formatApiDateTime(v('Licencias.FechaRefrendo')), empty);
  appendCampo(formData, 'Licencias.Estacionamiento', asFlag01(v('Licencias.Estacionamiento')), empty);
  appendCampo(formData, 'Licencias.Tipo', v('Licencias.Tipo'), empty);
  appendCampo(
    formData,
    'Licencias.FechaHora',
    formatApiDateTime(v('Licencias.FechaHora')) || formatApiDateTime(new Date()),
    empty
  );
  appendCampo(formData, 'Licencias.Contacto.Nombre', v('Licencias.Contacto.Nombre'), empty);
  appendCampo(formData, 'Licencias.Contacto.ApellidoPaterno', v('Licencias.Contacto.ApellidoPaterno'), empty);
  appendCampo(formData, 'Licencias.Contacto.ApellidoMaterno', v('Licencias.Contacto.ApellidoMaterno'), empty);
  appendCampo(formData, 'Licencias.Contacto.Telefono', v('Licencias.Contacto.Telefono'), empty);
  appendCampo(formData, 'Licencias.Contacto.Correo', v('Licencias.Contacto.Correo'), empty);
  appendDocumento(formData, 'Licencias.licenciaFuncionamiento', valorDocumento('Licencias.licenciaFuncionamiento'));
  appendDocumento(formData, 'Licencias.fachada', valorDocumento('Licencias.fachada'));
  appendDocumento(formData, 'Licencias.estacionamiento', valorDocumento('Licencias.estacionamiento'));
  appendDocumento(formData, 'Licencias.bodega', valorDocumento('Licencias.bodega'));

  // ProteccionCivil.*
  appendCampo(formData, 'ProteccionCivil.EsEmpresa', asFlag01(v('ProteccionCivil.EsEmpresa')), empty);
  appendCampo(formData, 'ProteccionCivil.RazonSocial', v('ProteccionCivil.RazonSocial'), empty);
  appendCampo(formData, 'ProteccionCivil.RFC', v('ProteccionCivil.RFC'), empty);
  appendCampo(formData, 'ProteccionCivil.Nombre', v('ProteccionCivil.Nombre'), empty);
  appendCampo(formData, 'ProteccionCivil.ApellidoPaterno', v('ProteccionCivil.ApellidoPaterno'), empty);
  appendCampo(formData, 'ProteccionCivil.ApellidoMaterno', v('ProteccionCivil.ApellidoMaterno'), empty);
  appendCampo(formData, 'ProteccionCivil.Telefono', v('ProteccionCivil.Telefono'), empty);
  appendCampo(formData, 'ProteccionCivil.RegistroAcreditacion', v('ProteccionCivil.RegistroAcreditacion'), empty);
  appendCampo(formData, 'ProteccionCivil.TienePrograma', asFlag01(v('ProteccionCivil.TienePrograma')), empty);
  appendCampo(formData, 'ProteccionCivil.ContactoRepresentante.Nombre', v('ProteccionCivil.ContactoRepresentante.Nombre'), empty);
  appendCampo(formData, 'ProteccionCivil.ContactoRepresentante.ApellidoPaterno', v('ProteccionCivil.ContactoRepresentante.ApellidoPaterno'), empty);
  appendCampo(formData, 'ProteccionCivil.ContactoRepresentante.ApellidoMaterno', v('ProteccionCivil.ContactoRepresentante.ApellidoMaterno'), empty);
  appendCampo(formData, 'ProteccionCivil.ContactoRepresentante.Telefono', v('ProteccionCivil.ContactoRepresentante.Telefono'), empty);
  appendCampo(formData, 'ProteccionCivil.ContactoRepresentante.Correo', v('ProteccionCivil.ContactoRepresentante.Correo'), empty);
  appendDocumento(formData, 'ProteccionCivil.vistoBueno', valorDocumento('ProteccionCivil.vistoBueno'));

  // LicenciaConstruccion.*
  const lc = 'LicenciaConstruccion';
  appendCampo(formData, `${lc}.TipoSolicitudLicencia`, v(`${lc}.TipoSolicitudLicencia`), empty);
  appendCampo(formData, `${lc}.DescripcionProyecto`, v(`${lc}.DescripcionProyecto`), empty);
  appendCampo(formData, `${lc}.SuperficieTerrenoM2`, v(`${lc}.SuperficieTerrenoM2`), empty);
  appendCampo(formData, `${lc}.SuperficieTerrenoObraM2`, v(`${lc}.SuperficieTerrenoObraM2`), empty);
  appendCampo(formData, `${lc}.DescripcionSistemaConstructivo`, v(`${lc}.DescripcionSistemaConstructivo`), empty);
  appendCampo(formData, `${lc}.NombrePropietario`, v(`${lc}.NombrePropietario`), empty);
  appendCampo(formData, `${lc}.DomicilioNotificacion`, v(`${lc}.DomicilioNotificacion`), empty);
  appendCampo(formData, `${lc}.RFC`, v(`${lc}.RFC`), empty);
  appendCampo(formData, `${lc}.NombreDRO`, v(`${lc}.NombreDRO`), empty);
  appendCampo(formData, `${lc}.NoRegLicenciaConstruccion`, v(`${lc}.NoRegLicenciaConstruccion`), empty);
  appendCampo(formData, `${lc}.CedulaProfesional`, v(`${lc}.CedulaProfesional`), empty);
  appendCampo(formData, `${lc}.Fecha`, formatApiDateTime(v(`${lc}.Fecha`)), empty);
  appendCampo(formData, `${lc}.NumeroExpediente`, v(`${lc}.NumeroExpediente`), empty);
  appendCampo(formData, `${lc}.NumeroControl`, v(`${lc}.NumeroControl`), empty);
  appendCampo(formData, `${lc}.SeguimientoObra`, asFlag01(v(`${lc}.SeguimientoObra`)), empty);
  appendCampo(formData, `${lc}.ConstanciaAlineamiento`, asFlag01(v(`${lc}.ConstanciaAlineamiento`)), empty);
  appendCampo(formData, `${lc}.LicenciaUsoSuelo`, asFlag01(v(`${lc}.LicenciaUsoSuelo`)), empty);
  appendCampo(formData, `${lc}.PlanoAutorizado`, asFlag01(v(`${lc}.PlanoAutorizado`)), empty);
  appendCampo(formData, `${lc}.LicenciaFraccionamiento`, asFlag01(v(`${lc}.LicenciaFraccionamiento`)), empty);
  appendCampo(formData, `${lc}.Escrituras`, asFlag01(v(`${lc}.Escrituras`)), empty);
  appendCampo(formData, `${lc}.FactibilidadAguaPotable`, asFlag01(v(`${lc}.FactibilidadAguaPotable`)), empty);
  appendCampo(formData, `${lc}.RecibosPagoPredial`, asFlag01(v(`${lc}.RecibosPagoPredial`)), empty);
  appendCampo(formData, `${lc}.RecibosMunicipales`, asFlag01(v(`${lc}.RecibosMunicipales`)), empty);
  appendCampo(formData, `${lc}.PlanoArquitectonicos`, asFlag01(v(`${lc}.PlanoArquitectonicos`)), empty);
  appendCampo(formData, `${lc}.Otros`, asFlag01(v(`${lc}.Otros`)), empty);

  const corresponsables = form.get(`${lc}.Corresponsables`) as FormArray | null;
  const items = corresponsables?.controls?.length
    ? corresponsables.controls
    : [];
  for (let i = 0; i < Math.max(2, items.length); i++) {
    const item = items[i];
    appendCampo(formData, `${lc}.Corresponsables[${i}].NombreCompleto`, item?.get('NombreCompleto')?.value ?? '', empty);
    appendCampo(formData, `${lc}.Corresponsables[${i}].NoRegLicenciaConstruccion`, item?.get('NoRegLicenciaConstruccion')?.value ?? '', empty);
    appendCampo(formData, `${lc}.Corresponsables[${i}].CedulaProfesional`, item?.get('CedulaProfesional')?.value ?? '', empty);
  }

  appendDocumentosMultiples(formData, `${lc}.constanciaAlineamientoyNumero`, valorDocumentoMultiple(`${lc}.constanciaAlineamientoyNumero`));
  appendDocumentosMultiples(formData, `${lc}.LicenciaUsoyPlano`, valorDocumentoMultiple(`${lc}.LicenciaUsoyPlano`));
  appendDocumentosMultiples(formData, `${lc}.ConstanciaPropietario`, valorDocumentoMultiple(`${lc}.ConstanciaPropietario`));
  appendDocumentosMultiples(formData, `${lc}.Factibilidad`, valorDocumentoMultiple(`${lc}.Factibilidad`));
  appendDocumentosMultiples(formData, `${lc}.RecibosImpuestoPredial`, valorDocumentoMultiple(`${lc}.RecibosImpuestoPredial`));
  appendDocumentosMultiples(formData, `${lc}.JuegoDePlanosArquitectonicos`, valorDocumentoMultiple(`${lc}.JuegoDePlanosArquitectonicos`));
  appendDocumentosMultiples(formData, `${lc}.otros`, valorDocumentoMultiple(`${lc}.otros`));
  appendDocumento(formData, `${lc}.FirmaPropietario`, valorDocumento(`${lc}.FirmaPropietario`));
  appendDocumento(formData, `${lc}.FirmaDRO`, valorDocumento(`${lc}.FirmaDRO`));
  appendDocumento(formData, `${lc}.FirmaCorresponsable`, valorDocumento(`${lc}.FirmaCorresponsable`));
  appendDocumento(formData, `${lc}.FirmaResponsableRecepcionDocumento`, valorDocumento(`${lc}.FirmaResponsableRecepcionDocumento`));

  return formData;
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
  valorDocumentoMultiple: ValorDocumentoMultipleFn = () => []
): Record<string, unknown> {
  const formData = buildLocalComercialFormData(form, valorDocumento, options, valorDocumentoMultiple);
  const payload = formDataToJson(formData);
  console.group(`[Local Comercial] Payload (${operacion})`);
  console.log('Objeto:', payload);
  console.log('JSON:', JSON.stringify(payload, null, 2));
  console.groupEnd();
  return payload;
}
