// @ts-nocheck
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { Router } from '@angular/router';
import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { User } from 'src/app/entities/User';
import { LicenciamientoPermiso } from 'src/app/entities/licenciamiento-permiso.const';
import { DxDataGridComponent } from 'devextreme-angular';
import { DatePipe } from '@angular/common';
import { LocalComercial } from '../../models/local-comercial';

@Component({
  selector: 'app-lista-local-comercial',
  templateUrl: './lista-local-comercial.component.html',
  styleUrls: ['./lista-local-comercial.component.css'],
  standalone: false,
  animations: [routeAnimation]
})

export class ListaLocalComercialComponent implements OnInit, AfterViewInit {
  @ViewChild('gridContainer', { static: false }) dataGrid: DxDataGridComponent;
  public listaLocales: LocalComercial[];
  public datosReporte = [];
  public mensajeModulo: string = 'Locales Comerciales';
  public titulo: string = 'Licenciamiento';

  public permisoLocales: string;
  public permisoAltaLocales: string;
  public permisoActualizarLocales: string;
  public permisoEliminarLocales: string;
  public permisoBajaLocal: string;
  public permisoVisualizarDetalle: string;

  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public autoExpandAllGroups: boolean = true;
  public isGrouped: boolean = false;
  public loadingVisible: boolean = false;
  public isDisabled: boolean = true;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loadingMessage: string = 'Cargando...';
  public interval = null;

  private _gap = 16;
  gap = `${this._gap}px`;
  col2 = `1 1 calc(50% - ${this._gap / 2}px)`;
  col3 = `1 1 calc(33.3333% - ${this._gap / 1.5}px)`;

  /** Valores `datetime-local` (yyyy-MM-ddTHH:mm) */
  public fechaInicio: string | null = null;
  public fechaFinal: string | null = null;
  public showTable: boolean = false;
  public detalle: User;
  public showButtonReload: boolean = false;
  public readonly defaultImage = 'assets/default.png';
  /** Estatus de baja / alta del local (mismo contrato API que ya se usaba). */
  private readonly ESTATUS_BAJA = 5;
  private readonly ESTATUS_ALTA = 4;

  resolveFotoRuta(ruta: string | null | undefined): string {
    if (ruta == null || ruta === undefined) {
      return this.defaultImage;
    }

    const trimmed = String(ruta).trim();

    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return this.defaultImage;
    }

    const normalized = decodeURIComponent(trimmed).toLowerCase();

    if (normalized.includes('default.png')) {
      return this.defaultImage;
    }

