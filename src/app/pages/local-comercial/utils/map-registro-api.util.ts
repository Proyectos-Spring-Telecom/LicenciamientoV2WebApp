import {
  DetalleLocal,
  DocumentoDetalleItem,
  LicenciaConstruccionDetalle,
} from '../models/detalle-local-comercial';
import { esRutaArchivoValida, toDateInputValue } from './documentos-local.config';
import { esEmpresaApiAForm } from './local-comercial-form-payload.util';

/** Desenvuelve `{ data: {...} }` o el objeto plano de GET /registros/{id}. */
export function unwrapRegistroResponse(response: any): any {
  if (!response || typeof response !== 'object') {
    return {};
  }
  if (response.data != null && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  return response;
}

/** Trata `{}`, null y '' como vacío. */
export function valorApi(valor: unknown): unknown {
  if (valor == null || valor === '') {
    return null;
  }
  if (typeof valor === 'object' && !Array.isArray(valor) && !(valor instanceof Date)) {
    if (Object.keys(valor as object).length === 0) {
      return null;
    }
  }
  return valor;
}

export function textoApi(valor: unknown): string {
  const v = valorApi(valor);
  return v == null ? '' : String(v);
}

export function numeroApi(valor: unknown): number | null {
  const v = valorApi(valor);
  if (v == null || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pick(item: any, ...keys: string[]): unknown {
  if (!item) {
    return null;
  }
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) {
      return item[key];
    }
  }
  return null;
}

function asFlag(valor: unknown): number | string {
  const v = valorApi(valor);
  if (v === true || v === 1 || v === '1' || v === 'true') {
    return 1;
  }
  if (v === false || v === 0 || v === '0' || v === 'false') {
    return 0;
  }
  return v == null ? '' : Number(v);
}

function asBoolFlag(valor: unknown): boolean {
  const v = valorApi(valor);
  return v === true || v === 1 || v === '1' || v === 'true';
}

function getBloque(api: any, camel: string, pascal: string): any {
  return api?.[pascal] ?? api?.[camel] ?? {};
}

/** URLs de documentos embebidas en Sapac/Catastro/Licencias/PC/LicenciaConstruccion. */
export function mapDocumentosFromRegistro(apiRaw: any): Record<string, string> {
  const api = unwrapRegistroResponse(apiRaw);
  const sapac = getBloque(api, 'sapac', 'Sapac');
  const catastro = getBloque(api, 'catastro', 'Catastro');
  const licencias = getBloque(api, 'licencias', 'Licencias');
  const pc = getBloque(api, 'proteccionCivil', 'ProteccionCivil');
  const urls: Record<string, string> = {};

  const setUrl = (control: string, ruta: unknown) => {
    const text = textoApi(ruta);
    if (esRutaArchivoValida(text)) {
      urls[control] = text;
    }
  };

  setUrl('Sapac.reciboSapac', pick(sapac, 'reciboSapac'));
  setUrl('Sapac.caratulamedidor', pick(sapac, 'caratulamedidor'));
  setUrl('Sapac.cuadromedidor', pick(sapac, 'cuadromedidor'));
  setUrl('Catastro.reciboPredial', pick(catastro, 'reciboPredial'));
  setUrl('Licencias.licenciaFuncionamiento', pick(licencias, 'licenciaFuncionamiento'));
  setUrl('Licencias.fachada', pick(licencias, 'fachada'));
  setUrl('Licencias.estacionamiento', pick(licencias, 'estacionamiento'));
  setUrl('Licencias.bodega', pick(licencias, 'bodega'));
  setUrl('ProteccionCivil.vistoBueno', pick(pc, 'vistoBueno'));

  const lc = getBloque(api, 'licenciaConstruccion', 'LicenciaConstruccion');

  const esRutaDocumento = (ruta: string): boolean =>
    esRutaArchivoValida(ruta) && !/^\d+$/.test(ruta) && (ruta.includes('/') || ruta.includes('.') || ruta.startsWith('http'));

  const urlsDesdeLista = (lista: unknown): string[] => {
    // Un solo string/ruta (no flag 0|1) también cuenta
    if (typeof lista === 'string' && esRutaDocumento(lista)) {
      return [lista.trim()];
    }
    const arr = Array.isArray(lista) ? lista : [];
    return arr
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object') {
          return pick(item, 'ruta', 'url', 'path', 'Ruta', 'Url');
        }
        return null;
      })
      .map((r) => textoApi(r))
      .filter((r) => esRutaDocumento(r));
  };

  const setUrlsMulti = (controls: string | string[], lista: unknown) => {
    const primera = urlsDesdeLista(lista)[0];
    if (!primera) {
      return;
    }
    const keys = Array.isArray(controls) ? controls : [controls];
    keys.forEach((control) => {
      urls[control] = primera;
    });
  };

  // Archivos LC (máx. 1) — no usar flags tinyint homónimos como URL
  const LC_TIPO_A_CONTROL: Record<number, string[]> = {
    10: ['LicenciaConstruccion.constanciaAlineamiento', 'constanciaAlineamiento'],
    29: ['LicenciaConstruccion.constanciaNumero', 'constanciaNumero'],
    11: ['LicenciaConstruccion.fileLicenciaUsoSuelo', 'permisoSuelo'],
    12: ['LicenciaConstruccion.filePlanoAutorizado', 'planoAutorizado'],
    13: ['LicenciaConstruccion.fileLicenciaFraccionamiento', 'licenciaFraccionamiento'],
    14: ['LicenciaConstruccion.ConstanciaPropietario', 'constanciaPropietario'],
    15: ['LicenciaConstruccion.Factibilidad', 'factibilidad'],
    16: ['LicenciaConstruccion.RecibosImpuestoPredial', 'recibosPredial'],
    17: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos1', 'planos1'],
    31: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos2', 'planos2'],
    32: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos3', 'planos3'],
    18: ['LicenciaConstruccion.otros', 'otrosDocs'],
    25: ['LicenciaConstruccion.FirmaPropietario'],
    26: ['LicenciaConstruccion.FirmaDRO'],
    27: ['LicenciaConstruccion.FirmaCorresponsable'],
    28: ['LicenciaConstruccion.FirmaResponsableRecepcionDocumento'],
  };

  const fotosLc = Array.isArray(api?.fotosLicenciaConstruccion)
    ? api.fotosLicenciaConstruccion
    : Array.isArray(api?.FotosLicenciaConstruccion)
      ? api.FotosLicenciaConstruccion
      : [];
  fotosLc.forEach((foto: any) => {
    const idTipo = Number(foto?.idTipoFoto ?? foto?.IdTipoFoto);
    const ruta = textoApi(pick(foto, 'ruta', 'url', 'path', 'Ruta', 'Url'));
    const controls = LC_TIPO_A_CONTROL[idTipo];
    if (!controls || !esRutaArchivoValida(ruta)) {
      return;
    }
    controls.forEach((control) => {
      urls[control] = ruta;
    });
  });

  // Fallback embebido (solo listas/rutas, no flags 0|1)
  setUrlsMulti(
    ['LicenciaConstruccion.constanciaAlineamiento', 'constanciaAlineamiento'],
    pick(lc, 'constanciaAlineamiento')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.constanciaNumero', 'constanciaNumero'],
    pick(lc, 'constanciaNumero')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.fileLicenciaUsoSuelo', 'permisoSuelo'],
    pick(lc, 'licenciaUsoSuelo', 'LicenciaUsoSuelo', 'fileLicenciaUsoSuelo')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.filePlanoAutorizado', 'planoAutorizado'],
    pick(lc, 'planoAutorizado', 'PlanoAutorizado', 'filePlanoAutorizado')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.fileLicenciaFraccionamiento', 'licenciaFraccionamiento'],
    pick(lc, 'licenciaFraccionamiento', 'LicenciaFraccionamiento', 'fileLicenciaFraccionamiento')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.ConstanciaPropietario', 'constanciaPropietario'],
    pick(lc, 'ConstanciaPropietario')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.Factibilidad', 'factibilidad'],
    pick(lc, 'Factibilidad')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.RecibosImpuestoPredial', 'recibosPredial'],
    pick(lc, 'RecibosImpuestoPredial')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.JuegoDePlanosArquitectonicos1', 'planos1'],
    pick(lc, 'JuegoDePlanosArquitectonicos1')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.JuegoDePlanosArquitectonicos2', 'planos2'],
    pick(lc, 'JuegoDePlanosArquitectonicos2')
  );
  setUrlsMulti(
    ['LicenciaConstruccion.JuegoDePlanosArquitectonicos3', 'planos3'],
    pick(lc, 'JuegoDePlanosArquitectonicos3')
  );

  const otrosUrls = urlsDesdeLista(pick(lc, 'otros'));
  if (otrosUrls.length && !urls['LicenciaConstruccion.otros']) {
    setUrl('LicenciaConstruccion.otros', otrosUrls[0]);
    setUrl('otrosDocs', otrosUrls[0]);
  }

  setUrl('LicenciaConstruccion.FirmaPropietario', pick(lc, 'FirmaPropietario'));
  setUrl('LicenciaConstruccion.FirmaDRO', pick(lc, 'FirmaDRO'));
  setUrl('LicenciaConstruccion.FirmaCorresponsable', pick(lc, 'FirmaCorresponsable'));
  setUrl(
    'LicenciaConstruccion.FirmaResponsableRecepcionDocumento',
    pick(lc, 'FirmaResponsableRecepcionDocumento')
  );

  return urls;
}

