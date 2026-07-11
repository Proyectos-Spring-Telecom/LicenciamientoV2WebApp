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

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

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
  public grupos: ListaGrupo[] = [];
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
    this.obtenerTotal();
    this.obtenerListaCapturistas();
    this.obtenerGraficaMes();
    this.obtenerGraficaDia();
    this.obtenerGrupo();
  }

  ngAfterContentInit(): void {
    this.interval = setInterval(() => {
      this.loadingMessage = 'Actualizando...';
      this.loadingVisible = true;
      this.obtenerTotal();
      this.obtenerListaCapturistas();
      this.obtenerGraficaMes();
      this.obtenerGraficaDia();
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

  obtenerListaCapturistas(): void {
    this.tableroService.obtenerCapturista().subscribe({
      next: (response) => {
        this.listaCapturista = response ?? [];
        this.datosReporte = (response ?? []).map((c) => ({
          Nombre: c.nombre,
          'Apellido Paterno': c.apellidoPaterno,
          'Apellido Materno': c.apellidoMaterno,
          Grupo: c.nombreGrupo,
          Supervisor: c.nombreSupervisor,
          'Total Licencias': c.totalLicencias,
        }));
        this.isDisabled = this.datosReporte.length === 0;
      },
      error: () => {
        this.listaCapturista = [];
        this.datosReporte = [];
        this.isDisabled = true;
      },
    });
  }

  obtenerTotal(): void {
    this.tableroService.getTotalDatos().subscribe({
      next: (res) => {
        this.totalRechazados = res?.rechazoSinRespuesta ?? 0;
        this.totalRevision = res?.datosRevision ?? 0;
        this.totalFaltante = res?.informacionFaltante ?? 0;
        this.totalValidados = res?.datosCorrectos ?? 0;
      },
      error: () => {
        this.totalRechazados = 0;
        this.totalRevision = 0;
        this.totalFaltante = 0;
        this.totalValidados = 0;
      },
    });
  }

  obtenerGraficaMes(): void {
    this.tableroService.obtenerDatosMes().subscribe({
      next: (response) => {
        const lista = response?.lista ?? [];
        this.datosGrafica = MESES.map((nombre, idx) => {
          const mes = String(idx + 1);
          return {
            mes: nombre,
            statusfaltante: this.sumMesEstatus(lista, mes, 'Información Faltante'),
            statusrechazado: this.sumMesEstatus(lista, mes, 'Rechazo o Sin respuesta'),
            statuscorrecto: this.sumMesEstatus(lista, mes, 'Datos Correctos'),
            statusrevision: this.sumMesEstatus(lista, mes, 'Revisión'),
          };
        });
      },
      error: () => {
        this.datosGrafica = MESES.map((mes) => ({
          mes,
          statusfaltante: 0,
          statusrechazado: 0,
          statuscorrecto: 0,
          statusrevision: 0,
        }));
      },
    });
  }

  private sumMesEstatus(lista: any[], mes: string, estatus: string): number {
    return lista.reduce(
      (sum, value) =>
        typeof value?.total === 'number' &&
        String(value.mes) === mes &&
        value.estatus === estatus
          ? sum + value.total
          : sum,
      0,
    );
  }

  obtenerFiltros(): void {
    if (!this.fechainicio) {
      Swal.fire({
        title: 'Campo requerido',
        text: 'Seleccione la fecha inicial.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    const fechainicio =
      this.datepipe.transform(this.fechainicio, 'yyyy-MM-dd') ?? String(this.fechainicio).substring(0, 10);
    const fechaFin = this.fechaFin
      ? this.datepipe.transform(this.fechaFin, 'yyyy-MM-dd') ?? String(this.fechaFin).substring(0, 10)
      : null;
    this.fechainicio = fechainicio;
    this.fechaFin = fechaFin;

    this.tableroService
      .obtenerDatosUsuario(fechainicio, fechaFin, this.grupo, this.idCapturista)
      .subscribe({
        next: (response) => {
          const lista = (response?.lista ?? []).map((e: any) => {
            if (e?.fecha) {
              e.fecha = String(e.fecha).substring(0, 10);
            }
            return e;
          });

          const all = lista.reduce((acc: any, { fecha, estatus, total }: any) => {
            acc[fecha] =
              fecha in acc
                ? {
                    ...acc[fecha],
                    [estatus]: (acc[fecha][estatus] || 0) + total,
                  }
                : { fecha, [estatus]: total };
            return acc;
          }, {});

          this.item_totals = Object.values(all);
          this.item_totals.sort((a: any, b: any) =>
            String(a.fecha).localeCompare(String(b.fecha), 'en', { numeric: true }),
          );

          if (this.item_totals.length === 0) {
            Swal.fire({
              title: '¡Ops!',
              text: 'No se encuentran datos por graficar',
              icon: 'warning',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        },
        error: () => {
          this.item_totals = [];
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron obtener los datos del período.',
            icon: 'error',
            confirmButtonText: 'Entendido',
          });
        },
      });
  }

  obtenerDetalle(): void {
    this.detalle = this.authService.getUser();
    const rol = String(this.detalle?.rolNombre ?? this.detalle?.rol?.nombre ?? '');
    if (rol === 'Capturista' || rol === 'Supervisor') {
      this.showFiltroGrupo = true;
      this.showFiltroUsuario = true;
    }
  }

  obtenerUsuarios(value: number): void {
    this.tableroService.obtenerUsuarios().subscribe({
      next: (response: UsuarioTablero[]) => {
        this.usuarios = response ?? [];
        this.resultadoGrupo = [];
        const numeroletra = (value + 9).toString(36).toUpperCase();
        for (const user of this.usuarios) {
          if (String(user.grupo) === numeroletra) {
            this.resultadoGrupo.push(user);
          }
        }
      },
      error: () => {
        this.usuarios = [];
        this.resultadoGrupo = [];
      },
    });
  }

  obtenerGrupo(): void {
    this.tableroService.obtenerGrupos().subscribe({
      next: (response: ListaGrupo[]) => {
        this.grupos = response ?? [];
      },
      error: () => {
        this.grupos = [];
      },
    });
  }

  obtenerGraficaDia(): void {
    this.tableroService.obtenerDatosDia().subscribe({
      next: (response) => {
        this.datosPastel = [
          { etiqueta: 'Revisión', percent: response?.datosRevision ?? 0, tipo: 4 },
          {
            etiqueta: 'Rechazo o Sin Respuesta',
            percent: response?.rechazoSinRespuesta ?? 0,
            tipo: 1,
          },
          { etiqueta: 'Datos Correctos', percent: response?.datosCorrectos ?? 0, tipo: 3 },
          {
            etiqueta: 'Información Faltante',
            percent: response?.informacionFaltante ?? 0,
            tipo: 2,
          },
        ];
      },
      error: () => {
        this.datosPastel = [
          { etiqueta: 'Revisión', percent: 0, tipo: 4 },
          { etiqueta: 'Rechazo o Sin Respuesta', percent: 0, tipo: 1 },
          { etiqueta: 'Datos Correctos', percent: 0, tipo: 3 },
          { etiqueta: 'Información Faltante', percent: 0, tipo: 2 },
        ];
      },
    });
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