    return trimmed;
  }

  formatGridText(value: unknown): string {
    if (value == null || value === undefined) {
      return 'Sin Información';
    }

    const text = String(value).trim();

    if (text === '' || text.toLowerCase() === 'null') {
      return 'Sin Información';
    }

    return text;
  }

  onGridImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img && !img.src.includes('default.png')) {
      img.src = this.defaultImage;
    }
  }

  private normalizeListaLocales(locales: LocalComercial[]): LocalComercial[] {
    return (locales || []).map((item) => ({
      ...item,
      urlLicencia: this.resolveFotoRuta(item.urlLicencia),
      rfc: this.formatGridText(item.rfc),
      nombreComercial: this.formatGridText(item.nombreComercial),
      giro: this.formatGridText(item.giro),
      nombreCapturista: this.formatGridText(item.nombreCapturista),
      nombreEstatus: this.formatGridText(item.nombreEstatus),
    }));
  }

  col(colAmount: number) {
    return `1 1 calc(${100 / colAmount}% - ${this._gap - (this._gap / colAmount)}px)`;
  }

  constructor(
	  private router: Router,
	  private datepipe: DatePipe) {
		this.showHeaderFilter = true;
        this.showFilterRow = true;
  	}

	ngOnInit() {
		this.inicializarRangoFechas();
		this.obtenerPermisos();
		this.cargarRegistroLocal();
	}

	ngAfterViewInit() {
		/* Registro local: no se consulta el servicio. */
	}

	/** Un solo registro local para el grid (sin API). */
	private cargarRegistroLocal(): void {
		const registro: LocalComercial = {
			id: 1,
			rfc: 'XAXX010101000',
			nombreComercial: 'Local Comercial Demo',
			giro: 'Abarrotes',
			nombreCapturista: 'Capturista Demo',
			nombreEstatus: 'Revisión',
			estatus: 4,
			fechaHora: new Date(),
			urlLicencia: this.defaultImage,
			lat: 18.9242,
			lng: -99.2216,
			grupo: 'A',
		};
		this.listaLocales = this.normalizeListaLocales([registro]);
		this.showTable = true;
		this.isDisabled = false;
		this.crearReporte(this.listaLocales);
	}

	private inicializarRangoFechas(): void {
		const hoy = new Date();
		const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0);
		const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 0);
		this.fechaInicio = this.toDatetimeLocalValue(inicio);
		this.fechaFinal = this.toDatetimeLocalValue(fin);
	}

	private toDatetimeLocalValue(fecha: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
	}

	private toApiDateTime(value: string | Date | null | undefined): string | null {
		if (value == null || value === '') {
			return null;
		}
		if (value instanceof Date) {
			return this.datepipe.transform(value, 'yyyy-MM-dd HH:mm:ss');
		}
		const normalized = String(value).trim().replace('T', ' ');
		if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
			return `${normalized}:00`;
		}
		if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
			return normalized;
		}
		return this.datepipe.transform(normalized, 'yyyy-MM-dd HH:mm:ss');
	}

	estaDeBaja(row: LocalComercial | null | undefined): boolean {
		if (!row) {
			return false;
		}
		const estatus = Number(row.estatus);
		const nombre = String(row.nombreEstatus ?? '').toLowerCase();
		return estatus === this.ESTATUS_BAJA || nombre.includes('baja');
	}
	
/*-------------------------------
	Refresh Automático
-------------------------------*/
  	ngAfterContentInit() {
		this.interval = setInterval(async () => {
			this.showButtonReload = true;
		}, 180000);
	}

	onShown() {
		setTimeout(() => {
		  this.loadingVisible = false;
		}, 2000);
	  }

	ngOnDestroy() {
		clearInterval(this.interval);
	}


/*------------------------------------
	Obtención de Información en grids
------------------------------------*/
    obtenerListaLocalesComerciales(_fechaInicio, _fechaFinal) {
		this.cargarRegistroLocal();
	}
	
	obtenerListaLocalComercial() {
		this.cargarRegistroLocal();
	}


/*-------------------------------
	Enrutamiento
-------------------------------*/
  AgregarLocal(){
    this.router.navigateByUrl('/local-comercial/alta-local-comercial')
  }

  EditarLocal(id: number){
    this.router.navigateByUrl('/local-comercial/actualizar-local-comercial/' + id )
  }

  detalleLocal(_id?: number){
	  this.onShown();
    this.router.navigateByUrl('/local-comercial/detalle-local-comercial')
  }


