import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  DashboardCapturaPeriodoRequest,
  DashboardCapturaPeriodoResponse,
  DashboardCardResponse,
} from '../models/dashboard';
import { UsuarioTablero } from '../models/usuariosTablero';

@Injectable({ providedIn: 'root' })
export class TableroService {
  private readonly baseUrl = environment.API_SECURITY.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  /** POST /dashboard/card — indicadores generales del dashboard. */
  obtenerDashboardCard(): Observable<DashboardCardResponse> {
    return this.http.post<DashboardCardResponse>(
      `${this.baseUrl}/dashboard/card`,
      {},
    );
  }

  /** POST /dashboard/captura-periodo — solo para Nivel de Captura por Período. */
  obtenerCapturaPeriodo(
    body: DashboardCapturaPeriodoRequest,
  ): Observable<DashboardCapturaPeriodoResponse> {
    return this.http.post<DashboardCapturaPeriodoResponse>(
      `${this.baseUrl}/dashboard/captura-periodo`,
      body,
    );
  }

  /** GET /usuarios/list/grupo/{id} — capturistas del grupo seleccionado. */
  obtenerUsuariosPorGrupo(idGrupo: number): Observable<{ data: UsuarioTablero[] }> {
    return this.http.get<{ data: UsuarioTablero[] }>(
      `${this.baseUrl}/usuarios/list/grupo/${idGrupo}`,
    );
  }
}
