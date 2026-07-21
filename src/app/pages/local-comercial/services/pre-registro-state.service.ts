import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface PreRegistroCorresponsableState {
  Id?: number | null;
  NombreCompleto: string;
  NoRegLicenciaConstruccion: string;
  CedulaProfesional: string;
}

export interface PreRegistroScalarState {
  preRegistro: true;
  lat: number | null;
  lng: number | null;
  direccion: string;
  tipoRegistro: 'comercial' | 'vivienda' | number | string;
  predioEnObra: boolean;
  EntidadFederativa: string;
  Municipio: string;
  Localidad: string;
  Colonia: string;
  Calle: string;
  NoInterior: string;
  NoExterior: string;
  CP: string;
  LcTipoSolicitudLicencia: string | number;
  LcDescripcionProyecto: string;
  LcClaveCatastral: string;
  LcSuperficieTerrenoM2: string | number;
  LcSuperficieTerrenoObraM2: string | number;
  LcDescripcionSistemaConstructivo: string;
  LcNombrePropietario: string;
  LcDomicilioNotificacion: string;
  LcRFC: string;
  LcNombreDRO: string;
  LcNoRegLicenciaConstruccion: string;
  LcCedulaProfesional: string;
  LcFecha: string;
  LcNumeroExpediente: string;
  LcNumeroControl: string;
  LcSeguimientoObra: string;
  LcConstanciaAlineamiento: string | number | boolean;
  LcLicenciaUsoSuelo: string | number | boolean;
  LcPlanoAutorizado: string | number | boolean;
  LcLicenciaFraccionamiento: string | number | boolean;
  LcEscrituras: string | number | boolean;
  LcFactibilidadAguaPotable: string | number | boolean;
  LcRecibosPagoPredial: string | number | boolean;
  LcRecibosMunicipales: string | number | boolean;
  LcPlanoArquitectonicos: string | number | boolean;
  LcOtros: string | number | boolean;
  LcCorresponsables: PreRegistroCorresponsableState[];
}

export interface PreRegistroFilesState {
  ReciboSapac?: File | null;
  CaratulaMedidor?: File | null;
  CuadroMedidor?: File | null;
  ReciboPredial?: File | null;
  LicenciaFuncionamiento?: File | null;
  FachadaEstablecimiento?: File | null;
  EstacionamientoIMG?: File | null;
  Bodega?: File | null;
  VistoBueno?: File | null;
  /** Archivos LC: máx. 1 por campo (POST /registros). */
  LcConstanciaAlineamientoFile?: File | null;
  LcConstanciaNumero?: File | null;
  LcLicenciaUsoSueloFile?: File | null;
  LcPlanoAutorizadoFile?: File | null;
  LcLicenciaFraccionamientoFile?: File | null;
  LcConstanciaPropietario?: File | null;
  LcFactibilidad?: File | null;
  LcRecibosImpuestoPredial?: File | null;
  LcJuegoDePlanosArquitectonicos1?: File | null;
  LcJuegoDePlanosArquitectonicos2?: File | null;
  LcJuegoDePlanosArquitectonicos3?: File | null;
  LcOtrosDocs?: File | null;
  LcFirmaPropietario?: File | null;
  LcFirmaDRO?: File | null;
  LcFirmaCorresponsable?: File | null;
  LcFirmaResponsableRecepcionDocumento?: File | null;
}

/** Borrador del formulario de locales (Sapac…Protección) al navegar entre apartados. */
export interface LocalesFormDraftState {
  formValue: Record<string, unknown>;
  documentosExistentes: Record<string, string>;
  activeTab?: number;
}

interface LocalesPersistedBundle {
  scope: string;
  scalar: PreRegistroScalarState | null;
  formDraft: LocalesFormDraftState | null;
}

const STORAGE_PREFIX = 'lc.locales.borrador.';
const STORAGE_ACTIVO = 'lc.locales.borrador.activo';
const RUTA_FLUJO =
  /\/local-comercial\/(pre-alta-local-comercial|pre-actualizar-local-comercial|alta-local-comercial|actualizar-local-comercial)(\/|$|\?)/;

@Injectable({
  providedIn: 'root',
})
export class PreRegistroStateService {
  private files: PreRegistroFilesState = {};
  private scalar: PreRegistroScalarState | null = null;
  private formDraft: LocalesFormDraftState | null = null;
  /** `nuevo` | `edit.{id}` */
  private scopeActivo: string | null = null;