/*---------------------------------
	Funciones/Acciones
---------------------------------*/
  	crearReporte(reporte: LocalComercial[]) {
		this.datosReporte = [];
		reporte.forEach(listaLocales => {
			this.datosReporte.push({
				'RFC': listaLocales.rfc,
				'Nombre Comercial': listaLocales.nombreComercial,
				'Giro': listaLocales.giro,
				'Capturista': listaLocales.nombreCapturista,
				'Estatus': listaLocales.nombreEstatus,
				'Fecha Expedicion': this.datepipe.transform(listaLocales.fechaHora, 'yyyy-MM-dd - HH:mm:ss'),
			});
			if (this.datosReporte.length > 0) {
				this.isDisabled = false;
			}
		});
	}

	reload(){
		this.obtenerListaLocalComercial();
		this.loadingMessage = 'Actualizando...';
		this.loadingVisible = true;
		this.onShown();
		this.showButtonReload = false;
	}

	activar(rowData: LocalComercial): void {
		const nombre = rowData?.nombreComercial || 'este local comercial';
		// NO BORRAR — Alerta confirmar activar local.
		Swal.fire({
			color: '#ffffff',
			background: '#141a21',
			title: '¡Activar!',
			html: `¿Está seguro que requiere activar el local comercial:<br> <strong>${nombre}</strong>?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Confirmar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.value) {
				rowData.estatus = this.ESTATUS_ALTA;
				rowData.nombreEstatus = 'Revisión';
				this.listaLocales = this.normalizeListaLocales([...(this.listaLocales || [])]);
				// NO BORRAR — Alerta éxito al activar.
				Swal.fire({
					color: '#ffffff',
					background: '#141a21',
					title: '¡Confirmación Realizada!',
					html: `El local comercial ha sido activado.`,
					icon: 'success',
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Confirmar',
				});
			}
		});
	}

	desactivar(rowData: LocalComercial): void {
		const nombre = rowData?.nombreComercial || 'este local comercial';
		// NO BORRAR — Alerta confirmar desactivar local.
		Swal.fire({
			color: '#ffffff',
			background: '#141a21',
			title: '¡Desactivar!',
			html: `¿Está seguro que requiere desactivar el local comercial:<br> <strong>${nombre}</strong>?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Confirmar',
			cancelButtonText: 'Cancelar',
		}).then((result) => {
			if (result.value) {
				rowData.estatus = this.ESTATUS_BAJA;
				rowData.nombreEstatus = 'Baja';
				this.listaLocales = this.normalizeListaLocales([...(this.listaLocales || [])]);
				// NO BORRAR — Alerta éxito al desactivar.
				Swal.fire({
					color: '#ffffff',
					background: '#141a21',
					title: '¡Confirmación Realizada!',
					html: `El local comercial ha sido desactivado.`,
					icon: 'success',
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Confirmar',
				});
			}
		});
	}

	private refrescarListaTrasEstatus(): void {
		this.cargarRegistroLocal();
	}


/*-------------------------------
	Obtener Permisos Asignados
-------------------------------*/
	public get Permiso() {
		return LicenciamientoPermiso;
	}

	obtenerPermisos(){
		this.permisoLocales = LicenciamientoPermiso.ConsultarLocalesComerciales;
		this.permisoAltaLocales = LicenciamientoPermiso.AgregarLocalComercial;
		this.permisoActualizarLocales = LicenciamientoPermiso.ActualizarLocalComercial;
		this.permisoEliminarLocales = LicenciamientoPermiso.EliminarLocalComercial;
		this.permisoVisualizarDetalle = LicenciamientoPermiso.VisualizarDetalle;
	}

	toggleExpandGroups() {
		const groupedColumns = this.dataGrid?.instance
			?.getVisibleColumns()
			?.filter((col) => (col.groupIndex ?? -1) >= 0) ?? [];

		if (groupedColumns.length === 0) {
			// NO BORRAR — Alerta: no hay columnas agrupadas.
			Swal.fire({
				title: '¡Ops!',
				text: 'Debes arrastar un encabezado de una columna para expandir o contraer grupos.',
				icon: 'warning',
				showCancelButton: false,
				confirmButtonColor: '#3085d6',
				confirmButtonText: 'Entendido',
				allowOutsideClick: false,
				background: '#141a21',
				color: '#ffffff',
			});
		} else {
			this.autoExpandAllGroups = !this.autoExpandAllGroups;
			this.dataGrid.instance.refresh();
		}
	}

	limpiarCampos() {
		this.dataGrid?.instance?.clearGrouping();
		this.dataGrid?.instance?.pageIndex(0);
		this.dataGrid?.instance?.refresh();
		this.isGrouped = false;
	}

}