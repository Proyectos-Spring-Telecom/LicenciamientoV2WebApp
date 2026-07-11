import { FormGroup } from '@angular/forms';
import { formatApiDateTime } from './documentos-local.config';

export type LocalComercialOperacion = 'agregar' | 'actualizar';

export interface BuildLocalComercialFormDataOptions {
  id?: number | string;
  usarValorVacioPorDefecto?: boolean;
}

type ValorDocumentoFn = (controlName: string) => File | string;

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

function appendDocumento(
  formData: FormData,
  clave: string,
  valor: File | string
): void {
  formData.append(clave, valor);
}

export function buildLocalComercialFormData(
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  options: BuildLocalComercialFormDataOptions = {}
): FormData {
  const { id, usarValorVacioPorDefecto = false } = options;
  const valor = (campo: string) => form.get(campo)?.value;
  const formData = new FormData();

  appendCampo(formData, 'NumeroCuenta', valor('NumeroCuenta'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreSapac', valor('NombreSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoPaternoSapac', valor('ApellidoPaternoSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoMaternoSapac', valor('ApellidoMaternoSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RfcSapac', valor('RfcSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdEntidadFederativaSapac', valor('IdEntidadFederativaSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdMunicipioSapac', valor('IdMunicipioSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdLocalidadSapac', valor('IdLocalidadSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdColoniaSapac', valor('IdColoniaSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdColoniaLicencia', valor('IdColoniaLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdCalleSapac', valor('IdCalleSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreLocalidadSapac', valor('NombreLocalidadSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreColoniaSapac', valor('NombreColoniaSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreCalleSapac', valor('NombreCalleSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NoInteriorSapac', valor('NoInteriorSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NoExteriorSapac', valor('NoExteriorSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'CPSapac', valor('CPSapac'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Sector', valor('Sector'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Ruta', valor('Ruta'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Folio', valor('Folio'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdTipoServicio', valor('IdTipoServicio'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Tipo', valor('Tipo'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Medidor', valor('Medidor'), usarValorVacioPorDefecto);
  appendDocumento(formData, 'ReciboSapac', valorDocumento('ReciboSapac'));
  appendDocumento(formData, 'CaratulaMedidor', valorDocumento('CaratulaMedidor'));
  appendDocumento(formData, 'CuadroMedidor', valorDocumento('CuadroMedidor'));
  appendCampo(formData, 'Clave', valor('Clave'), usarValorVacioPorDefecto);
  appendCampo(formData, 'M2', valor('M2'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Superficie', valor('Superficie'), usarValorVacioPorDefecto);
  appendCampo(formData, 'UsoSuelo', valor('UsoSuelo'), usarValorVacioPorDefecto);
  appendDocumento(formData, 'ReciboPredial', valorDocumento('ReciboPredial'));
  appendCampo(formData, 'Registro', valor('Registro'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreComercial', valor('NombreComercial'), usarValorVacioPorDefecto);
  appendCampo(formData, 'LicenciaSuelo', valor('LicenciaSuelo'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdGiro', valor('IdGiro'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Nombre', valor('Nombre'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoPaterno', valor('ApellidoPaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoMaterno', valor('ApellidoMaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'TipoPersona', valor('TipoPersona'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ContactoNombre', valor('ContactoNombre'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ContactoPaterno', valor('ContactoPaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ContactoMaterno', valor('ContactoMaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RFC', valor('RFC'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RazonSocial', valor('RazonSocial'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RepresentanteLegalNombre', valor('RepresentanteLegalNombre'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RepresentanteLegalPaterno', valor('RepresentanteLegalPaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RepresentanteLegalMaterno', valor('RepresentanteLegalMaterno'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RepresentanteLegalTelefono', valor('RepresentanteLegalTelefono'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RepresentanteLegalEmail', valor('RepresentanteLegalEmail'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ContactoTelefono', valor('ContactoTelefono'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ContactoEmail', valor('ContactoEmail'), usarValorVacioPorDefecto);
  appendCampo(formData, 'FechaExpedicion', formatApiDateTime(form.get('FechaExpedicion')?.value), usarValorVacioPorDefecto);
  appendCampo(formData, 'FechaRefrendo', formatApiDateTime(form.get('FechaRefrendo')?.value), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdEntidadFederativaLicencia', valor('IdEntidadFederativaLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdMunicipioLicencia', valor('IdMunicipioLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdLocalidadLicencia', valor('IdLocalidadLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdColoniaLicencia', valor('IdColoniaLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'IdCalleLicencia', valor('IdCalleLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreLocalidadLicencia', valor('NombreLocalidadLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreColoniaLicencia', valor('NombreColoniaLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreCalleLicencia', valor('NombreCalleLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NoInteriorLicencia', valor('NoInteriorLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NoExteriorLicencia', valor('NoExteriorLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'CPLicencia', valor('CPLicencia'), usarValorVacioPorDefecto);
  appendCampo(formData, 'TieneEstacionamiento', valor('TieneEstacionamiento'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Lat', valor('Lat'), usarValorVacioPorDefecto);
  appendCampo(formData, 'Lng', valor('Lng'), usarValorVacioPorDefecto);
  appendDocumento(formData, 'LicenciaFuncionamiento', valorDocumento('LicenciaFuncionamiento'));
  appendDocumento(formData, 'FachadaEstablecimiento', valorDocumento('FachadaEstablecimiento'));
  appendDocumento(formData, 'EstacionamientoIMG', valorDocumento('EstacionamientoIMG'));
  appendDocumento(formData, 'Bodega', valorDocumento('Bodega'));
  appendCampo(formData, 'EsEmpresa', valor('EsEmpresa'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RfcProteccionCivil', valor('RfcProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RazonSocialProteccionCivil', valor('RazonSocialProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'NombreProteccionCivil', valor('NombreProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoPaternoProteccionCivil', valor('ApellidoPaternoProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'ApellidoMaternoProteccionCivil', valor('ApellidoMaternoProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'TelefonoProteccionCivil', valor('TelefonoProteccionCivil'), usarValorVacioPorDefecto);
  appendCampo(formData, 'RegistroAcreditacion', valor('RegistroAcreditacion'), usarValorVacioPorDefecto);
  appendCampo(formData, 'TienePrograma', valor('TienePrograma'), usarValorVacioPorDefecto);
  appendDocumento(formData, 'VistoBueno', valorDocumento('VistoBueno'));

  if (id !== undefined && id !== null && id !== '') {
    appendCampo(formData, 'id', id, usarValorVacioPorDefecto);
  }

  return formData;
}

function serializarValorFormData(valor: FormDataEntryValue): unknown {
  if (valor instanceof File) {
    return {
      _tipo: 'archivo',
      nombre: valor.name,
      tamano: valor.size,
      mimeType: valor.type,
    };
  }
  return valor;
}

export function formDataToJson(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  formData.forEach((valor, clave) => {
    payload[clave] = serializarValorFormData(valor);
  });
  return payload;
}

export function generarJsonEnvioLocalComercial(
  form: FormGroup,
  valorDocumento: ValorDocumentoFn,
  operacion: LocalComercialOperacion,
  options: BuildLocalComercialFormDataOptions = {}
): Record<string, unknown> {
  const formData = buildLocalComercialFormData(form, valorDocumento, options);
  const payload = formDataToJson(formData);
  const json = JSON.stringify(payload, null, 2);

  console.group(`[Local Comercial] Payload (${operacion})`);
  console.log('Objeto:', payload);
  console.log('JSON:', json);
  console.groupEnd();

  return payload;
}