  constructor(router: Router) {
    try {
      this.scopeActivo = localStorage.getItem(STORAGE_ACTIVO);
    } catch {
      this.scopeActivo = null;
    }

    // Si salen del flujo agregar/editar → limpiar sí o sí (evita cruzar registro 1 → 2)
    router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((e) => {
        if (!this.scopeActivo && !this.scalar && !this.formDraft) {
          return;
        }
        if (!RUTA_FLUJO.test(e.url)) {
          this.clear();
        }
      });
  }

  /**
   * Inicia un flujo limpio desde la lista.
   * - Alta: beginFlow('nuevo')
   * - Editar: beginFlow(id)
   * Borra cualquier borrador previo (otro id o alta) para no mezclar datos.
   */
  beginFlow(scope: 'nuevo' | number): void {
    const siguiente = scope === 'nuevo' ? 'nuevo' : `edit.${Number(scope)}`;
    this.clear();
    this.scopeActivo = siguiente;
    this.persistActivo();
  }

  /** ¿El borrador activo corresponde a este alta/edición? */
  isScope(scope: 'nuevo' | number): boolean {
    const esperado = scope === 'nuevo' ? 'nuevo' : `edit.${Number(scope)}`;
    if (this.scopeActivo) {
      return this.scopeActivo === esperado;
    }
    try {
      return localStorage.getItem(STORAGE_ACTIVO) === esperado;
    } catch {
      return false;
    }
  }

  setState(scalar: PreRegistroScalarState, files: PreRegistroFilesState = {}): void {
    this.ensureScope();
    this.scalar = { ...scalar, preRegistro: true };
    this.files = { ...files };
    this.persistBundle();
  }

  /** Actualiza archivos en memoria sin tocar el scalar. */
  patchFiles(partial: PreRegistroFilesState): void {
    this.ensureScope();
    this.files = { ...this.files, ...partial };
  }

  /** Actualiza scalar sin tocar archivos. */
  patchScalar(partial: Partial<PreRegistroScalarState>): void {
    const actual = this.peekScalar();
    if (!actual) {
      return;
    }
    this.setState({ ...actual, ...partial, preRegistro: true }, this.files);
  }

  peekScalar(): PreRegistroScalarState | null {
    if (this.scalar) {
      return this.scalar;
    }
    const bundle = this.readBundle();
    if (bundle?.scalar?.preRegistro) {
      this.scalar = bundle.scalar;
      this.formDraft = bundle.formDraft;
      return this.scalar;
    }
    return null;
  }

  peekFiles(): PreRegistroFilesState {
    return { ...this.files };
  }

  setFormDraft(draft: LocalesFormDraftState): void {
    this.ensureScope();
    // En memoria se conservan File; a localStorage solo va lo serializable
    const siguiente = this.clonarPreservandoArchivos(draft.formValue || {}) as Record<
      string,
      unknown
    >;
    // Si un control llega como '' pero antes había File, conservar el File
    if (this.formDraft?.formValue) {
      this.conservarArchivosPrevios(siguiente, this.formDraft.formValue);
    }
    const docs = { ...(draft.documentosExistentes || {}) };
    // No borrar previews blob/http previas si el nuevo draft las omite
    if (this.formDraft?.documentosExistentes) {
      Object.entries(this.formDraft.documentosExistentes).forEach(([k, url]) => {
        if (!docs[k] && url) {
          docs[k] = url;
        }
      });
    }
    this.formDraft = {
      formValue: siguiente,
      documentosExistentes: docs,
      activeTab: draft.activeTab,
    };
    this.persistBundle();
  }

  peekFormDraft(): LocalesFormDraftState | null {
    if (!this.formDraft) {
      const bundle = this.readBundle();
      if (bundle?.formDraft) {
        this.formDraft = bundle.formDraft;
        if (!this.scalar && bundle.scalar) {
          this.scalar = bundle.scalar;
        }
      }
    }
    return this.formDraft
      ? {
          formValue: this.clonarPreservandoArchivos(this.formDraft.formValue || {}) as Record<
            string,
            unknown
          >,
          documentosExistentes: { ...this.formDraft.documentosExistentes },
          activeTab: this.formDraft.activeTab,
        }
      : null;
  }

  clearFormDraft(): void {
    this.formDraft = null;
    this.persistBundle();
  }

  /** Limpia memoria + localStorage del flujo actual (y cualquier resto). */
  clear(): void {
    this.scalar = null;
    this.files = {};
    this.formDraft = null;
    this.scopeActivo = null;
    this.removeAllStorage();
  }