/** Documentos de Licencia de Construcción listos para la galería del detalle. */
const LC_DOC_DETALLE: Array<{ keys: string[]; titulo: string; idTipoFoto?: number }> = [
  {
    keys: ['LicenciaConstruccion.constanciaAlineamiento', 'constanciaAlineamiento'],
    titulo: 'Constancia de alineamiento',
    idTipoFoto: 10,
  },
  {
    keys: ['LicenciaConstruccion.constanciaNumero', 'constanciaNumero'],
    titulo: 'Constancia de número',
    idTipoFoto: 29,
  },
  {
    keys: ['LicenciaConstruccion.fileLicenciaUsoSuelo', 'permisoSuelo'],
    titulo: 'Licencia de uso de suelo',
    idTipoFoto: 11,
  },
  {
    keys: ['LicenciaConstruccion.filePlanoAutorizado', 'planoAutorizado'],
    titulo: 'Plano autorizado',
    idTipoFoto: 12,
  },
  {
    keys: ['LicenciaConstruccion.fileLicenciaFraccionamiento', 'licenciaFraccionamiento'],
    titulo: 'Licencia de fraccionamiento',
    idTipoFoto: 13,
  },
  {
    keys: ['LicenciaConstruccion.ConstanciaPropietario', 'constanciaPropietario'],
    titulo: 'Escrituras / constancia del propietario',
    idTipoFoto: 14,
  },
  {
    keys: ['LicenciaConstruccion.Factibilidad', 'factibilidad'],
    titulo: 'Factibilidad de agua potable',
    idTipoFoto: 15,
  },
  {
    keys: ['LicenciaConstruccion.RecibosImpuestoPredial', 'recibosPredial'],
    titulo: 'Recibos de impuesto predial',
    idTipoFoto: 16,
  },
  {
    keys: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos1', 'planos1'],
    titulo: 'Juego de planos arquitectónicos 1',
    idTipoFoto: 17,
  },
  {
    keys: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos2', 'planos2'],
    titulo: 'Juego de planos arquitectónicos 2',
    idTipoFoto: 31,
  },
  {
    keys: ['LicenciaConstruccion.JuegoDePlanosArquitectonicos3', 'planos3'],
    titulo: 'Juego de planos arquitectónicos 3',
    idTipoFoto: 32,
  },
  {
    keys: ['LicenciaConstruccion.otros', 'otrosDocs'],
    titulo: 'Otros documentos',
    idTipoFoto: 18,
  },
  {
    keys: ['LicenciaConstruccion.FirmaPropietario'],
    titulo: 'Firma del propietario',
    idTipoFoto: 25,
  },
  {
    keys: ['LicenciaConstruccion.FirmaDRO'],
    titulo: 'Firma del DRO',
    idTipoFoto: 26,
  },
  {
    keys: ['LicenciaConstruccion.FirmaCorresponsable'],
    titulo: 'Firma del corresponsable',
    idTipoFoto: 27,
  },
  {
    keys: ['LicenciaConstruccion.FirmaResponsableRecepcionDocumento'],
    titulo: 'Firma de recepción de documentos',
    idTipoFoto: 28,
  },
];

