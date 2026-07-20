import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { RolesService } from 'src/app/services/moduleService/roles.service';
import { Permiso } from 'src/app/entities/permiso.enum';
import Swal from 'sweetalert2';
import {
  estatusTexto,
  exportarTablaExcel,
  resolverEstatusActivo,
} from 'src/app/shared/utils/excel-export.util';

@Component({
  selector: 'app-lista-roles',
  templateUrl: './lista-roles.component.html',
  styleUrl: './lista-roles.component.scss',
  standalone: false,
  animations: [routeAnimation],
})
export class ListaRolesComponent implements OnInit {
  public mensajeAgrupar: string =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaRoles: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false })
  dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  readonly Permiso = Permiso;

  constructor(
    private router: Router,
    private rolesService: RolesService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit() {
    this.setupDataSource();
  }

  setupDataSource() {
    this.loading = true;

    this.listaRoles = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.rolesService.obtenerRolesData(page, take),
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ?? toNum(resp?.total) ?? rows.length;
          const paginaActual = toNum(meta.page) ?? toNum(resp?.page) ?? page;
          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => this.mapRolRow(item));

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros,
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      },
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  agregarRol() {
    this.router.navigateByUrl('/roles/agregar-rol');
  }

  actualizarRol(idRol: number) {
    this.router.navigateByUrl('/roles/editar-rol/' + idRol);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el rol: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      background: '#141a21',
      color: '#ffffff',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.rolesService.updateEstatus(rowData.id, 1).subscribe(
          () => {
            Swal.fire({
              background: '#141a21',
              color: '#ffffff',
              title: '¡Confirmación Realizada!',
              html: `El rol ha sido activado.`,
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            this.dataGrid.instance.refresh();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
              background: '#141a21',
              color: '#ffffff',
            });
          },
        );
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar el rol: <strong>${rowData.nombre}</strong>?`,
      icon: 'warning',
      background: '#141a21',
      color: '#ffffff',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.value) {
        this.rolesService.updateEstatus(rowData.id, 0).subscribe(
          () => {
            Swal.fire({
              background: '#141a21',
              color: '#ffffff',
              title: '¡Confirmación Realizada!',
              html: `El rol ha sido desactivado.`,
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            this.dataGrid.instance.refresh();
          },
          (error) => {
            Swal.fire({
              title: '¡Ops!',
              html: `${error}`,
              icon: 'error',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
              background: '#141a21',
              color: '#ffffff',
            });
          },
        );
      }
    });
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const texto = (e.value ?? '').toString().trim().toLowerCase();
    if (!texto) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaRoles);
      return;
    }
    this.filtroActivo = texto;
    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch {}
    if (!columnas.length && grid?.getVisibleColumns) {
      columnas = grid.getVisibleColumns();
    }
    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);
    const normalizar = (val: any): string => {
      if (val === null || val === undefined) return '';
      return String(val).toLowerCase();
    };
    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitEnColumnas = dataFields.some((df) =>
        normalizar(row?.[df]).includes(texto),
      );
      const estNum = Number(row?.estatus);
      const estText =
        row?.estatusTexto ??
        (estNum === 1 ? 'Activo' : estNum === 0 ? 'Inactivo' : '');
      const estHits =
        normalizar(estText).includes(texto) ||
        normalizar(estNum).includes(texto) ||
        (texto === 'activo' && estNum === 1) ||
        (texto === 'inactivo' && estNum === 0);
      return hitEnColumnas || estHits;
    });
    grid?.option('dataSource', dataFiltrada);
  }

  limpiarCampos() {
    this.dataGrid.instance.clearGrouping();
    this.isGrouped = false;
    this.setupDataSource();
    this.dataGrid.instance.refresh();
  }

  toggleExpandGroups() {
    const groupedColumns = this.dataGrid.instance
      .getVisibleColumns()
      .filter((col) => (col.groupIndex ?? -1) >= 0);
    if (groupedColumns.length === 0) {
      Swal.fire({
        background: '#141a21',
        color: '#ffffff',
        title: '¡Ops!',
        text: 'Debes arrastrar un encabezado de una columna para expandir o contraer grupos.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      });
    } else {
      this.autoExpandAllGroups = !this.autoExpandAllGroups;
      this.dataGrid.instance.refresh();
    }
  }

  private mapRolRow(item: any): any {
    const estatus = resolverEstatusActivo(item);
    return {
      ...item,
      id: Number(item?.id ?? item?.Id ?? item?.idRol),
      nombre: item?.nombre ?? item?.Nombre ?? '',
      estatus,
      estatusTexto: estatusTexto(estatus),
    };
  }

  private async obtenerTodosLosRoles(): Promise<any[]> {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const all: any[] = [];

    do {
      const resp: any = await lastValueFrom(
        this.rolesService.obtenerRolesData(page, pageSize),
      );
      const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
      all.push(...rows.map((item) => this.mapRolRow(item)));

      const meta = resp?.paginated || {};
      const total = Number(meta.total ?? resp?.total);
      totalPages =
        Number(meta.lastPage) ||
        Number(resp?.pages) ||
        (Number.isFinite(total) && total > 0
          ? Math.max(1, Math.ceil(total / pageSize))
          : page);

      if (!rows.length) {
        break;
      }
      page++;
    } while (page <= totalPages);

    return all;
  }

  async exportarExcel(): Promise<void> {
    try {
      const rows = await this.obtenerTodosLosRoles();
      const data = rows.map((row) => ({
        Nombre: row.nombre,
        Estatus: row.estatusTexto,
      }));

      await exportarTablaExcel({
        sheetName: 'Roles',
        fileName: 'Roles',
        columns: [
          { header: 'Nombre', key: 'Nombre', width: 40 },
          { header: 'Estatus', key: 'Estatus', width: 18 },
        ],
        rows: data,
      });
    } catch (err: any) {
      if (err?.message === 'EMPTY') {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay roles para exportar.',
          icon: 'info',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          background: '#141a21',
          color: '#ffffff',
        });
        return;
      }
      console.error('Error al exportar roles:', err);
      Swal.fire({
        title: '¡Ops!',
        text: 'No se pudo generar el archivo Excel.',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        background: '#141a21',
        color: '#ffffff',
      });
    }
  }
}