  private ensureScope(): void {
    if (this.scopeActivo) {
      return;
    }
    try {
      this.scopeActivo = localStorage.getItem(STORAGE_ACTIVO) || 'nuevo';
    } catch {
      this.scopeActivo = 'nuevo';
    }
    this.persistActivo();
  }

  private storageKey(scope = this.scopeActivo): string | null {
    return scope ? `${STORAGE_PREFIX}${scope}` : null;
  }

  private persistActivo(): void {
    try {
      if (this.scopeActivo) {
        localStorage.setItem(STORAGE_ACTIVO, this.scopeActivo);
      } else {
        localStorage.removeItem(STORAGE_ACTIVO);
      }
    } catch {
      // ignore
    }
  }

  private persistBundle(): void {
    const key = this.storageKey();
    if (!key) {
      return;
    }
    const bundle: LocalesPersistedBundle = {
      scope: this.scopeActivo!,
      scalar: this.scalar,
      formDraft: this.formDraft
        ? {
            formValue: this.sanitizarFormValue(this.formDraft.formValue),
            documentosExistentes: this.sanitizarDocumentos(this.formDraft.documentosExistentes || {}),
            activeTab: this.formDraft.activeTab,
          }
        : null,
    };
    try {
      localStorage.setItem(key, JSON.stringify(bundle));
      this.persistActivo();
    } catch {
      // quota / private mode
    }
  }

  private readBundle(): LocalesPersistedBundle | null {
    this.ensureScope();
    const key = this.storageKey();
    if (!key) {
      return null;
    }
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as LocalesPersistedBundle;
      if (!parsed || parsed.scope !== this.scopeActivo) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private removeAllStorage(): void {
    try {
      localStorage.removeItem(STORAGE_ACTIVO);
      const aBorrar: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          aBorrar.push(k);
        }
      }
      aBorrar.forEach((k) => localStorage.removeItem(k));
      // legado sessionStorage
      sessionStorage.removeItem('lc.preRegistro');
    } catch {
      // ignore
    }
  }

  /** Quita File / blob del draft para poder guardarlo en localStorage sin errores. */
  private sanitizarFormValue(value: Record<string, unknown>): Record<string, unknown> {
    try {
      return JSON.parse(
        JSON.stringify(value, (_key, val) => {
          if (typeof File !== 'undefined' && val instanceof File) {
            return '';
          }
          if (typeof Blob !== 'undefined' && val instanceof Blob) {
            return '';
          }
          return val;
        })
      );
    } catch {
      return {};
    }
  }

  /** Clona el formValue conservando instancias File en memoria. */
  private clonarPreservandoArchivos(valor: unknown): unknown {
    if (typeof File !== 'undefined' && valor instanceof File) {
      return valor;
    }
    if (Array.isArray(valor)) {
      return valor.map((item) => this.clonarPreservandoArchivos(item));
    }
    if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
      const out: Record<string, unknown> = {};
      Object.entries(valor as Record<string, unknown>).forEach(([k, v]) => {
        out[k] = this.clonarPreservandoArchivos(v);
      });
      return out;
    }
    return valor;
  }

  /** Si el nuevo valor vació un File, restaura el File previo en memoria. */
  private conservarArchivosPrevios(destino: unknown, origen: unknown): void {
    if (!destino || !origen || typeof destino !== 'object' || typeof origen !== 'object') {
      return;
    }
    if (Array.isArray(destino) && Array.isArray(origen)) {
      destino.forEach((item, i) => this.conservarArchivosPrevios(item, origen[i]));
      return;
    }
    Object.entries(origen as Record<string, unknown>).forEach(([k, prev]) => {
      const actual = (destino as Record<string, unknown>)[k];
      if (typeof File !== 'undefined' && prev instanceof File) {
        if (actual === '' || actual == null || actual === undefined) {
          (destino as Record<string, unknown>)[k] = prev;
        }
        return;
      }
      if (actual && prev && typeof actual === 'object' && typeof prev === 'object') {
        this.conservarArchivosPrevios(actual, prev);
      }
    });
  }

  private sanitizarDocumentos(docs: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    Object.entries(docs || {}).forEach(([k, url]) => {
      const u = String(url || '').trim();
      if (!u || u.startsWith('blob:')) {
        return;
      }
      out[k] = u;
    });
    return out;
  }
}