export function buildDocumentosLicenciaConstruccionDetalle(
  apiRaw: any
): DocumentoDetalleItem[] {
  const urls = mapDocumentosFromRegistro(apiRaw);
  const vistos = new Set<string>();
  const docs: DocumentoDetalleItem[] = [];

  for (const item of LC_DOC_DETALLE) {
    const ruta = item.keys.map((k) => urls[k]).find((r) => !!r);
    if (!ruta || vistos.has(ruta)) {
      continue;
    }
    vistos.add(ruta);
    docs.push({
      titulo: item.titulo,
      ruta,
      idTipoFoto: item.idTipoFoto ?? null,
    });
  }

  return docs;
}

function mapLicenciaConstruccionDetalle(api: any): LicenciaConstruccionDetalle | null {
  const lc = getBloque(api, 'licenciaConstruccion', 'LicenciaConstruccion');
  if (!lc || typeof lc !== 'object' || Object.keys(lc).length === 0) {
    return null;
  }

  const corresponsablesRaw = Array.isArray(lc.Corresponsables)
    ? lc.Corresponsables
    : Array.isArray(lc.corresponsables)
      ? lc.corresponsables
      : [];

  return {
    Id: numeroApi(pick(lc, 'Id', 'id')),
    TipoSolicitudLicencia: numeroApi(
      pick(lc, 'TipoSolicitudLicencia', 'tipoSolicitudLicencia')
    ),
    DescripcionProyecto: textoApi(pick(lc, 'DescripcionProyecto', 'descripcionProyecto')) || null,
    SuperficieTerrenoM2: numeroApi(pick(lc, 'SuperficieTerrenoM2', 'superficieTerrenoM2')),
    SuperficieTerrenoObraM2: numeroApi(
      pick(lc, 'SuperficieTerrenoObraM2', 'superficieTerrenoObraM2')
    ),
    DescripcionSistemaConstructivo:
      textoApi(pick(lc, 'DescripcionSistemaConstructivo', 'descripcionSistemaConstructivo')) ||
      null,
    NombrePropietario: textoApi(pick(lc, 'NombrePropietario', 'nombrePropietario')) || null,
    DomicilioNotificacion:
      textoApi(pick(lc, 'DomicilioNotificacion', 'domicilioNotificacion')) || null,
    RFC: textoApi(pick(lc, 'RFC', 'rfc')) || null,
    NombreDRO: textoApi(pick(lc, 'NombreDRO', 'nombreDRO')) || null,
    NoRegLicenciaConstruccion:
      textoApi(pick(lc, 'NoRegLicenciaConstruccion', 'noRegLicenciaConstruccion')) || null,
    CedulaProfesional: textoApi(pick(lc, 'CedulaProfesional', 'cedulaProfesional')) || null,
    Fecha: valorApi(pick(lc, 'Fecha', 'fecha')) as string | Date | null,
    NumeroExpediente: textoApi(pick(lc, 'NumeroExpediente', 'numeroExpediente')) || null,
    NumeroControl: textoApi(pick(lc, 'NumeroControl', 'numeroControl')) || null,
    SeguimientoObra: textoApi(pick(lc, 'SeguimientoObra', 'seguimientoObra')) || null,
    Corresponsables: corresponsablesRaw.map((c: any) => ({
      Id: numeroApi(pick(c, 'Id', 'id')),
      NombreCompleto: textoApi(pick(c, 'NombreCompleto', 'nombreCompleto')) || null,
      NoRegLicenciaConstruccion:
        textoApi(pick(c, 'NoRegLicenciaConstruccion', 'noRegLicenciaConstruccion')) || null,
      CedulaProfesional: textoApi(pick(c, 'CedulaProfesional', 'cedulaProfesional')) || null,
    })),
  };
}

