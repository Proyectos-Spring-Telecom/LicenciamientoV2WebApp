/** Respuesta de POST /dashboard/card */
export interface DashboardCardResponse {
  card: DashboardCard;
  estadisticaOperativa: DashboardEstadisticaMes[];
  estadoActual: DashboardEstadoActual;
  registrosCapturistas: DashboardCapturistaItem[];
}

export interface DashboardCard {
  totalRegistros: number;
  informacionFaltante: number;
  rechazoSinRespuesta: number;
  datosCorrectos: number;
  revision: number;
  baja: number;
}

export interface DashboardEstadisticaMes {
  numeroMes: number;
  mes: string;
  informacionFaltante: number;
  rechazoSinRespuesta: number;
  datosCorrectos: number;
  revision: number;
  baja: number;
  totalRegistros: number;
}

export interface DashboardEstadoActual {
  fecha: string;
  totalRegistros: number;
  informacionFaltante: number;
  rechazoSinRespuesta: number;
  datosCorrectos: number;
  revision: number;
  baja: number;
}

export interface DashboardCapturistaItem {
  idCapturista: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  idGrupo: number | null;
  grupo: string | null;
  totalRegistros: number;
}

/** Body de POST /dashboard/captura-periodo */
export interface DashboardCapturaPeriodoRequest {
  fechaInicial: string;
  fechaFinal: string;
  idGrupo?: number;
  idCapturista?: number;
}

export interface DashboardCapturaPeriodoEstatus {
  informacionFaltante: number;
  rechazoSinRespuesta: number;
  datosCorrectos: number;
  revision: number;
  baja: number;
}

export interface DashboardCapturaPeriodoItem {
  fecha: string;
  total: number;
  estatus: DashboardCapturaPeriodoEstatus;
}

/** Respuesta de POST /dashboard/captura-periodo */
export interface DashboardCapturaPeriodoResponse {
  capturaPeriodo: DashboardCapturaPeriodoItem[];
}
