import { environment } from '../../../../environments/environment';
import { FormGenerico } from '../models/form-generico';
import { DetalleLocal } from '../models/detalle-local-comercial';
import { LocalComercial } from '../models/local-comercial';
import { ListaRol } from '../models/Catalogos/roles';
import { ListaGrupo } from '../models/Catalogos/grupo';
import { ListaTipoFoto } from '../models/Catalogos/tipoFoto';
import { listaTipoServicio } from '../models/Catalogos/tipoServicio';
import { ListaEstatus } from '../models/Catalogos/estatus';
import { ListaGiro } from '../models/Catalogos/giro';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocalComercialService {
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  /** GET /registros?page=&limit= — listado paginado (visibilidad por rol en JWT). */
  obtenerRegistros(page: number, limit: number): Observable<any> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    return this.http.get(`${this.baseUrl}/registros`, {
      params: {
        page: String(pageNum),
        limit: String(limitNum),
      },
    });
  }

  /**
   * POST /registros/por-rango-fechas — grid de licencias.
   * Body solo fechaInicio/fechaFin (YYYY-MM-DD). Respuesta: arreglo JSON directo.
   */
  obtenerRegistrosPorRangoFechas(
    fechaInicio: string,
    fechaFin: string
  ): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/registros/por-rango-fechas`, {
      fechaInicio,
      fechaFin,
    });
  }

  /** GET /registros/{idRegistro} — detalle / actualizar (patchValue). */
  obtenerRegistroPorId(idRegistro: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/registros/${idRegistro}`);
  }

  /** PATCH /registros/{idRegistro}/estatus — solo cambia estatus. */
  actualizarEstatusRegistro(idRegistro: number, estatus: number): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/registros/${idRegistro}/estatus`, { estatus });
  }

  /** POST /registros — multipart form-data del alta de licencias. */
  agregarLocalComercial(formdata: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/registros`, formdata);
  }

  actualizarLocal(formData: FormData): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/api/Licencias`, formData);
  }

  eliminarLocalComercial(id: number): Observable<unknown> {
    return this.http.delete(environment.API_SECURITY + '/api/Licencias/' + id);
  }

  obtenerListaLocal(fechaInicio: string, fechaFinal: string): Observable<LocalComercial[]> {
    return this.http.get<LocalComercial[]>(environment.API_SECURITY + '/api/licencias/', {
      params: { fechaInicio, fechaFinal },
    });
  }

  obtenerListaLocalComercial(): Observable<LocalComercial[]> {
    return this.http.get<LocalComercial[]>(environment.API_SECURITY + '/api/licencias/');
  }

  obtenerListaLocalesMapa(): Observable<LocalComercial[]> {
    const fechaInicio = '2021-01-01 00:00:00';
    const fechaFinal = this.formatFechaApi(new Date());
    return this.http.get<LocalComercial[]>(environment.API_SECURITY + '/api/licencias/', {
      params: { fechaInicio, fechaFinal },
    });
  }

  private formatFechaApi(fecha: Date): string {
    const pad = (valor: number) => valor.toString().padStart(2, '0');
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
  }

  obtenerDetalleLocalComercial(idLicencia: number): Observable<DetalleLocal> {
    return this.http.get<DetalleLocal>(environment.API_SECURITY + '/api/Licencias/' + idLicencia);
  }

  cambiarEstatus(id: number, nombreEstatus: number | string): Observable<unknown> {
    return this.http.get(
      environment.API_SECURITY + '/api/Licencias/Estatus/' + id + '/' + nombreEstatus
    );
  }

  obtenerEstados(): Observable<FormGenerico[]> {
    return this.http.get<FormGenerico[]>(`${environment.API_SECURITY}/api/Direcciones/estados`);
  }

  obtenerMunicipiosEstado(): Observable<FormGenerico[]> {
    return this.http.get<FormGenerico[]>(`${environment.API_SECURITY}/api/Direcciones/estados/municipios`);
  }

  obtenerLocalidadesMunicipio(idMunicipio: number | string): Observable<FormGenerico[]> {
    return this.http.get<FormGenerico[]>(
      `${environment.API_SECURITY}/api/Direcciones/municipios/${idMunicipio}/localidades`
    );
  }

  obtenerColoniasLocalidad(idLocalidad: number | string): Observable<FormGenerico[]> {
    return this.http.get<FormGenerico[]>(
      `${environment.API_SECURITY}/api/Direcciones/localidades/${idLocalidad}/colonias`
    );
  }

  obtenerCallesColonia(idColonia: number | string): Observable<FormGenerico[]> {
    return this.http.get<FormGenerico[]>(
      `${environment.API_SECURITY}/api/Direcciones/colonias/${idColonia}/vialidades`
    );
  }

  obtenerRoles(): Observable<ListaRol[]> {
    return this.http.get<ListaRol[]>(environment.API_SECURITY + '/api/RolesCatalogo');
  }

  obtenerGrupos(): Observable<ListaGrupo[]> {
    return this.http.get<ListaGrupo[]>(environment.API_SECURITY + '/api/GruposCatalogo');
  }

  obtenerTipoFoto(): Observable<ListaTipoFoto[]> {
    return this.http.get<ListaTipoFoto[]>(environment.API_SECURITY + '/api/TipoFotosCatalogo');
  }

  obtenerTiposServicios(): Observable<listaTipoServicio[]> {
    return this.http.get<listaTipoServicio[]>(environment.API_SECURITY + '/api/TipoServicioCatalogo');
  }

  obtenerEstatus(): Observable<ListaEstatus[]> {
    return this.http.get<ListaEstatus[]>(environment.API_SECURITY + '/api/CatalogoEstatus');
  }

  obtenerGiros(): Observable<ListaGiro[]> {
    return this.http.get<ListaGiro[]>(environment.API_SECURITY + '/api/GirosCatalogo');
  }
}