const FOTO_POR_CONTROL: Record<string, number> = {
  'Licencias.licenciaFuncionamiento': 1,
  'Catastro.reciboPredial': 2,
  'Sapac.reciboSapac': 3,
  'Sapac.caratulamedidor': 4,
  'Sapac.cuadromedidor': 5,
  'Licencias.fachada': 6,
  'Licencias.estacionamiento': 7,
  'Licencias.bodega': 8,
  'ProteccionCivil.vistoBueno': 9,
};

function mergeFotosRegistro(api: any): any[] {
  const porTipo = new Map<number, any>();

  (Array.isArray(api?.fotos) ? api.fotos : []).forEach((f: any) => {
    const idTipo = Number(f?.idTipoFoto);
    if (!Number.isFinite(idTipo)) {
      return;
    }
    porTipo.set(idTipo, {
      id: f?.id,
      idRegistro: f?.idRegistro,
      ruta: f?.ruta,
      fechaHora: f?.fechaHora,
      idTipoFoto: idTipo,
      tipoFoto: f?.tipoFoto,
    });
  });

  const docs = mapDocumentosFromRegistro(api);
  Object.entries(docs).forEach(([control, ruta]) => {
    const idTipo = FOTO_POR_CONTROL[control];
    if (idTipo == null) {
      return;
    }
    const actual = porTipo.get(idTipo);
    if (!actual || !esRutaArchivoValida(actual.ruta)) {
      porTipo.set(idTipo, {
        ...(actual || {}),
        ruta,
        idTipoFoto: idTipo,
        idRegistro: api?.id,
      });
    }
  });

  return Array.from(porTipo.values()).sort(
    (a, b) => Number(a.idTipoFoto) - Number(b.idTipoFoto)
  );
}

function mapCorresponsablesApi(lc: any): Array<{
  Id: number | null;
  NombreCompleto: string;
  NoRegLicenciaConstruccion: string;
  CedulaProfesional: string;
}> {
  const lista = pick(lc, 'Corresponsables', 'corresponsables');
  if (!Array.isArray(lista)) {
    return [];
  }
  return lista.map((item: any) => ({
    Id: numeroApi(pick(item, 'Id', 'id')) ?? null,
    NombreCompleto: textoApi(pick(item, 'NombreCompleto', 'nombreCompleto')),
    NoRegLicenciaConstruccion: textoApi(
      pick(item, 'NoRegLicenciaConstruccion', 'noRegLicenciaConstruccion')
    ),
    CedulaProfesional: textoApi(pick(item, 'CedulaProfesional', 'cedulaProfesional')),
  }));
}

