import { Injectable } from '@angular/core';

export interface PreRegistroCorresponsableState {
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
  LcSeguimientoObra: string | number | boolean;
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
  LcConstanciaAlineamientoyNumero?: File[];
  LcLicenciaUsoyPlano?: File[];
  LcConstanciaPropietario?: File[];
  LcFactibilidad?: File[];
  LcRecibosImpuestoPredial?: File[];
  LcJuegoDePlanosArquitectonicos?: File[];
  LcOtrosDocs?: File[];
  LcFirmaPropietario?: File | null;
  LcFirmaDRO?: File | null;
  LcFirmaCorresponsable?: File | null;
  LcFirmaResponsableRecepcionDocumento?: File | null;
}

const STORAGE_KEY = 'lc.preRegistro';

@Injectable({
  providedIn: 'root',
})
export class PreRegistroStateService {
  private files: PreRegistroFilesState = {};
  private scalar: PreRegistroScalarState | null = null;

  setState(scalar: PreRegistroScalarState, files: PreRegistroFilesState = {}): void {
    this.scalar = { ...scalar, preRegistro: true };
    this.files = { ...files };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.scalar));
    } catch {
      // ignore quota / private mode
    }
  }

  peekScalar(): PreRegistroScalarState | null {
    if (this.scalar) {
      return this.scalar;
    }
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.preRegistro) {
        return null;
      }
      this.scalar = parsed as PreRegistroScalarState;
      return this.scalar;
    } catch {
      return null;
    }
  }

  peekFiles(): PreRegistroFilesState {
    return { ...this.files };
  }

  clear(): void {
    this.scalar = null;
    this.files = {};
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
