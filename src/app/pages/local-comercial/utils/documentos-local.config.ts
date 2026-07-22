import { fotos } from '../models/detalle-local-comercial';

export type DocumentoTab = 'sapac' | 'catastral' | 'licenciamiento' | 'proteccion';

export interface DocumentoLocalConfig {
  controlName: string;
  titulo: string;
  idTipoFoto: number;
  buttonClass: string;
  tab: DocumentoTab;
  uploadTitle: string;
  icon: string;
  accept: string;
  badgeDefault: string;
}

const DOCUMENTO_DEFAULTS = {
  accept: 'image/png,image/jpeg,.png,.jpg,.jpeg,.pdf,application/pdf',
  badgeDefault: 'PNG · JPG · JPEG · PDF · Máx. 3 MB',
  uploadTitle: 'Sube imagen o PDF',
};

export const DOCUMENTOS_LOCAL: DocumentoLocalConfig[] = [
  { controlName: 'Sapac.reciboSapac', titulo: 'RECIBO SAPAC', idTipoFoto: 3, buttonClass: 'success', tab: 'sapac', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Sapac.caratulamedidor', titulo: 'CARÁTULA MEDIDOR', idTipoFoto: 4, buttonClass: 'primary', tab: 'sapac', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Sapac.cuadromedidor', titulo: 'CUADRO MEDIDOR', idTipoFoto: 5, buttonClass: 'warning', tab: 'sapac', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Catastro.reciboPredial', titulo: 'RECIBO PREDIAL', idTipoFoto: 2, buttonClass: 'success', tab: 'catastral', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Licencias.licenciaFuncionamiento', titulo: 'LICENCIA DE FUNCIONAMIENTO', idTipoFoto: 1, buttonClass: 'success', tab: 'licenciamiento', icon: 'description', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Licencias.fachada', titulo: 'FACHADA DEL ESTABLECIMIENTO', idTipoFoto: 6, buttonClass: 'primary', tab: 'licenciamiento', icon: 'fa-shop', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Licencias.bodega', titulo: 'BODEGA', idTipoFoto: 8, buttonClass: 'warning', tab: 'licenciamiento', icon: 'fa-warehouse', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Licencias.estacionamiento', titulo: 'ESTACIONAMIENTO', idTipoFoto: 7, buttonClass: 'danger', tab: 'licenciamiento', icon: 'fa-car', ...DOCUMENTO_DEFAULTS },
  { controlName: 'ProteccionCivil.vistoBueno', titulo: 'VISTO BUENO', idTipoFoto: 9, buttonClass: 'success', tab: 'proteccion', icon: 'description', ...DOCUMENTO_DEFAULTS },
];

export const DOCUMENTOS_SAPAC = DOCUMENTOS_LOCAL.filter((d) => d.tab === 'sapac');
export const DOCUMENTOS_CATASTRAL = DOCUMENTOS_LOCAL.filter((d) => d.tab === 'catastral');
export const DOCUMENTOS_LICENCIAMIENTO = DOCUMENTOS_LOCAL.filter((d) => d.tab === 'licenciamiento');
export const DOCUMENTOS_PROTECCION = DOCUMENTOS_LOCAL.filter((d) => d.tab === 'proteccion');

const CONTROL_BY_TIPO_FOTO = DOCUMENTOS_LOCAL.reduce((acc, doc) => {
  acc[doc.idTipoFoto] = doc.controlName;
  return acc;
}, {} as Record<number, string>);

export const OTRO_ID_CATALOGO = ' ';

export function resolverIdCatalogoDesdeApi(
  id: unknown,
  nombre?: string | null,
  otroId: unknown = OTRO_ID_CATALOGO
): unknown {
  const tieneId = id !== null && id !== undefined && id !== '' && id !== otroId;
  if (tieneId) {
    return id;
  }
  return nombre?.trim() ? otroId : (id ?? null);
}

export function esRutaArchivoValida(ruta?: string | null): boolean {
  if (!ruta || typeof ruta !== 'string') {
    return false;
  }
  const value = ruta.trim();
  return !!value && value !== 'null' && value !== 'undefined';
}

export function mapFotosToUrls(fotosLista: fotos[]): Record<string, string> {
  const urls: Record<string, string> = {};
  (fotosLista || []).forEach((foto) => {
    const idTipo = foto.idTipoFoto;
    if (idTipo == null) {
      return;
    }
    const controlName = CONTROL_BY_TIPO_FOTO[idTipo];
    if (controlName && esRutaArchivoValida(foto.ruta)) {
      urls[controlName] = String(foto.ruta).trim();
    }
  });
  return urls;
}

export function resolverValorDocumentoFormData(
  valorControl: unknown,
  urlExistente?: string | null,
  conservarUrlRemota = false
): File | string {
  if (valorControl instanceof File) {
    return valorControl;
  }
  if (conservarUrlRemota && urlExistente) {
    const url = urlExistente.trim();
    if (url && !url.startsWith('blob:')) {
      return url;
    }
  }
  if (valorControl === null || valorControl === undefined) {
    return '';
  }
  return String(valorControl);
}

export function tieneDocumentoAdjunto(
  valorControl: unknown,
  urlExistente?: string | null
): boolean {
  if (valorControl instanceof File) {
    return true;
  }

  if (typeof valorControl === 'string') {
    const valor = valorControl.trim();
    if (valor && valor !== 'null' && valor !== 'undefined' && !valor.startsWith('blob:')) {
      return true;
    }
  }

  const url = urlExistente?.trim();
  return !!url && !url.startsWith('blob:');
}

export function tieneCoordenadasValidas(lat: unknown, lng: unknown): boolean {
  const latitud = lat === null || lat === undefined ? '' : String(lat).trim();
  const longitud = lng === null || lng === undefined ? '' : String(lng).trim();
  return latitud !== '' && longitud !== '';
}


/** Extrae yyyy-MM-dd del texto sin usar Date (evita desfase por zona horaria). */
function extraerFechaCalendario(value: unknown): { y: number; m: number; d: number } | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return null;
    }
    return {
      y: value.getFullYear(),
      m: value.getMonth() + 1,
      d: value.getDate(),
    };
  }
  const raw = String(value).trim();
  // "2027-07-19", "2027-07-19T00:00:00", "2027-07-19 02:24:28"
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) {
    const date = new Date(raw);
    if (isNaN(date.getTime())) {
      return null;
    }
    return {
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
    };
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }
  return { y, m, d };
}

export function formatApiDateTime(value: unknown): string {
  const parts = extraerFechaCalendario(value);
  if (!parts) {
    return '';
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.y}-${pad(parts.m)}-${pad(parts.d)} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/** Valor yyyy-MM-dd para input type="date" al cargar desde API. */
export function toDateInputValue(value: unknown): string {
  const parts = extraerFechaCalendario(value);
  if (!parts) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.y}-${pad(parts.m)}-${pad(parts.d)}`;
}
