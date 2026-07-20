import {
  AfterContentInit,
  AfterViewChecked,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { AuthenticationService } from 'src/app/services/auth.service';
import { User } from 'src/app/entities/User';
import { TableroService } from './services/tablero.service';
import { Capturista } from './models/capturista';
import { ListaGrupo } from './models/listaGrupo';
import { UsuarioTablero } from './models/usuariosTablero';
import {
  DashboardCapturaPeriodoRequest,
  DashboardCapturaPeriodoResponse,
  DashboardCapturistaItem,
  DashboardCardResponse,
  DashboardEstadisticaMes,
  DashboardEstadoActual,
} from './models/dashboard';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
  providers: [DatePipe],
})
export class DashboardComponent
  implements OnInit, AfterContentInit, OnDestroy, AfterViewChecked
{
  public showFilterRow = true;
  public showHeaderFilter = true;
  public loadingVisible = false;
  public isDisabled = true;
  public mensajeAgrupar =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public loadingMessage = 'Cargando...';
  private interval: ReturnType<typeof setInterval> | null = null;

  public usuarios: UsuarioTablero[] = [];
  /** Catálogo local de grupos (sin API legacy). */
  public grupos: ListaGrupo[] = [
    { id: 1, nombre: 'A' },
    { id: 2, nombre: 'B' },
    { id: 3, nombre: 'C' },
    { id: 4, nombre: 'D' },
    { id: 5, nombre: 'E' },
    { id: 6, nombre: 'F' },
    { id: 7, nombre: 'G' },
  ];
  public listaCapturista: Capturista[] = [];
  public datosReporte: Array<Record<string, unknown>> = [];
  public resultadoGrupo: UsuarioTablero[] = [];

  public totalRechazados = 0;
  public totalFaltante = 0;
  public totalValidados = 0;
  public totalRevision = 0;

  public datosPastel: Array<{ etiqueta: string; percent: number; tipo: number }> = [];
  public datosGrafica: Array<{
    mes: string;
    statusfaltante: number;
    statusrechazado: number;
    statuscorrecto: number;
    statusrevision: number;
  }> = [];
  public item_totals: any[] = [];

  public showFiltroGrupo = false;
  public showFiltroUsuario = false;
  public detalle: User | null = null;
  public mensajeModulo = 'Tablero';

  public fechainicio: string | null = null;
  public fechaFin: string | null = null;
  public grupo: number | null = null;
  public idCapturista: number | null = null;

  private graphicMonths: any;
  private graphicCake: any;
  private graphicFilters: any;

  constructor(
    public authService: AuthenticationService,
    private tableroService: TableroService,
    private datepipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.obtenerDetalle();
    this.cargarDashboard();
    this.inicializarSemanaActual();
    this.obtenerFiltros({ silencioso: true });
  }

  ngAfterContentInit(): void {
    this.interval = setInterval(() => {
      this.loadingMessage = 'Actualizando...';
      this.loadingVisible = true;
      this.cargarDashboard();
    }, 180000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  onShown(): void {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
  }

  ngAfterViewChecked(): void {
    this.graphicMonths?.render?.();
    this.graphicCake?.render?.();
    this.graphicFilters?.render?.();
  }

  onInitializedMonths(evt: any): void {
    this.graphicMonths = evt.component;
  }

  onInitializedCake(evt: any): void {
    this.graphicCake = evt.component;
  }

  onInitializedFilters(evt: any): void {
    this.graphicFilters = evt.component;
  }

  /** Semana actual completa: lunes → domingo (YYYY-MM-DD). */
  private inicializarSemanaActual(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const lunes = new Date(hoy);
    const dia = lunes.getDay(); // 0=domingo … 6=sábado
    const diasDesdeLunes = dia === 0 ? 6 : dia - 1;
    lunes.setDate(lunes.getDate() - diasDesdeLunes);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    this.fechainicio = this.formatearFecha(lunes);
    this.fechaFin = this.formatearFecha(domingo);
  }

  private formatearFecha(fecha: Date): string {
    return (
      this.datepipe.transform(fecha, 'yyyy-MM-dd') ??
      `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    );
  }

  /** POST /dashboard/card → cards, gráfica mensual, pastel y capturistas */
  cargarDashboard(): void {
    this.tableroService.obtenerDashboardCard().subscribe({
      next: (res) => this.aplicarRespuestaDashboard(res),
      error: () => this.resetearIndicadores(),
    });
  }

  private aplicarRespuestaDashboard(res: DashboardCardResponse): void {
    const card = res?.card;
    this.totalRechazados = card?.rechazoSinRespuesta ?? 0;
    this.totalRevision = card?.revision ?? 0;
    this.totalFaltante = card?.informacionFaltante ?? 0;
    this.totalValidados = card?.datosCorrectos ?? 0;

    this.datosGrafica = this.mapearEstadisticaOperativa(res?.estadisticaOperativa);
    this.datosPastel = this.mapearEstadoActual(res?.estadoActual);
    this.aplicarCapturistas(res?.registrosCapturistas);
  }

  private mapearEstadisticaOperativa(
    lista: DashboardEstadisticaMes[] | undefined,
  ): typeof this.datosGrafica {
    return (lista ?? []).map((item) => ({
      mes: item.mes,
      statusfaltante: item.informacionFaltante ?? 0,
      statusrechazado: item.rechazoSinRespuesta ?? 0,
      statuscorrecto: item.datosCorrectos ?? 0,
      statusrevision: item.revision ?? 0,
    }));
  }

  private mapearEstadoActual(
    estado: DashboardEstadoActual | undefined,
  ): typeof this.datosPastel {
    return [
      { etiqueta: 'Revisión', percent: estado?.revision ?? 0, tipo: 4 },
      { etiqueta: 'Rechazo o Sin Respuesta', percent: estado?.rechazoSinRespuesta ?? 0, tipo: 1 },
      { etiqueta: 'Datos Correctos', percent: estado?.datosCorrectos ?? 0, tipo: 3 },
      { etiqueta: 'Información Faltante', percent: estado?.informacionFaltante ?? 0, tipo: 2 },
    ];
  }

  private aplicarCapturistas(lista: DashboardCapturistaItem[] | undefined): void {
    const items = (lista ?? []).map((c) => {
      const capturista = new Capturista();
      capturista.id = c.idCapturista;
      capturista.nombre = c.nombre ?? '';
      capturista.apellidoPaterno = c.apellidoPaterno ?? '';
      capturista.apellidoMaterno = c.apellidoMaterno ?? '';
      capturista.nombreCompleto =
        c.nombreCompleto?.trim() ||
        [c.nombre, c.apellidoPaterno, c.apellidoMaterno]
          .filter((p) => !!p && String(p).trim() !== '')
          .join(' ');
      capturista.nombreGrupo = c.grupo ?? '';
      capturista.nombreSupervisor = '';
      capturista.totalLicencias = c.totalRegistros ?? 0;
      return capturista;
    });

    this.listaCapturista = items;
    this.datosReporte = items.map((c) => ({
      Nombre: c.nombreCompleto,
      Grupo: c.nombreGrupo,
      'Total Registros': c.totalLicencias,
    }));
    this.isDisabled = this.datosReporte.length === 0;
  }

  private resetearIndicadores(): void {
    this.totalRechazados = 0;
    this.totalRevision = 0;
    this.totalFaltante = 0;
    this.totalValidados = 0;
    this.datosGrafica = [];
    this.datosPastel = [
      { etiqueta: 'Revisión', percent: 0, tipo: 4 },
      { etiqueta: 'Rechazo o Sin Respuesta', percent: 0, tipo: 1 },
      { etiqueta: 'Datos Correctos', percent: 0, tipo: 3 },
      { etiqueta: 'Información Faltante', percent: 0, tipo: 2 },
    ];
    this.listaCapturista = [];
    this.datosReporte = [];
    this.isDisabled = true;
  }

  /** POST /dashboard/captura-periodo — Nivel de Captura por Período */
  obtenerFiltros(opciones?: { silencioso?: boolean }): void {
    const silencioso = opciones?.silencioso === true;

    if (!this.fechainicio) {
      if (!silencioso) {
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: 'Campo requerido',
          text: 'Seleccione la fecha inicial.',
          icon: 'warning',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
      }
      return;
    }

    if (!this.fechaFin) {
      if (!silencioso) {
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: 'Campo requerido',
          text: 'Seleccione la fecha final.',
          icon: 'warning',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
      }
      return;
    }

    const fechaInicial =
      this.datepipe.transform(this.fechainicio, 'yyyy-MM-dd') ??
      String(this.fechainicio).substring(0, 10);
    const fechaFinal =
      this.datepipe.transform(this.fechaFin, 'yyyy-MM-dd') ??
      String(this.fechaFin).substring(0, 10);

    this.fechainicio = fechaInicial;
    this.fechaFin = fechaFinal;

    const body: DashboardCapturaPeriodoRequest = { fechaInicial, fechaFinal };
    if (this.grupo != null) {
      body.idGrupo = this.grupo;
    }
    if (this.idCapturista != null) {
      body.idCapturista = this.idCapturista;
    }

    this.tableroService.obtenerCapturaPeriodo(body).subscribe({
      next: (res) => this.aplicarCapturaPeriodo(res, silencioso),
      error: () => {
        this.item_totals = [];
        if (!silencioso) {
          Swal.fire({
            color: '#ffffff',
            background: '#141a21',
            title: 'Error',
            text: 'No se pudieron obtener los datos del período.',
            icon: 'error',
            confirmButtonText: 'Entendido',
          });
        }
      },
    });
  }

  private aplicarCapturaPeriodo(
    res: DashboardCapturaPeriodoResponse | null | undefined,
    silencioso = false,
  ): void {
    const lista = res?.capturaPeriodo ?? [];
    this.item_totals = lista
      .map((e) => {
        const estatus = e?.estatus;
        return {
          fecha: e?.fecha ? String(e.fecha).substring(0, 10) : '',
          'Información Faltante': estatus?.informacionFaltante ?? 0,
          'Rechazo o Sin respuesta': estatus?.rechazoSinRespuesta ?? 0,
          'Datos Correctos': estatus?.datosCorrectos ?? 0,
          Revisión: estatus?.revision ?? 0,
        };
      })
      .filter((e) => !!e.fecha)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha), 'en', { numeric: true }));

    if (!silencioso && this.item_totals.length === 0) {
      Swal.fire({
        color: '#ffffff',
        background: '#141a21',
        title: '¡Ops!',
        text: 'No se encuentran datos por graficar',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
    }
  }

  obtenerDetalle(): void {
    this.detalle = this.authService.getUser();
    const rol = String(this.detalle?.rolNombre ?? this.detalle?.rol?.nombre ?? '');
    if (rol === 'Capturista' || rol === 'Supervisor') {
      this.showFiltroGrupo = true;
      this.showFiltroUsuario = true;
    }
  }

  obtenerUsuarios(idGrupo: number | null): void {
    this.idCapturista = null;
    this.resultadoGrupo = [];
    this.usuarios = [];

    if (idGrupo == null) {
      return;
    }

    this.tableroService.obtenerUsuariosPorGrupo(idGrupo).subscribe({
      next: (response) => {
        const lista = Array.isArray(response?.data) ? response.data : [];
        this.usuarios = lista;
        this.resultadoGrupo = lista;
      },
      error: () => {
        this.usuarios = [];
        this.resultadoGrupo = [];
      },
    });
  }

  nombreCompletoUsuario(usuario: UsuarioTablero): string {
    return [usuario?.nombre, usuario?.apellidoPaterno, usuario?.apellidoMaterno]
      .filter((p) => !!p && String(p).trim() !== '')
      .join(' ');
  }

  etiquetaPie = (arg: any): string => `${arg.valueText} Locales Comerciales`;

  customizePoint = (pointInfo: any): { color: string } | undefined => {
    switch (pointInfo?.data?.tipo) {
      case 1:
        return { color: '#fb2121' };
      case 2:
        return { color: '#f9c300' };
      case 3:
        return { color: '#3da73d' };
      case 4:
        return { color: '#438AE3' };
      default:
        return undefined;
    }
  };

  async exportarCapturistas(): Promise<void> {
    const rows = this.datosReporte ?? [];
    if (!rows.length) {
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('data');
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map((header) => ({ header, key: header, width: 18 }));
    worksheet.addRows(rows);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    FileSaver.saveAs(blob, `Capturistas_${new Date().getTime()}.xlsx`);
  }
}
