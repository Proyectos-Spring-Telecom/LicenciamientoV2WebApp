import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { PermisosService } from 'src/app/services/moduleService/permisos.service';
import { RolesService } from 'src/app/services/moduleService/roles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-rol',
  templateUrl: './agregar-rol.component.html',
  styleUrl: './agregar-rol.component.scss',
  standalone: false,
  animations: [routeAnimation],
})
export class AgregarRolComponent implements OnInit {
  public submitButton = 'Guardar';
  public loading = false;
  public rolForm!: FormGroup;
  public idRol: number | null = null;
  public title = 'Agregar Rol';
  public listaModulos: any[] = [];
  public permisosSeleccionadosIds: number[] = [];

  get esEdicion(): boolean {
    return this.idRol != null && Number.isFinite(this.idRol);
  }

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private permisosService: PermisosService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.obtenerModulosConPermisos();
    this.activatedRoute.params.subscribe((params) => {
      this.idRol = params['idRol'] != null ? Number(params['idRol']) : null;
      if (this.idRol) {
        this.title = 'Actualizar Rol';
        this.submitButton = 'Actualizar';
        this.obtenerRol();
      }
    });
  }

  initForm() {
    this.rolForm = this.fb.group({
      nombre: ['', Validators.required],
      permisos: this.fb.control<number[]>([]),
    });
  }

  /** GET /permisos/permisosAgrupados — módulos con sus permisos. */
  obtenerModulosConPermisos() {
    this.permisosService.obtenerPermisosAgrupados().subscribe((response: any) => {
      this.listaModulos = this.normalizarPermisosAgrupados(response);
      this.applyAssignedPermsToModules();
      this.syncPermisosSeleccionados();
    });
  }

  private normalizarPermisosAgrupados(response: any): any[] {
    let raw: any[] = [];
    if (Array.isArray(response?.data)) {
      raw = response.data;
    } else if (Array.isArray(response)) {
      raw = response;
    } else if (response?.data && typeof response.data === 'object') {
      raw = Object.entries(response.data).map(([nombre, permisos]) => ({
        nombre,
        permisos,
      }));
    }

    return raw.map((m: any) => {
      const permisosRaw = m?.Permisos ?? m?.permisos ?? m?.listaPermisos ?? [];
      return {
        id: Number(m?.Id ?? m?.id ?? m?.idModulo ?? 0),
        nombre:
          m?.NombreModulo ??
          m?.nombreModulo ??
          m?.nombre ??
          m?.Nombre ??
          '',
        descripcion: m?.Descripcion ?? m?.descripcion ?? '',
        estatus: m?.Estatus ?? m?.estatus,
        permisos: (Array.isArray(permisosRaw) ? permisosRaw : []).map((p: any) => ({
          id: Number(p?.Id ?? p?.id ?? p?.idPermiso),
          nombre: p?.Nombre ?? p?.nombre ?? p?.nombrePermiso ?? '',
          descripcion:
            p?.Descripcion ?? p?.descripcion ?? p?.descripcionPermiso ?? '',
          estatus: p?.Estatus ?? p?.estatus,
          asignado: false,
        })),
      };
    });
  }

  obtenerRol() {
    if (this.idRol == null) return;

    this.rolesService.obtenerRole(this.idRol).subscribe((response: any) => {
      const data = response?.data ?? response ?? {};
      this.idRol = Number(data.id ?? data.Id ?? this.idRol);

      this.permisosSeleccionadosIds = this.extraerIdsPermisos(
        data.permisos ?? data.Permisos ?? [],
      );

      this.rolForm.patchValue({
        nombre: data.nombre ?? data.Nombre ?? '',
        permisos: this.permisosSeleccionadosIds,
      });

      // Solo aplica flags; no resincronizar si aún no cargan los módulos.
      this.applyAssignedPermsToModules();
    });
  }

  /**
   * El GET /roles/{id} entrega permisos agrupados:
   * [{ IdModulo, NombreModulo, Permisos: [{ Id, Nombre, Descripcion }] }]
   * También acepta ids planos [1,2,5] u objetos { id }.
   */
  private extraerIdsPermisos(permisosRaw: any): number[] {
    if (!Array.isArray(permisosRaw)) return [];

    const ids: number[] = [];
    const pushId = (value: any) => {
      const id = Number(value);
      if (Number.isFinite(id) && !ids.includes(id)) {
        ids.push(id);
      }
    };

    for (const item of permisosRaw) {
      if (item == null) continue;

      if (typeof item !== 'object') {
        pushId(item);
        continue;
      }

      const nested = item.Permisos ?? item.permisos;
      if (Array.isArray(nested)) {
        nested.forEach((p: any) =>
          pushId(typeof p === 'object' ? (p?.Id ?? p?.id ?? p?.idPermiso) : p),
        );
        continue;
      }

      pushId(item.Id ?? item.id ?? item.idPermiso);
    }

    return ids;
  }

  private syncPermisosSeleccionados(): void {
    const ids: number[] = [];
    this.listaModulos.forEach((m) => {
      (m.permisos || []).forEach((p: any) => {
        if (p.asignado && !ids.includes(p.id)) {
          ids.push(p.id);
        }
      });
    });
    this.permisosSeleccionadosIds = ids;
    this.rolForm.patchValue({ permisos: this.permisosSeleccionadosIds });
  }

  private applyAssignedPermsToModules(): void {
    if (!Array.isArray(this.listaModulos)) return;
    const asignados = new Set((this.permisosSeleccionadosIds || []).map(Number));
    this.listaModulos = this.listaModulos.map((m) => ({
      ...m,
      permisos: (m.permisos || []).map((p: any) => {
        const idNum = Number(p?.id ?? p?.Id);
        const activo = asignados.has(idNum);
        return {
          ...p,
          id: idNum,
          asignado: activo,
        };
      }),
    }));
  }

  onPermChange(_modulo: any, permiso: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setPermisoAsignado(permiso, input.checked);
  }

  togglePermiso(permiso: any): void {
    this.setPermisoAsignado(permiso, !permiso.asignado);
  }

  private setPermisoAsignado(permiso: any, checked: boolean): void {
    permiso.asignado = checked;
    const id = Number(permiso.id);

    if (checked) {
      if (!this.permisosSeleccionadosIds.includes(id)) {
        this.permisosSeleccionadosIds = [...this.permisosSeleccionadosIds, id];
      }
    } else {
      this.permisosSeleccionadosIds = this.permisosSeleccionadosIds.filter((x) => x !== id);
    }

    this.rolForm.patchValue({ permisos: this.permisosSeleccionadosIds });
  }

  onModuleToggle(modulo: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    const checked = input.checked;
    const permisos = modulo.permisos || [];

    permisos.forEach((permiso: any) => {
      permiso.asignado = checked;
      const id = Number(permiso.id);

      if (checked) {
        if (!this.permisosSeleccionadosIds.includes(id)) {
          this.permisosSeleccionadosIds = [...this.permisosSeleccionadosIds, id];
        }
      } else {
        this.permisosSeleccionadosIds = this.permisosSeleccionadosIds.filter((x) => x !== id);
      }
    });

    this.rolForm.patchValue({ permisos: this.permisosSeleccionadosIds });
  }

  isModuleFullyAssigned(modulo: any): boolean {
    if (!modulo || !Array.isArray(modulo.permisos) || modulo.permisos.length === 0) {
      return false;
    }
    return modulo.permisos.every((p: any) => !!p.asignado);
  }

  submit() {
    if (this.esEdicion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  private validarFormulario(): boolean {
    this.syncPermisosSeleccionados();
    const nombre = String(this.rolForm.value.nombre ?? '').trim();
    const faltantes: string[] = [];

    if (!nombre) faltantes.push('Nombre');
    if (!this.permisosSeleccionadosIds.length) faltantes.push('Permisos');

    if (faltantes.length) {
      this.submitButton = this.esEdicion ? 'Actualizar' : 'Guardar';
      this.loading = false;
      const lista = faltantes
        .map(
          (campo, index) => `
          <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                      background: #caa8a8; text-align: center; margin-bottom: 8px;
                      border-radius: 4px;">
            <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
          </div>`,
        )
        .join('');

      Swal.fire({
        background: '#141a21',
        color: '#ffffff',
        title: '¡Faltan campos obligatorios!',
        html: `
          <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
            Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
            Por favor complétalos antes de continuar:
          </p>
          <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
      });
      return false;
    }
    return true;
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (!this.validarFormulario()) return;

    const payload = {
      nombre: String(this.rolForm.value.nombre ?? '').trim(),
      permisos: [...this.permisosSeleccionadosIds],
    };

    this.rolesService.agregarRole(payload).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          background: '#141a21',
          color: '#ffffff',
          title: '¡Operación Exitosa!',
          text: 'Se agregó un nuevo rol de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          background: '#141a21',
          color: '#ffffff',
          title: '¡Ops!',
          text: 'Ocurrió un error al agregar el rol.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idRol == null || !this.validarFormulario()) return;

    const payload = {
      id: Number(this.idRol),
      nombre: String(this.rolForm.value.nombre ?? '').trim(),
      permisos: [...this.permisosSeleccionadosIds],
    };

    this.rolesService.actualizarRoles(payload).subscribe({
      next: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          background: '#141a21',
          color: '#ffffff',
          title: '¡Operación Exitosa!',
          text: 'Los datos del rol se actualizaron correctamente.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: () => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          background: '#141a21',
          color: '#ffffff',
          title: '¡Ops!',
          text: 'Ocurrió un error al actualizar el rol.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  regresar() {
    this.router.navigateByUrl('/roles');
  }
}
