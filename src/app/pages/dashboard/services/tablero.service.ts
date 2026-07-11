import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Capturista } from '../models/capturista';
import { DashboardTotal } from '../models/dashboard';
import { GraficaDia } from '../models/graficaDia';
import { DatosGraficaMes } from '../models/graficasMes';
import { DatosGraficaUsuario } from '../models/graficaUsuario';
import { UsuarioTablero } from '../models/usuariosTablero';
import { ListaGrupo } from '../models/listaGrupo';

@Injectable({ providedIn: 'root' })
export class TableroService {
  private params: Record<string, string | number> = {};

  constructor(private http: HttpClient) {}

  obtenerCapturista(): Observable<Capturista[]> {
    return this.http.get<Capturista[]>(
      environment.API_SECURITY + '/api/Dashboard/VisitasCapturista',
    );
  }

  getTotalDatos(): Observable<DashboardTotal> {
    return this.http.get<DashboardTotal>(
      `${environment.API_SECURITY}/api/Dashboard/Totalizador`,
    );
  }

  obtenerDatosDia(): Observable<GraficaDia> {
    return this.http.get<GraficaDia>(
      environment.API_SECURITY + '/api/Dashboard/TotalDia',
    );
  }

  obtenerDatosMes(): Observable<DatosGraficaMes> {
    return this.http.get<DatosGraficaMes>(
      environment.API_SECURITY + '/api/Dashboard/GraficaMes',
    );
  }

  obtenerDatosUsuario(
    fechainicio: string | null,
    fechaFin: string | null,
    grupo?: number | string | null,
    idCapturista?: number | string | null,
  ): Observable<DatosGraficaUsuario> {
    this.params = {};
    if (fechainicio) {
      this.params = { fechainicio, fechaFin: fechaFin ?? '' };
    }
    if (grupo != null && grupo !== '') {
      this.params = {
        fechaFin: fechaFin ?? '',
        fechainicio: fechainicio ?? '',
        grupo,
      };
    }
    if (idCapturista != null && idCapturista !== '') {
      this.params = {
        fechaFin: fechaFin ?? '',
        fechainicio: fechainicio ?? '',
        grupo: grupo ?? '',
        idCapturista,
      };
    }

    return this.http.get<DatosGraficaUsuario>(
      environment.API_SECURITY + '/api/Dashboard/TotalFiltros',
      { params: this.params as any },
    );
  }

  obtenerUsuarios(): Observable<UsuarioTablero[]> {
    return this.http.get<UsuarioTablero[]>(
      environment.API_SECURITY + '/api/Usuarios',
    );
  }

  obtenerGrupos(): Observable<ListaGrupo[]> {
    return this.http.get<ListaGrupo[]>(
      environment.API_SECURITY + '/api/GruposCatalogo',
    );
  }
}
