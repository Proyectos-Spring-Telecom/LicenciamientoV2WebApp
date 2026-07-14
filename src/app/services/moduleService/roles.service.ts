import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  /** GET /roles/{page}/{limit} */
  obtenerRolesData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles/${page}/${pageSize}`);
  }

  /** GET /roles/list */
  obtenerRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles/list`);
  }

  /** POST /roles — body { nombre, permisos }. Respuesta texto plano. */
  agregarRole(data: { nombre: string; permisos: number[] }): Observable<string> {
    return this.http.post(`${this.baseUrl}/roles`, data, { responseType: 'text' });
  }

  /** DELETE /roles/{id} */
  eliminarRole(idRol: number) {
    return this.http.delete(`${this.baseUrl}/roles/${idRol}`);
  }

  /** GET /roles/{id} */
  obtenerRole(idRol: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles/${idRol}`);
  }

  /** PUT /roles — body { id, nombre, permisos }. Respuesta texto plano (ej. "Rol actualizado"). */
  actualizarRoles(payload: { id: number; nombre: string; permisos: number[] }): Observable<string> {
    return this.http.put(`${this.baseUrl}/roles`, payload, { responseType: 'text' });
  }

  /** PATCH /roles/estatus/{id} */
  updateEstatus(id: number, estatus: number): Observable<string> {
    return this.http
      .patch(`${this.baseUrl}/roles/estatus/${id}`, { estatus }, { responseType: 'text' })
      .pipe(catchError((error) => throwError(() => error)));
  }
}
