// @ts-nocheck
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { Router } from '@angular/router';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import Swal from 'sweetalert2';
import { User } from 'src/app/entities/User';
import { LicenciamientoPermiso } from 'src/app/entities/licenciamiento-permiso.const';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { LocalComercial } from '../../models/local-comercial';
import { LocalComercialService } from '../../services/local-comercial.service';
import { PreRegistroStateService } from '../../services/pre-registro-state.service';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { environment } from 'src/environments/environment';
import { exportarTablaExcel } from 'src/app/shared/utils/excel-export.util';
import {
  exportarLocalesComercialesPdf,
  mockLocalComercialPdfPayload,
} from '../../utils/locales-comerciales-pdf.util';

@Component({
  selector: 'app-lista-local-comercial',
  templateUrl: './lista-local-comercial.component.html',
  styleUrls: ['./lista-local-comercial.component.scss'],
  standalone: false,
  animations: [routeAnimation]
})

export class ListaLocalComercialComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gridContainer', { static: false }) dataGrid: DxDataGridComponent;
  public listaLocales: any;
  public datosReporte = [];
  public mensajeModulo: string = 'Locales Comerciales';
  public exportMenuOpen = false;
  private onDocClick = (ev: MouseEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target?.closest?.('.mon-hist__export-wrap')) {
      this.ngZone.run(() => {
        this.exportMenuOpen = false;
      });
    }
  };
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
  public loading: boolean = false;
  public isDisabled: boolean = true;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna"
  public loadingMessage: string = 'Cargando...';
  public interval = null;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 100;
  public totalPaginas: number = 0;
  public paginaActualData: LocalComercial[] = [];
  public filtroActivo: string = '';

  private _gap = 16;
  gap = `${this._gap}px`;
  col2 = `1 1 calc(50% - ${this._gap / 2}px)`;
  col3 = `1 1 calc(33.3333% - ${this._gap / 1.5}px)`;

  /** Valores `datetime-local` (yyyy-MM-ddTHH:mm) */
  public fechaInicio: string | null = null;
  public fechaFinal: string | null = null;
  /** `null` = todos excepto Baja (ocultos por defecto). */
  public filtroEstatus: number | null = null;
  public readonly opcionesFiltroEstatus: { id: number | null; nombre: string }[] = [
    { id: null, nombre: 'Todos (sin Baja)' },
    { id: 1, nombre: 'Información Faltante' },
    { id: 2, nombre: 'Rechazo o Sin respuesta' },
    { id: 3, nombre: 'Datos Correctos' },
    { id: 4, nombre: 'Revisión' },
    { id: 5, nombre: 'Baja' },
  ];
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

  private pickField(item: any, ...keys: string[]): any {
    if (!item) {
      return undefined;
    }
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key];
      }
    }
    return undefined;
  }

  /** Catálogo de estatus (mismo que detalle / DB). */
  private readonly NOMBRE_ESTATUS: Record<number, string> = {
    1: 'Información Faltante',
    2: 'Rechazo o Sin respuesta',
    3: 'Datos Correctos',
    4: 'Revisión',
    5: 'Baja',
  };

  private resolverNombreEstatus(estatus: number, nombre?: unknown): string {
    if (nombre != null && String(nombre).trim() !== '' && String(nombre).toLowerCase() !== 'null') {
      return String(nombre).trim();
    }
    return this.NOMBRE_ESTATUS[estatus] ?? '';
  }

  /** Catálogo GruposCapturistaVisita (Id → Nombre). */
  private readonly NOMBRE_GRUPO_CAPTURISTA: Record<number, string> = {
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'D',
    5: 'E',
    6: 'F',
    7: 'G',
  };

  private resolverNombreGrupoCapturista(item: any): string {
    const idGrupo = Number(
      this.pickField(
        item,
        'idGrupoCapturistaVisita',
        'IdGrupoCapturistaVisita',
        'idGrupo',
        'IdGrupo'
      )
    );
    if (Number.isFinite(idGrupo) && this.NOMBRE_GRUPO_CAPTURISTA[idGrupo]) {
      return this.NOMBRE_GRUPO_CAPTURISTA[idGrupo];
    }
    const nombre = this.pickField(item, 'grupo', 'Grupo', 'nombreGrupo', 'NombreGrupo');
    return nombre != null ? String(nombre) : '';
  }

  private resolverNombreCapturista(item: any): string {
    const completo = this.pickField(
      item,
      'nombreCompletoCapturista',
      'NombreCompletoCapturista'
    );
    if (completo != null && String(completo).trim() !== '') {
      return String(completo).trim();
    }
    const partes = [
      this.pickField(item, 'nombreCapturista', 'NombreCapturista'),
      this.pickField(item, 'apellidoPaternoCapturista', 'ApellidoPaternoCapturista'),
      this.pickField(item, 'apellidoMaternoCapturista', 'ApellidoMaternoCapturista'),
    ]
      .map((p) => (p != null ? String(p).trim() : ''))
      .filter((p) => p !== '' && p.toLowerCase() !== 'null');
    if (partes.length) {
      return partes.join(' ');
    }
    return this.pickField(item, 'capturista', 'Capturista') ?? '';
  }

  private resolverFechaExpedicion(item: any): Date | null {
    const raw = this.pickField(
      item,
      'fechaExpedicion',
      'FechaExpedicion',
      'fechaHoraLicencia',
      'FechaHoraLicencia',
      'fechaCreacion',
      'FechaCreacion',
      'fechaHora',
      'FechaHora'
    );
    if (raw == null || raw === '') {
      return null;
    }
    const fecha = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  /** Mapea la fila plana de POST /registros/por-rango-fechas al grid. */
  private mapRegistroToLocal(item: any): LocalComercial {
    const estatus = Number(
      this.pickField(item, 'estatus', 'Estatus', 'idEstatus', 'IdEstatus') ?? 0
    );
    const nombreEstatusApi = this.pickField(
      item,
      'nombreEstatus',
      'NombreEstatus',
      'estatusNombre',
      'EstatusNombre'
    );
    const fechaExpedicion = this.resolverFechaExpedicion(item);

    const predioObraRaw = this.pickField(item, 'predioObra', 'PredioObra');
    const predioObra = Number(predioObraRaw) === 1 ? 1 : 0;

    return {
      id: Number(this.pickField(item, 'id', 'Id') ?? 0),
      rfc: this.pickField(item, 'rfc', 'RFC', 'Rfc'),
      nombreComercial: this.pickField(item, 'nombreComercial', 'NombreComercial'),
      predioObra,
      predioObraLabel: predioObra === 1 ? 'En obra' : 'Sin obra',
      giro: this.pickField(item, 'giro', 'Giro', 'nombreGiro', 'NombreGiro'),
      nombreCapturista: this.resolverNombreCapturista(item),
      nombreEstatus: this.resolverNombreEstatus(estatus, nombreEstatusApi),
      estatus,
      fechaHora: fechaExpedicion,
      fechaCreacion: fechaExpedicion,
      urlLicencia: this.pickField(
        item,
        'urlLicencia',
        'UrlLicencia',
        'licenciaFuncionamiento',
        'LicenciaFuncionamiento'
      ),
      lat: Number(this.pickField(item, 'latitud', 'Latitud', 'lat', 'Lat') ?? 0),
      lng: Number(this.pickField(item, 'longitud', 'Longitud', 'lng', 'Lng') ?? 0),
      grupo: this.resolverNombreGrupoCapturista(item),
    } as LocalComercial;
  }

  private normalizeListaLocales(locales: LocalComercial[]): LocalComercial[] {
    return (locales || []).map((item) => {
      const nombreEstatus = this.resolverNombreEstatus(
        Number(item.estatus),
        item.nombreEstatus
      );
      const predioObra = Number((item as any).predioObra) === 1 ? 1 : 0;
      return {
        ...item,
        urlLicencia: this.resolveFotoRuta(item.urlLicencia),
        rfc: this.formatGridText(item.rfc),
        nombreComercial: this.formatGridText(item.nombreComercial),
        predioObra,
        predioObraLabel: predioObra === 1 ? 'En obra' : 'Sin obra',
        giro: this.formatGridText(item.giro),
        nombreCapturista: this.formatGridText(item.nombreCapturista),
        grupo: this.formatGridText(item.grupo),
        nombreEstatus: nombreEstatus || this.formatGridText(item.nombreEstatus),
      };
    });
  }

  col(colAmount: number) {
    return `1 1 calc(${100 / colAmount}% - ${this._gap - (this._gap / colAmount)}px)`;
  }

  constructor(
	  private router: Router,
	  private datepipe: DatePipe,
	  private localComercialService: LocalComercialService,
	  private preRegistroState: PreRegistroStateService,
	  private googleMapsLoader: GoogleMapsLoaderService,
	  private ngZone: NgZone,
  ) {
		this.showHeaderFilter = true;
        this.showFilterRow = true;
  	}

	ngOnInit() {
		this.inicializarRangoFechas();
		this.obtenerPermisos();
		this.setupDataSource();
		// Precarga Maps mientras el usuario ve la lista (detalle abre más rápido).
		void this.googleMapsLoader.load(environment.googleMapsApiKey, ['maps', 'streetView']);
		document.addEventListener('click', this.onDocClick);
	}

	ngAfterViewInit() {
		/* CustomStore carga al montar el grid. */
	}

	ngOnDestroy() {
		document.removeEventListener('click', this.onDocClick);
		clearInterval(this.interval);
	}

	toggleExportMenu(event: MouseEvent): void {
		event.stopPropagation();
		this.exportMenuOpen = !this.exportMenuOpen;
	}

	cerrarExportMenu(): void {
		this.exportMenuOpen = false;
	}

	private obtenerLocalesParaExport(): LocalComercial[] {
		const base = this.filtrarPorEstatus(this.paginaActualData || []);
		return Array.isArray(base) ? base : [];
	}

	/** PDF: incluye también locales en Baja aunque el filtro de la grilla los oculte. */
	private obtenerLocalesParaPdf(): LocalComercial[] {
		const todos = this.paginaActualData || [];
		const visibles = this.obtenerLocalesParaExport();
		const bajas = todos.filter((row) => this.estaDeBaja(row));
		const map = new Map<number, LocalComercial>();
		[...visibles, ...bajas].forEach((row) => {
			const id = Number(row?.id);
			if (Number.isFinite(id)) {
				map.set(id, row);
			}
		});
		return Array.from(map.values());
	}

	private etiquetaFiltroEstatus(): string {
		const op = (this.opcionesFiltroEstatus || []).find(
			(o) => o.id === this.filtroEstatus
		);
		return op?.nombre ?? 'Todos';
	}

	async exportarExcel(): Promise<void> {
		this.cerrarExportMenu();
		try {
			const locales = this.obtenerLocalesParaExport();
			const data = locales.map((row) => ({
				Estatus: row.nombreEstatus ?? '',
				RFC: row.rfc ?? '',
				'Nombre Comercial': row.nombreComercial ?? '',
				'Predio en obra': row.predioObraLabel ?? '',
				Giro: row.giro ?? '',
				Capturista: row.nombreCapturista ?? '',
				Grupo: row.grupo ?? '',
				'Fecha Expedición':
					this.datepipe.transform(row.fechaCreacion ?? row.fechaHora, 'yyyy-MM-dd - h:mm a') ??
					'',
			}));

			await exportarTablaExcel({
				sheetName: 'Locales Comerciales',
				fileName: 'Locales Comerciales',
				columns: [
					{ header: 'Estatus', key: 'Estatus', width: 24 },
					{ header: 'RFC', key: 'RFC', width: 16 },
					{ header: 'Nombre Comercial', key: 'Nombre Comercial', width: 32 },
					{ header: 'Predio en obra', key: 'Predio en obra', width: 16 },
					{ header: 'Giro', key: 'Giro', width: 22 },
					{ header: 'Capturista', key: 'Capturista', width: 26 },
					{ header: 'Grupo', key: 'Grupo', width: 12 },
					{ header: 'Fecha Expedición', key: 'Fecha Expedición', width: 22 },
				],
				rows: data,
			});
		} catch (err: any) {
			if (err?.message === 'EMPTY') {
				Swal.fire({
					title: 'Sin datos',
					text: 'No hay locales para exportar con el filtro actual.',
					icon: 'info',
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Entendido',
					background: '#141a21',
					color: '#ffffff',
				});
				return;
			}
			console.error('Error al exportar Excel:', err);
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

	async exportarPdf(): Promise<void> {
		this.cerrarExportMenu();
		try {
			const locales = this.obtenerLocalesParaPdf();
			const payload =
				locales.length > 0
					? {
							fechaInicial: this.fechaInicio,
							fechaFinal: this.fechaFinal,
							estatusFiltro: this.etiquetaFiltroEstatus(),
							locales,
						}
					: mockLocalComercialPdfPayload();

			await exportarLocalesComercialesPdf(payload);
		} catch (err) {
			console.error('Error al exportar PDF:', err);
			Swal.fire({
				title: '¡Ops!',
				text: 'No se pudo generar el PDF.',
				icon: 'error',
				confirmButtonColor: '#3085d6',
				confirmButtonText: 'Entendido',
				background: '#141a21',
				color: '#ffffff',
			});
		}
	}

	setupDataSource() {
		this.loading = true;

		this.listaLocales = new CustomStore({
			key: 'id',
			load: async () => {
				const fechaInicio = this.toApiDateOnly(this.fechaInicio);
				const fechaFin = this.toApiDateOnly(this.fechaFinal);

				if (!fechaInicio || !fechaFin) {
					this.loading = false;
					this.paginaActualData = [];
					this.crearReporte([]);
					return { data: [], totalCount: 0 };
				}

				try {
					const resp: any = await lastValueFrom(
						this.localComercialService.obtenerRegistrosPorRangoFechas(
							fechaInicio,
							fechaFin
						)
					);
					this.loading = false;
					const rows: any[] = Array.isArray(resp)
						? resp
						: Array.isArray(resp?.data)
							? resp.data
							: [];

					const dataTransformada = this.normalizeListaLocales(
						rows.map((item) => this.mapRegistroToLocal(item))
					);

					this.paginaActualData = dataTransformada;
					const dataFiltrada = this.filtrarPorEstatus(dataTransformada);
					this.totalRegistros = dataFiltrada.length;
					this.paginaActual = 1;
					this.totalPaginas = Math.max(
						1,
						Math.ceil(this.totalRegistros / (this.pageSize || 100))
					);
					this.showTable = true;
					this.crearReporte(dataFiltrada);

					return {
						data: dataFiltrada,
						totalCount: dataFiltrada.length,
					};
				} catch (error) {
					this.loading = false;
					console.error('Error en la solicitud por rango de fechas:', error);
					this.paginaActualData = [];
					this.crearReporte([]);
					return { data: [], totalCount: 0 };
				}
			},
		});
	}

	onPageIndexChanged(e: any) {
		const pageIndex = e.component.pageIndex();
		this.paginaActual = pageIndex + 1;
	}

	onGridOptionChanged(e: any) {
		if (e.fullName !== 'searchPanel.text') return;

		const grid = this.dataGrid?.instance;
		const q = (e.value ?? '').toString().trim().toLowerCase();

		if (!q) {
			this.filtroActivo = '';
			this.aplicarVistaFiltrada();
			return;
		}
		this.filtroActivo = q;

		let columnas: any[] = [];
		try {
			const colsOpt = grid?.option('columns');
			if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
		} catch { }
		if (!columnas.length && grid?.getVisibleColumns) {
			columnas = grid.getVisibleColumns();
		}

		const dataFields: string[] = columnas
			.map((c: any) => c?.dataField)
			.filter((df: any) => typeof df === 'string' && df.trim().length > 0);

		const getByPath = (obj: any, path: string) => {
			if (!obj || !path) return undefined;
			return path.split('.').reduce((acc, key) => acc?.[key], obj);
		};

		const normalizar = (val: any): string => {
			if (val === null || val === undefined) return '';
			if (val instanceof Date) {
				const dd = String(val.getDate()).padStart(2, '0');
				const mm = String(val.getMonth() + 1).padStart(2, '0');
				const yyyy = val.getFullYear();
				return `${dd}/${mm}/${yyyy}`.toLowerCase();
			}
			if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T?/.test(val)) {
				const d = new Date(val);
				if (!isNaN(d.getTime())) {
					const dd = String(d.getDate()).padStart(2, '0');
					const mm = String(d.getMonth() + 1).padStart(2, '0');
					const yyyy = d.getFullYear();
					return `${val.toLowerCase()} ${dd}/${mm}/${yyyy}`;
				}
			}
			if (Array.isArray(val)) return val.map(normalizar).join(' ');
			return String(val).toLowerCase();
		};

		const base = this.filtrarPorEstatus(this.paginaActualData || []);
		const dataFiltrada = base.filter((row: any) => {
			const hitEnColumnas = dataFields.some((df) =>
				normalizar(getByPath(row, df)).includes(q)
			);
			const extras = [
				normalizar(row?.id),
				normalizar(row?.rfc),
				normalizar(row?.nombreComercial),
				normalizar(row?.giro),
				normalizar(row?.nombreCapturista),
				normalizar(row?.nombreEstatus),
			];
			const hitExtras = extras.some((s) => s.includes(q));
			return hitEnColumnas || hitExtras;
		});
		grid?.option('dataSource', dataFiltrada);
	}

	/** Oculta Baja por defecto; si hay id de estatus, filtra solo ese. */
	private filtrarPorEstatus(locales: LocalComercial[]): LocalComercial[] {
		const data = locales || [];
		if (this.filtroEstatus == null) {
			return data.filter((row) => !this.estaDeBaja(row));
		}
		return data.filter((row) => Number(row.estatus) === Number(this.filtroEstatus));
	}

	onFiltroEstatusChange(): void {
		this.aplicarVistaFiltrada();
	}

	private aplicarVistaFiltrada(): void {
		const grid = this.dataGrid?.instance;
		const base = this.filtrarPorEstatus(this.paginaActualData || []);
		const q = (this.filtroActivo || '').trim().toLowerCase();

		let dataFiltrada = base;
		if (q) {
			const normalizar = (val: any): string => {
				if (val === null || val === undefined) return '';
				if (val instanceof Date) {
					const dd = String(val.getDate()).padStart(2, '0');
					const mm = String(val.getMonth() + 1).padStart(2, '0');
					const yyyy = val.getFullYear();
					return `${dd}/${mm}/${yyyy}`.toLowerCase();
				}
				return String(val).toLowerCase();
			};
			dataFiltrada = base.filter((row: any) => {
				const extras = [
					normalizar(row?.id),
					normalizar(row?.rfc),
					normalizar(row?.nombreComercial),
					normalizar(row?.giro),
					normalizar(row?.nombreCapturista),
					normalizar(row?.nombreEstatus),
					normalizar(row?.grupo),
				];
				return extras.some((s) => s.includes(q));
			});
		}

		this.totalRegistros = dataFiltrada.length;
		this.totalPaginas = Math.max(
			1,
			Math.ceil(this.totalRegistros / (this.pageSize || 100))
		);
		this.crearReporte(dataFiltrada);
		grid?.option('dataSource', dataFiltrada);
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

	/** YYYY-MM-DD para POST /registros/por-rango-fechas. */
	private toApiDateOnly(value: string | Date | null | undefined): string | null {
		if (value == null || value === '') {
			return null;
		}
		if (value instanceof Date) {
			return this.datepipe.transform(value, 'yyyy-MM-dd');
		}
		const text = String(value).trim();
		const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
		if (match) {
			return match[1];
		}
		return this.datepipe.transform(text, 'yyyy-MM-dd');
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

/*------------------------------------
	Obtención de Información en grids
------------------------------------*/
    obtenerListaLocalesComerciales(_fechaInicio, _fechaFinal) {
		this.setupDataSource();
		this.dataGrid?.instance?.refresh();
	}
	
	obtenerListaLocalComercial() {
		this.setupDataSource();
		this.dataGrid?.instance?.refresh();
	}


/*-------------------------------
	Enrutamiento
-------------------------------*/
  AgregarLocal(){
    this.preRegistroState.beginFlow('nuevo');
    this.router.navigateByUrl('/local-comercial/pre-alta-local-comercial');
  }

  EditarLocal(id: number){
    this.preRegistroState.beginFlow(id);
    this.router.navigateByUrl('/local-comercial/pre-actualizar-local-comercial/' + id);
  }

  detalleLocal(id: number){
	  this.onShown();
    this.router.navigateByUrl('/local-comercial/detalle-local-comercial/' + id);
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
				this.aplicarCambioEstatusLista(
					rowData,
					this.ESTATUS_ALTA,
					'Revisión',
					'El local comercial ha sido activado.'
				);
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
				this.aplicarCambioEstatusLista(
					rowData,
					this.ESTATUS_BAJA,
					'Baja',
					'El local comercial ha sido desactivado.'
				);
			}
		});
	}

	/** Mismo contrato que detalle: PATCH /registros/{id}/estatus. Baja siempre envía id 5. */
	private aplicarCambioEstatusLista(
		rowData: LocalComercial,
		estatus: number,
		nombreEstatus: string,
		mensajeExito: string
	): void {
		const id = Number(rowData?.id);
		if (!id) {
			Swal.fire({
				color: '#ffffff',
				background: '#141a21',
				title: 'Error',
				html: 'No se pudo identificar el local comercial.',
				icon: 'error',
				confirmButtonColor: '#3085d6',
				confirmButtonText: 'Entendido',
			});
			return;
		}

		this.loadingVisible = true;
		this.loadingMessage = 'Actualizando estatus...';

		this.localComercialService.actualizarEstatusRegistro(id, estatus).subscribe({
			next: () => {
				rowData.estatus = estatus;
				rowData.nombreEstatus = this.NOMBRE_ESTATUS[estatus] ?? nombreEstatus;
				this.loadingVisible = false;
				this.aplicarVistaFiltrada();
				// NO BORRAR — Alerta éxito al cambiar estatus.
				Swal.fire({
					color: '#ffffff',
					background: '#141a21',
					title: '¡Confirmación Realizada!',
					html: mensajeExito,
					icon: 'success',
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Confirmar',
				});
			},
			error: () => {
				this.loadingVisible = false;
				Swal.fire({
					color: '#ffffff',
					background: '#141a21',
					title: 'Error',
					html: 'No se pudo actualizar el estatus. Intente de nuevo.',
					icon: 'error',
					confirmButtonColor: '#3085d6',
					confirmButtonText: 'Entendido',
				});
			},
		});
	}

	private refrescarListaTrasEstatus(): void {
		this.setupDataSource();
		this.dataGrid?.instance?.refresh();
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
		this.filtroActivo = '';
		this.filtroEstatus = null;
		this.setupDataSource();
		this.dataGrid?.instance?.refresh();
		this.isGrouped = false;
	}

}