function mapLicenciaConstruccionPatch(api: any): Record<string, unknown> {
  const lc = getBloque(api, 'licenciaConstruccion', 'LicenciaConstruccion');
  if (!lc || typeof lc !== 'object') {
    return {};
  }
  return {
    TipoSolicitudLicencia: numeroApi(pick(lc, 'TipoSolicitudLicencia', 'tipoSolicitudLicencia')) ?? '',
    DescripcionProyecto: textoApi(pick(lc, 'DescripcionProyecto', 'descripcionProyecto')),
    SuperficieTerrenoM2: numeroApi(pick(lc, 'SuperficieTerrenoM2', 'superficieTerrenoM2')) ?? '',
    SuperficieTerrenoObraM2:
      numeroApi(pick(lc, 'SuperficieTerrenoObraM2', 'superficieTerrenoObraM2')) ?? '',
    DescripcionSistemaConstructivo: textoApi(
      pick(lc, 'DescripcionSistemaConstructivo', 'descripcionSistemaConstructivo')
    ),
    NombrePropietario: textoApi(pick(lc, 'NombrePropietario', 'nombrePropietario')),
    DomicilioNotificacion: textoApi(pick(lc, 'DomicilioNotificacion', 'domicilioNotificacion')),
    RFC: textoApi(pick(lc, 'RFC', 'rfc')),
    NombreDRO: textoApi(pick(lc, 'NombreDRO', 'nombreDRO')),
    NoRegLicenciaConstruccion: textoApi(
      pick(lc, 'NoRegLicenciaConstruccion', 'noRegLicenciaConstruccion')
    ),
    CedulaProfesional: textoApi(pick(lc, 'CedulaProfesional', 'cedulaProfesional')),
    Fecha: toDateInputValue(valorApi(pick(lc, 'Fecha', 'fecha')) as any),
    NumeroExpediente: textoApi(pick(lc, 'NumeroExpediente', 'numeroExpediente')),
    NumeroControl: textoApi(pick(lc, 'NumeroControl', 'numeroControl')),
    SeguimientoObra: textoApi(pick(lc, 'SeguimientoObra', 'seguimientoObra')),
    ConstanciaAlineamiento: asFlag(pick(lc, 'ConstanciaAlineamiento', 'constanciaAlineamiento')),
    LicenciaUsoSuelo: asFlag(pick(lc, 'LicenciaUsoSuelo', 'licenciaUsoSuelo')),
    PlanoAutorizado: asFlag(pick(lc, 'PlanoAutorizado', 'planoAutorizado')),
    LicenciaFraccionamiento: asFlag(pick(lc, 'LicenciaFraccionamiento', 'licenciaFraccionamiento')),
    Escrituras: asFlag(pick(lc, 'Escrituras', 'escrituras')),
    FactibilidadAguaPotable: asFlag(pick(lc, 'FactibilidadAguaPotable', 'factibilidadAguaPotable')),
    RecibosPagoPredial: asFlag(pick(lc, 'RecibosPagoPredial', 'recibosPagoPredial')),
    RecibosMunicipales: asFlag(pick(lc, 'RecibosMunicipales', 'recibosMunicipales')),
    PlanoArquitectonicos: asFlag(pick(lc, 'PlanoArquitectonicos', 'planoArquitectonicos')),
    Otros: asFlag(pick(lc, 'Otros')),
    Corresponsables: mapCorresponsablesApi(lc),
  };
}

/**
 * patchValue 1:1 con createRegistrosFormGroup desde GET /registros/{id}.
 */
