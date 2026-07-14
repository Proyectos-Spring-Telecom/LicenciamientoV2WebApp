import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { ModulosService } from 'src/app/services/moduleService/modulos.service';
import { PermisosService } from 'src/app/services/moduleService/permisos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-permiso',
  templateUrl: './agregar-permiso.component.html',
  styleUrl: './agregar-permiso.component.scss',
  standalone: false,
  animations: [routeAnimation],
})
export class AgregarPermisoComponent implements OnInit {
  public submitButton: string = 'Guardar';
  public loading: boolean = false;
  public listaModulos: any[] = [];
  public permisoForm: FormGroup;
  public idPermiso: number | null = null;
  public title = 'Agregar Permiso';
  /** Nombre del módulo en edición (viene de idModulo2). */
  public nombreModuloActual = '';
  public listaClientes: any[] = [];
  selectedFileName: string = '';
  previewUrl: string | ArrayBuffer | null = null;

  get esEdicion(): boolean {
    return this.idPermiso != null && Number.isFinite(this.idPermiso);
  }

  constructor(
    private fb: FormBuilder,
    private permiService: PermisosService,
    private activatedRouted: ActivatedRoute,
    private route: Router,
    private moduSer: ModulosService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.activatedRouted.params.subscribe((params) => {
      this.idPermiso = params['idPermiso'] != null ? Number(params['idPermiso']) : null;
      if (this.idPermiso) {
        this.title = 'Actualizar Permiso';
        this.submitButton = 'Actualizar';
      }
      this.obtenerModulo(() => {
        if (this.idPermiso) {
          this.obtenerPermiso();
        }
      });
    });
  }

  public info: any;
  obtenerModulo(done?: () => void) {
    this.moduSer.obtenerModulos().subscribe({
      next: (response) => {
        let raw: any[] = [];
        if (Array.isArray(response?.data)) {
          raw = response.data;
        } else if (Array.isArray(response)) {
          raw = response;
        }

        this.listaModulos = raw
          .map((m: any) => ({
            id: Number(m?.Id ?? m?.id ?? m?.idModulo),
            nombre: String(m?.NombreModulo ?? m?.Nombre ?? m?.nombre ?? '').trim(),
          }))
          .filter((m) => Number.isFinite(m.id));

        done?.();
      },
      error: () => done?.(),
    });
  }

  obtenerPermiso() {
    if (this.idPermiso == null) {
      return;
    }

    this.permiService.obtenerPermiso(this.idPermiso).subscribe((response: any) => {
      const data = response?.data ?? {};
      const idModuloNum =
        data.idModulo != null
          ? Number(data.idModulo)
          : data.idModulo2?.id != null
            ? Number(data.idModulo2.id)
            : null;

      const nombreModulo = String(
        data.idModulo2?.nombre ?? data.nombreModulo ?? ''
      ).trim();

      this.idPermiso = Number(data.id ?? this.idPermiso);
      this.nombreModuloActual = nombreModulo;

      if (
        idModuloNum != null &&
        Number.isFinite(idModuloNum) &&
        !this.listaModulos.some((m) => m.id === idModuloNum)
      ) {
        this.listaModulos = [
          { id: idModuloNum, nombre: nombreModulo || `Módulo ${idModuloNum}` },
          ...this.listaModulos,
        ];
      }

      this.permisoForm.patchValue({
        nombre: data.nombre ?? '',
        descripcion: data.descripcion ?? '',
        idModulo: idModuloNum,
        estatus: data.estatus ?? 1,
      });

      // En actualización solo se envía descripcion; nombre y módulo quedan de solo lectura.
      this.permisoForm.get('nombre')?.disable({ emitEvent: false });
      this.permisoForm.get('idModulo')?.disable({ emitEvent: false });
    });
  }

  initForm() {
    this.permisoForm = this.fb.group({
      idModulo: [null, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      estatus: [1]
    });
  }

  submit() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.idPermiso) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  agregar() {
    this.submitButton = 'Cargando...';
    this.loading = true;
    if (this.permisoForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      const etiquetas: any = {
        nombre: 'Nombre',
        descripcion: 'Descripción',
        idModulo: 'Módulo',
      };

      const camposFaltantes: string[] = [];
      Object.keys(this.permisoForm.controls).forEach((key) => {
        const control = this.permisoForm.get(key);
        if (control?.invalid && control.errors?.['required']) {
          camposFaltantes.push(etiquetas[key] || key);
        }
      });

      const lista = camposFaltantes
        .map(
          (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
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
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }
    const payload = {
      nombre: String(this.permisoForm.value.nombre ?? '').trim(),
      descripcion: String(this.permisoForm.value.descripcion ?? '').trim(),
      idModulo: Number(this.permisoForm.value.idModulo),
    };
    this.permiService.agregarPermiso(payload).subscribe(
      (response: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: `Se agregó un nuevo permiso de manera exitosa.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#141a21',
          color: '#ffffff',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          text: `Ocurrió un error al agregar el permiso.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#141a21',
          color: '#ffffff',
        });
      }
    );
  }

  actualizar() {
    this.submitButton = 'Cargando...';
    this.loading = true;

    const descripcionCtrl = this.permisoForm.get('descripcion');
    if (descripcionCtrl?.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      Swal.fire({
        title: '¡Faltan campos obligatorios!',
        html: `
          <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
            El campo <strong>Descripción</strong> es obligatorio.
          </p>
        `,
        icon: 'error',
        background: '#141a21',
        color: '#ffffff',
        confirmButtonText: 'Entendido',
        customClass: {
          popup: 'swal2-padding swal2-border',
        },
      });
      return;
    }

    const payload = {
      descripcion: String(descripcionCtrl?.value ?? '').trim(),
    };

    this.permiService.actualizarPermiso(Number(this.idPermiso), payload).subscribe(
      (response: any) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: `Los datos del permiso se actualizaron correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#141a21',
          color: '#ffffff',
        });
        this.regresar();
      },
      (error: any) => {
        this.submitButton = 'Actualizar';
        this.loading = false;
        Swal.fire({
          title: '¡Ops!',
          text: `Ocurrió un error al actualizar el permiso.`,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
          background: '#141a21',
          color: '#ffffff',
        });
      }
    );
  }

  regresar() {
    this.route.navigateByUrl('/permisos');
  }
}
