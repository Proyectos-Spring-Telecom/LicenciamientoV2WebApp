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
  accept: 'image/*,.pdf',
  badgeDefault: 'PNG · JPG · WEBP · PDF · Máx. 3 MB',
};

export const DOCUMENTOS_LOCAL: DocumentoLocalConfig[] = [
  { controlName: 'ReciboSapac', titulo: 'RECIBO SAPAC', idTipoFoto: 3, buttonClass: 'success', tab: 'sapac', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'CaratulaMedidor', titulo: 'CARÁTULA MEDIDOR', idTipoFoto: 4, buttonClass: 'primary', tab: 'sapac', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'CuadroMedidor', titulo: 'CUADRO MEDIDOR', idTipoFoto: 5, buttonClass: 'warning', tab: 'sapac', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'ReciboPredial', titulo: 'RECIBO PREDIAL', idTipoFoto: 2, buttonClass: 'success', tab: 'catastral', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'LicenciaFuncionamiento', titulo: 'LICENCIA DE FUNCIONAMIENTO', idTipoFoto: 1, buttonClass: 'success', tab: 'licenciamiento', uploadTitle: 'Sube archivo', icon: 'description', ...DOCUMENTO_DEFAULTS },
  { controlName: 'FachadaEstablecimiento', titulo: 'FACHADA DEL ESTABLECIMIENTO', idTipoFoto: 6, buttonClass: 'primary', tab: 'licenciamiento', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'Bodega', titulo: 'BODEGA', idTipoFoto: 8, buttonClass: 'warning', tab: 'licenciamiento', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'EstacionamientoIMG', titulo: 'ESTACIONAMIENTO', idTipoFoto: 7, buttonClass: 'danger', tab: 'licenciamiento', uploadTitle: 'Sube tu imagen', icon: 'image', ...DOCUMENTO_DEFAULTS },
  { controlName: 'VistoBueno', titulo: 'VISTO BUENO', idTipoFoto: 9, buttonClass: 'success', tab: 'proteccion', uploadTitle: 'Sube archivo', icon: 'description', ...DOCUMENTO_DEFAULTS },
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


export function formatApiDateTime(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }

  const selectedDate = value instanceof Date ? value : new Date(String(value));
  if (isNaN(selectedDate.getTime())) {
    return '';
  }

  const now = new Date();
  const combined = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds()
  );

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${combined.getFullYear()}-${pad(combined.getMonth() + 1)}-${pad(combined.getDate())} ${pad(combined.getHours())}:${pad(combined.getMinutes())}:${pad(combined.getSeconds())}`;
}

/** Valor yyyy-MM-dd para input type="date" al cargar desde API. */
export function toDateInputValue(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