export function mapRegistroToFormPatch(apiRaw: any): Record<string, unknown> {
  const api = unwrapRegistroResponse(apiRaw);
  const sapac = getBloque(api, 'sapac', 'Sapac');
  const catastro = getBloque(api, 'catastro', 'Catastro');
  const licencias = getBloque(api, 'licencias', 'Licencias');
  const contacto = getBloque(licencias, 'contacto', 'Contacto');
  const pc = getBloque(api, 'proteccionCivil', 'ProteccionCivil');
  const pcContacto = getBloque(pc, 'contactoRepresentante', 'ContactoRepresentante');
  const licenciaConstruccion = mapLicenciaConstruccionPatch(api);

  return {
    Latitud: textoApi(pick(api, 'latitud', 'Latitud', 'lat', 'Lat')),
    Longitud: textoApi(pick(api, 'longitud', 'Longitud', 'lng', 'Lng')),
    TipoRegistro: numeroApi(pick(api, 'tipoRegistro', 'TipoRegistro')) ?? 0,
    PredioObra: numeroApi(pick(api, 'predioObra', 'PredioObra')) ?? 0,
    EntidadFederativa: textoApi(pick(api, 'entidadFederativa', 'EntidadFederativa')),
    Municipio: textoApi(pick(api, 'municipio', 'Municipio')),
    Localidad: textoApi(pick(api, 'localidad', 'Localidad')),
    Colonia: textoApi(pick(api, 'colonia', 'Colonia')),
    Calle: textoApi(pick(api, 'calle', 'Calle')),
    NoInterior: textoApi(pick(api, 'noInterior', 'NoInterior')),
    NoExterior: textoApi(pick(api, 'noExterior', 'NoExterior')),
    CP: textoApi(pick(api, 'cp', 'CP', 'Cp')),
    Sapac: {
      NumeroCuenta: textoApi(pick(sapac, 'NumeroCuenta', 'numeroCuenta')),
      Nombre: textoApi(pick(sapac, 'Nombre', 'nombre')),
      ApellidoPaterno: textoApi(pick(sapac, 'ApellidoPaterno', 'apellidoPaterno')),
      ApellidoMaterno: textoApi(pick(sapac, 'ApellidoMaterno', 'apellidoMaterno')),
      RFC: textoApi(pick(sapac, 'RFC', 'rfc')),
      Sector: textoApi(pick(sapac, 'Sector', 'sector')),
      Ruta: textoApi(pick(sapac, 'Ruta', 'ruta')),
      Folio: textoApi(pick(sapac, 'Folio', 'folio')),
      IdTipoServicio: numeroApi(pick(sapac, 'IdTipoServicio', 'idTipoServicio')) ?? '',
      Medidor: textoApi(pick(sapac, 'Medidor', 'medidor')),
    },
    Catastro: {
      Clave: textoApi(pick(catastro, 'Clave', 'clave')),
      M2: textoApi(pick(catastro, 'M2', 'm2')),
      Superficie: textoApi(pick(catastro, 'Superficie', 'superficie')),
      UsoSuelo: textoApi(pick(catastro, 'UsoSuelo', 'usoSuelo')),
    },
    Licencias: {
      Registro: textoApi(pick(licencias, 'Registro', 'registro')),
      NombreComercial: textoApi(pick(licencias, 'NombreComercial', 'nombreComercial')),
      Giro: textoApi(pick(licencias, 'Giro', 'giro')),
      LicenciaSuelo: textoApi(pick(licencias, 'LicenciaSuelo', 'licenciaSuelo')),
      NombrePropietario: textoApi(pick(licencias, 'NombrePropietario', 'nombrePropietario')),
      ApellidoPaternoPropietario: textoApi(
        pick(licencias, 'ApellidoPaternoPropietario', 'apellidoPaternoPropietario')
      ),
      ApellidoMaternoPropietario: textoApi(
        pick(licencias, 'ApellidoMaternoPropietario', 'apellidoMaternoPropietario')
      ),
      TipoPersona: numeroApi(pick(licencias, 'TipoPersona', 'tipoPersona')) ?? '',
      RFC: textoApi(pick(licencias, 'RFC', 'rfc')),
      FechaExpedicion: toDateInputValue(
        valorApi(pick(licencias, 'FechaExpedicion', 'fechaExpedicion')) as any
      ),
      FechaRefrendo: toDateInputValue(
        valorApi(pick(licencias, 'FechaRefrendo', 'fechaRefrendo')) as any
      ),
      // Flag numérico PascalCase (no confundir con URL `estacionamiento`)
      Estacionamiento: asFlag(pick(licencias, 'Estacionamiento')),
      Tipo: numeroApi(pick(licencias, 'Tipo', 'tipo')) ?? 1,
      FechaHora: valorApi(pick(licencias, 'FechaHora', 'fechaHora')),
      Contacto: {
        Nombre: textoApi(pick(contacto, 'Nombre', 'nombre')),
        ApellidoPaterno: textoApi(pick(contacto, 'ApellidoPaterno', 'apellidoPaterno')),
        ApellidoMaterno: textoApi(pick(contacto, 'ApellidoMaterno', 'apellidoMaterno')),
        Telefono: textoApi(pick(contacto, 'Telefono', 'telefono')),
        Correo: textoApi(pick(contacto, 'Correo', 'correo', 'email')),
      },
    },
    ProteccionCivil: {
      EsEmpresa: esEmpresaApiAForm(pick(pc, 'EsEmpresa', 'esEmpresa')),
      RazonSocial: textoApi(pick(pc, 'RazonSocial', 'razonSocial')),
      RFC: textoApi(pick(pc, 'RFC', 'rfc')),
      Nombre: textoApi(pick(pc, 'Nombre', 'nombre')),
      ApellidoPaterno: textoApi(pick(pc, 'ApellidoPaterno', 'apellidoPaterno')),
      ApellidoMaterno: textoApi(pick(pc, 'ApellidoMaterno', 'apellidoMaterno')),
      Telefono: textoApi(pick(pc, 'Telefono', 'telefono')),
      RegistroAcreditacion: textoApi(pick(pc, 'RegistroAcreditacion', 'registroAcreditacion')),
      TienePrograma: asFlag(pick(pc, 'TienePrograma', 'tienePrograma')),
      ContactoRepresentante: {
        Nombre: textoApi(pick(pcContacto, 'Nombre', 'nombre')),
        ApellidoPaterno: textoApi(pick(pcContacto, 'ApellidoPaterno', 'apellidoPaterno')),
        ApellidoMaterno: textoApi(pick(pcContacto, 'ApellidoMaterno', 'apellidoMaterno')),
        Telefono: textoApi(pick(pcContacto, 'Telefono', 'telefono')),
        Correo: textoApi(pick(pcContacto, 'Correo', 'correo', 'email')),
      },
    },
    ...(Object.keys(licenciaConstruccion).length
      ? { LicenciaConstruccion: licenciaConstruccion }
      : {}),
  };
}

const NOMBRE_ESTATUS: Record<number, string> = {
  1: 'Información Faltante',
  2: 'Rechazo o Sin respuesta',
  3: 'Datos Correctos',
  4: 'Revisión',
  5: 'Baja',
};

