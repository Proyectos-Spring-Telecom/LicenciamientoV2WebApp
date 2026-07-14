import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermisosService {
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');

  constructor(private http: HttpClient) { }

  obtenerPermisos(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/permisos/${page}/${pageSize}`);
  }

  /** GET /permisos/permisosAgrupados — módulos con sus permisos. */
  obtenerPermisosAgrupados(): Observable<any> {
    return this.http.get(`${this.baseUrl}/permisos/permisosAgrupados`);
  }

  /** POST /permisos — sin params. Body: { nombre, descripcion, idModulo }. */
  agregarPermiso(data: { nombre: string; descripcion: string; idModulo: number }) {
    return this.http.post(`${this.baseUrl}/permisos`, data);
  }

  eliminarPermiso(idPermiso: Number) {
    return this.http.delete(`${this.baseUrl}/permisos/${idPermiso}`);
  }

  obtenerPermiso(idPermiso: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/permisos/${idPermiso}`);
  }

  /** PUT /permisos/{id} — param id obligatorio. Body: { descripcion }. */
  actualizarPermiso(idPermiso: number, payload: { descripcion: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/permisos/${idPermiso}`, payload);
  }

  /** PATCH /permisos/{id}/estatus */
  updateEstatus(id: number, estatus: number): Observable<string> {
    return this.http
      .patch(`${this.baseUrl}/permisos/${id}/estatus`, { estatus }, { responseType: 'text' })
      .pipe(catchError(error => throwError(() => error)));
  }
}
