import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalComercial } from '../../local-comercial/models/local-comercial';
import { MonitoreoLocal } from '../models/monitoreo-local';

/** Catálogo de estatus (mismo que lista / detalle). */
const NOMBRE_ESTATUS: Record<number, string> = {
  1: 'Información Faltante',
  2: 'Rechazo o Sin respuesta',
  3: 'Datos Correctos',
  4: 'Revisión',
  5: 'Baja',
};

/** Catálogo GruposCapturistaVisita (Id → Nombre). */
const NOMBRE_GRUPO_CAPTURISTA: Record<number, string> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F',
  7: 'G',
};

@Injectable({
  providedIn: 'root',
})
export class MonitoreoService {
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  /** GET /monitoreo — locales para el mapa de monitoreo. */
  obtenerLocales(): Observable<MonitoreoLocal[]> {
    return this.http.get<MonitoreoLocal[]>(`${this.baseUrl}/monitoreo`);
  }

  /**
   * Locales mapeados al modelo que ya consume la UI del mapa
   * (sin agregar campos nuevos a la vista).
   */
  obtenerLocalesMapa(): Observable<LocalComercial[]> {
    return this.obtenerLocales().pipe(
      map((locales) => (Array.isArray(locales) ? locales : []).map((item) => this.mapToLocalComercial(item))),
    );
  }

  private mapToLocalComercial(item: MonitoreoLocal): LocalComercial {
    const estatus = Number(item?.estatus ?? 0);

    return {
      id: Number(item?.id ?? 0),
      lat: Number(item?.latitud ?? 0),
      lng: Number(item?.longitud ?? 0),
      nombreComercial: this.texto(item?.nombreComercial),
      giro: this.texto(item?.giro),
      rfc: this.texto(item?.rfc),
      estatus,
      nombreEstatus: NOMBRE_ESTATUS[estatus] ?? '',
      grupo: this.resolverGrupo(item),
      nombreCapturista: this.resolverCapturista(item),
      urlLicencia: null,
      fechaHora: this.fechaValida(item?.fechaHoraLicencia) ?? this.fechaValida(item?.fechaCreacion),
    };
  }

  private resolverGrupo(item: MonitoreoLocal): string {
    const idGrupo = Number(item?.idGrupoCapturistaVisita);
    if (Number.isFinite(idGrupo) && NOMBRE_GRUPO_CAPTURISTA[idGrupo]) {
      return NOMBRE_GRUPO_CAPTURISTA[idGrupo];
    }
    return '';
  }

  private resolverCapturista(item: MonitoreoLocal): string {
    const completo = this.texto(item?.nombreCompletoCapturista);
    if (completo) {
      return completo;
    }
    return [item?.nombreCapturista, item?.apellidoPaternoCapturista, item?.apellidoMaternoCapturista]
      .map((p) => this.texto(p))
      .filter(Boolean)
      .join(' ');
  }

  private texto(valor: unknown): string {
    if (valor == null || typeof valor === 'object') {
      return '';
    }
    const texto = String(valor).trim();
    return !texto || texto.toLowerCase() === 'null' ? '' : texto;
  }

  private fechaValida(valor: unknown): Date | null {
    if (valor == null || typeof valor === 'object') {
      return null;
    }
    const fecha = valor instanceof Date ? valor : new Date(String(valor));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
}