const NOMBRE_TIPO_SERVICIO: Record<number, string> = {
  1: 'Doméstico',
  2: 'Comercial',
  3: 'Industrial',
  4: 'Público',
};

/** Mapea GET /registros/{id} al modelo de la vista detalle. */
export function mapRegistroToDetalleLocal(apiRaw: any): DetalleLocal {
  const api = unwrapRegistroResponse(apiRaw);
  const sapac = getBloque(api, 'sapac', 'Sapac');
  const catastro = getBloque(api, 'catastro', 'Catastro');
  const licencias = getBloque(api, 'licencias', 'Licencias');
  const contacto = getBloque(licencias, 'contacto', 'Contacto');
  const pc = getBloque(api, 'proteccionCivil', 'ProteccionCivil');
  const pcContacto = getBloque(pc, 'contactoRepresentante', 'ContactoRepresentante');

  const entidad = textoApi(pick(api, 'entidadFederativa', 'EntidadFederativa'));
  const municipio = textoApi(pick(api, 'municipio', 'Municipio'));
  const localidad = textoApi(pick(api, 'localidad', 'Localidad'));
  const colonia = textoApi(pick(api, 'colonia', 'Colonia'));
  const calle = textoApi(pick(api, 'calle', 'Calle'));
  const noInterior = textoApi(pick(api, 'noInterior', 'NoInterior'));
  const noExterior = textoApi(pick(api, 'noExterior', 'NoExterior'));
  const cpRaw = textoApi(pick(api, 'cp', 'CP', 'Cp'));
  const cpNum = numeroApi(cpRaw);
  const estatus = numeroApi(pick(api, 'estatus', 'Estatus'));
  const idTipoServicio = numeroApi(pick(sapac, 'IdTipoServicio', 'idTipoServicio'));
  const estacionamiento = asBoolFlag(pick(licencias, 'Estacionamiento'));
  const tienePrograma = asBoolFlag(pick(pc, 'TienePrograma', 'tienePrograma'));
  const esEmpresa = asBoolFlag(pick(pc, 'EsEmpresa', 'esEmpresa'));
  const fotos = mergeFotosRegistro(api);
  const predioObra = numeroApi(pick(api, 'predioObra', 'PredioObra')) ?? 0;
  const licenciaConstruccion = mapLicenciaConstruccionDetalle(api);
  const documentosLicenciaConstruccion = buildDocumentosLicenciaConstruccionDetalle(api);

  return {
    id: numeroApi(pick(api, 'id', 'Id')) ?? undefined,
    registro: textoApi(pick(licencias, 'Registro', 'registro') ?? pick(api, 'registro')),
    lat: numeroApi(pick(api, 'latitud', 'Latitud')) ?? undefined,
    lng: numeroApi(pick(api, 'longitud', 'Longitud')) ?? undefined,
    predioObra,
    licenciaConstruccion,
    documentosLicenciaConstruccion,
    estatus: estatus ?? undefined,
    nombreEstatus:
      textoApi(pick(api, 'nombreEstatus', 'NombreEstatus')) ||
      (estatus != null ? NOMBRE_ESTATUS[estatus] ?? '' : ''),
    nombreComercial: textoApi(pick(licencias, 'NombreComercial', 'nombreComercial')),
    nombreGiro: textoApi(pick(licencias, 'Giro', 'giro')),
    rfc: textoApi(pick(licencias, 'RFC', 'rfc')),
    nombre: textoApi(pick(licencias, 'NombrePropietario', 'nombrePropietario')),
    apellidoPaterno: textoApi(
      pick(licencias, 'ApellidoPaternoPropietario', 'apellidoPaternoPropietario')
    ),
    apellidoMaterno: textoApi(
      pick(licencias, 'ApellidoMaternoPropietario', 'apellidoMaternoPropietario')
    ),
    tipoPersona: numeroApi(pick(licencias, 'TipoPersona', 'tipoPersona')) ?? undefined,
    licenciaSuelo: textoApi(pick(licencias, 'LicenciaSuelo', 'licenciaSuelo')),
    fechaExpedicion: valorApi(pick(licencias, 'FechaExpedicion', 'fechaExpedicion')),
    fechaRefrendo: valorApi(pick(licencias, 'FechaRefrendo', 'fechaRefrendo')),
    fechaHora: valorApi(
      pick(licencias, 'FechaHora', 'fechaHora') ?? pick(api, 'fechaCreacion', 'fechaHora')
    ),
    estacionamiento,
    numeroCuenta: textoApi(pick(sapac, 'NumeroCuenta', 'numeroCuenta')),
    nombreSapac: textoApi(pick(sapac, 'Nombre', 'nombre')),
    apellidoPaternoSapac: textoApi(pick(sapac, 'ApellidoPaterno', 'apellidoPaterno')),
    apellidoMaternoSapac: textoApi(pick(sapac, 'ApellidoMaterno', 'apellidoMaterno')),
    rfcsapac: textoApi(pick(sapac, 'RFC', 'rfc')),
    sector: textoApi(pick(sapac, 'Sector', 'sector')),
    ruta: textoApi(pick(sapac, 'Ruta', 'ruta')),
    folio: textoApi(pick(sapac, 'Folio', 'folio')),
    idTipoServicio: idTipoServicio ?? undefined,
    nombreTipoServicio:
      idTipoServicio != null ? NOMBRE_TIPO_SERVICIO[idTipoServicio] ?? '' : '',
    medidor: textoApi(pick(sapac, 'Medidor', 'medidor')),
    clave: textoApi(pick(catastro, 'Clave', 'clave')) as any,
    m2: numeroApi(pick(catastro, 'M2', 'm2')) ?? undefined,
    superficie: textoApi(pick(catastro, 'Superficie', 'superficie')),
    usoSuelo: textoApi(pick(catastro, 'UsoSuelo', 'usoSuelo')),
    EsEmpresa: esEmpresa,
    NombreProteccionCivil: textoApi(pick(pc, 'Nombre', 'nombre')),
    ApellidoPaternoProteccionCivil: textoApi(pick(pc, 'ApellidoPaterno', 'apellidoPaterno')),
    ApellidoMaternoProteccionCivil: textoApi(pick(pc, 'ApellidoMaterno', 'apellidoMaterno')),
    TelefonoProteccionCivil: textoApi(pick(pc, 'Telefono', 'telefono')) as any,
    RegistroAcreditacion: textoApi(pick(pc, 'RegistroAcreditacion', 'registroAcreditacion')),
    TienePrograma: tienePrograma,
    VistoBueno: textoApi(pick(pc, 'vistoBueno')),
    RfcProteccionCivil: textoApi(pick(pc, 'RFC', 'rfc')),
    razonSocial: textoApi(pick(pc, 'RazonSocial', 'razonSocial')),
    direccion: {
      nombreEntidadFederativaLicencia: entidad || null,
      nombreMuncipioLicencia: municipio || null,
      nombreLocalidadLicencia: localidad || null,
      nombreColoniaLicencia: colonia || null,
      nombreCalleLicencia: calle || null,
      noInteriorLicencia: noInterior || null,
      noExteriorLicencia: noExterior || null,
      cpLicencia: (cpNum ?? (cpRaw || null)) as any,
    } as any,
    direccionSapac: {
      nombreEntidadFederativaSapac: entidad || null,
      nombreMuncipioSapac: municipio || null,
      nombreLocalidadSapac: localidad || null,
      nombreColoniaSapac: colonia || null,
      nombreCalleSapac: calle || null,
      noInteriorSapac: noInterior || null,
      noExteriorSapac: noExterior || null,
      cpSapac: (cpNum ?? (cpRaw || null)) as any,
    } as any,
    contacto: {
      contactoNombre: textoApi(pick(contacto, 'Nombre', 'nombre')),
      contactoPaterno: textoApi(pick(contacto, 'ApellidoPaterno', 'apellidoPaterno')),
      contactoMaterno: textoApi(pick(contacto, 'ApellidoMaterno', 'apellidoMaterno')),
      contactoTelefono: textoApi(pick(contacto, 'Telefono', 'telefono')),
      contactoEmail: textoApi(pick(contacto, 'Correo', 'correo')),
    },
    representante: {
      representanteLegalNombre: textoApi(
        pick(pcContacto, 'Nombre', 'nombre') || pick(pc, 'Nombre', 'nombre')
      ),
      representanteLegalPaterno: textoApi(
        pick(pcContacto, 'ApellidoPaterno', 'apellidoPaterno') ||
          pick(pc, 'ApellidoPaterno', 'apellidoPaterno')
      ),
      representanteLegalMaterno: textoApi(
        pick(pcContacto, 'ApellidoMaterno', 'apellidoMaterno') ||
          pick(pc, 'ApellidoMaterno', 'apellidoMaterno')
      ),
      representanteLegalTelefono: textoApi(
        pick(pcContacto, 'Telefono', 'telefono') || pick(pc, 'Telefono', 'telefono')
      ),
      representanteLegalEmail: textoApi(pick(pcContacto, 'Correo', 'correo')),
    } as any,
    proteccionCivil: {
      esEmpresa,
      nombre: textoApi(pick(pc, 'Nombre', 'nombre')),
      apellidoPaterno: textoApi(pick(pc, 'ApellidoPaterno', 'apellidoPaterno')),
      apellidoMaterno: textoApi(pick(pc, 'ApellidoMaterno', 'apellidoMaterno')),
      telefono: textoApi(pick(pc, 'Telefono', 'telefono')) as any,
      razonSocial: textoApi(pick(pc, 'RazonSocial', 'razonSocial')) || null,
      rfc: textoApi(pick(pc, 'RFC', 'rfc')) || null,
      registroAcreditacion:
        textoApi(pick(pc, 'RegistroAcreditacion', 'registroAcreditacion')) || null,
      tienePrograma,
      vistoBueno: textoApi(pick(pc, 'vistoBueno')) || null,
    },
    fotos,
  } as DetalleLocal;
}
