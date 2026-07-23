import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { routeAnimation } from 'src/app/pipe/module-open.animation';
import { RolesService } from 'src/app/services/moduleService/roles.service';
import { UsuariosService } from 'src/app/services/moduleService/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-usuario',
  templateUrl: './agregar-usuario.component.html',
  styleUrl: './agregar-usuario.component.scss',
  standalone: false,
  animations: [
    routeAnimation,
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('160ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
})
export class AgregarUsuarioComponent implements OnInit {
  hideConfirm = true;
  confirmName = 'cpwd_' + Math.random().toString(36).slice(2, 12);
  hidePass = true;
  showPwdHints = false;
  animateHints = false;
  pwdValue = '';
  confirmValue = '';
  confirmHintVisible = false;
  confirmMatch = false;
  private confirmTimer: any;

  public submitButton = 'Guardar';
  public loading = false;
  public usuarioForm!: FormGroup;
  public idUsuario: number | null = null;
  public title = 'Agregar Usuario';
  public listaRoles: any[] = [];
  /** Catálogo de grupos (muestra Nombre, envía Id). */
  public listaGrupos: { id: number; nombre: string }[] = [
    { id: 1, nombre: 'A' },
    { id: 2, nombre: 'B' },
    { id: 3, nombre: 'C' },
    { id: 4, nombre: 'D' },
    { id: 5, nombre: 'E' },
    { id: 6, nombre: 'F' },
    { id: 7, nombre: 'G' },
  ];

  get esEdicion(): boolean {
    return this.idUsuario != null && Number.isFinite(this.idUsuario);
  }

  get requiereGrupo(): boolean {
    const idRol = Number(this.usuarioForm?.get('idRol')?.value);
    const rol = this.listaRoles.find((item) => Number(item.id) === idRol);
    const nombreRol = String(rol?.nombre ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

    return nombreRol === 'capturista' || nombreRol === 'supervisor';
  }

  private get hasMayus(): boolean {
    return /[A-Z]/.test(this.pwdValue);
  }
  private get hasMinus(): boolean {
    return /[a-z]/.test(this.pwdValue);
  }
  private get espCaracter(): boolean {
    return /[^A-Za-z0-9]/.test(this.pwdValue);
  }
  private get hasNumber(): boolean {
    return /\d/.test(this.pwdValue);
  }
  private get minCaracteres(): boolean {
    return this.pwdValue.length > 6;
  }
  private get maxCaracteres(): boolean {
    return this.pwdValue.length < 16;
  }

  get currentRuleKey(): 'case' | 'special' | 'number' | 'length' | 'ok' {
    if (!(this.hasMayus && this.hasMinus)) return 'case';
    if (!this.espCaracter) return 'special';
    if (!this.hasNumber) return 'number';
    if (!(this.minCaracteres && this.maxCaracteres)) return 'length';
    return 'ok';
  }

  constructor(
    private fb: FormBuilder,
    private usuaService: UsuariosService,
    private route: Router,
    private activatedRouted: ActivatedRoute,
    private rolService: RolesService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.obtenerRoles();

    this.activatedRouted.params.subscribe((params) => {
      this.idUsuario = params['idUsuario'] != null ? Number(params['idUsuario']) : null;
      if (this.idUsuario) {
        this.title = 'Actualizar Usuario';
        this.submitButton = 'Actualizar';
        this.aplicarModoEdicion();
        this.obtenerUsuarioID();
      }
    });
  }

  private passwordsMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    if (!password && !confirmPassword) return null;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  initForm() {
    this.usuarioForm = this.fb.group(
      {
        nombre: ['', [Validators.required]],
        apellidoPaterno: ['', [Validators.required]],
        apellidoMaterno: ['', [Validators.required]],
        correo: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
        idRol: [null, [Validators.required]],
        idGrupo: [null],
        telefono: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator.bind(this) },
    );

    this.usuarioForm.get('idRol')?.valueChanges.subscribe(() => {
      this.actualizarValidadorGrupo();
    });
  }

  private actualizarValidadorGrupo(): void {
    const grupoControl = this.usuarioForm.get('idGrupo');
    if (this.requiereGrupo) {
      grupoControl?.setValidators([Validators.required]);
    } else {
      grupoControl?.clearValidators();
    }
    grupoControl?.updateValueAndValidity({ emitEvent: false });
  }

  private aplicarModoEdicion(): void {
    ['correo', 'password', 'confirmPassword'].forEach((key) => {
      const ctrl = this.usuarioForm.get(key);
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  obtenerRoles() {
    this.rolService.obtenerRoles().subscribe((response) => {
      const raw = (response as any)?.data ?? response;
      this.listaRoles = (Array.isArray(raw) ? raw : []).map((r: any) => ({
        ...r,
        id: Number(r.id ?? r.Id),
        nombre: r.nombre ?? r.Nombre ?? '',
      }));
      this.actualizarValidadorGrupo();
    });
  }

  obtenerUsuarioID() {
    if (this.idUsuario == null) return;

    this.usuaService.obtenerUsuario(this.idUsuario).subscribe((response: any) => {
      const data = response?.data ?? response ?? {};
      const usuarios = Array.isArray(data?.usuario)
        ? data.usuario
        : Array.isArray(data?.usuarios)
          ? data.usuarios
          : data?.usuario
            ? [data.usuario]
            : data?.id != null
              ? [data]
              : [];

      const u = usuarios[0] ?? data ?? {};

      this.usuarioForm.patchValue({
        nombre: u?.nombre ?? '',
        apellidoPaterno: u?.apellidoPaterno ?? '',
        apellidoMaterno: u?.apellidoMaterno ?? '',
        telefono: u?.phoneNumber ?? '',
        idRol: u?.idRol != null ? Number(u.idRol) : null,
        idGrupo: u?.idGrupo != null ? Number(u.idGrupo) : null,
      });
    });
  }

  onPwdFocus() {
    this.showPwdHints = true;
    setTimeout(() => (this.animateHints = true), 0);
  }

  onPwdBlur() {
    this.showPwdHints = false;
    this.animateHints = false;
  }

  onPwdInput(e: Event) {
    this.pwdValue = (e.target as HTMLInputElement).value || '';
    if (this.confirmHintVisible) this.validateConfirm();
  }

  onConfirmInput(e: Event) {
    this.confirmValue = (e.target as HTMLInputElement).value || '';
    clearTimeout(this.confirmTimer);
    this.confirmTimer = setTimeout(() => {
      this.validateConfirm();
      this.confirmHintVisible = this.confirmValue.length > 0;
    }, 400);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.keyCode ? event.keyCode : event.which;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onConfirmBlur() {
    clearTimeout(this.confirmTimer);
    this.validateConfirm();
    this.confirmHintVisible = this.confirmValue.length > 0;
  }

  private validateConfirm() {
    this.confirmMatch = this.confirmValue === this.pwdValue;
  }

  submit() {
    if (this.esEdicion) {
      this.actualizar();
    } else {
      this.agregar();
    }
  }

  /** POST /usuarios — estatus fijo en 1; no se envía emailConfirmed. */
  private buildPayloadParaAgregar() {
    const v = this.usuarioForm.value;
    return {
      nombre: String(v.nombre ?? '').trim(),
      apellidoPaterno: String(v.apellidoPaterno ?? '').trim(),
      apellidoMaterno: String(v.apellidoMaterno ?? '').trim(),
      correo: String(v.correo ?? '').trim(),
      telefono: String(v.telefono ?? '').trim(),
      password: v.password,
      confirmPassword: v.confirmPassword,
      idRol: Number(v.idRol),
      idGrupo: v.idGrupo == null || v.idGrupo === '' ? null : Number(v.idGrupo),
      estatus: 1,
    };
  }

  /** PATCH /usuarios/{id} */
  private buildPayloadParaActualizar() {
    const v = this.usuarioForm.getRawValue();
    return {
      nombre: String(v.nombre ?? '').trim(),
      apellidoPaterno: String(v.apellidoPaterno ?? '').trim(),
      apellidoMaterno: String(v.apellidoMaterno ?? '').trim(),
      telefono: String(v.telefono ?? '').trim(),
      idRol: Number(v.idRol),
      idGrupo: v.idGrupo == null || v.idGrupo === '' ? null : Number(v.idGrupo),
    };
  }

  /** Extrae el mensaje del API (responseType text o JSON). */
  private mensajeErrorServicio(err: any, fallback: string): string {
    const body = err?.error;
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body?.mensaje && String(body.mensaje).trim()) return String(body.mensaje).trim();
    if (body?.message && String(body.message).trim()) return String(body.message).trim();
    if (body?.error && typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    if (err?.message && typeof err.message === 'string' && err.message.trim()) return err.message.trim();
    return fallback;
  }

  private mostrarCamposFaltantes(campos: string[]): void {
    const lista = campos
      .map(
        (campo, index) => `
        <div style="padding:8px 12px;border-left:4px solid #d9534f;
                    background:#caa8a8;text-align:center;margin-bottom:8px;border-radius:4px;">
          <strong style="color:#b02a37;">${index + 1}. ${campo}</strong>
        </div>`,
      )
      .join('');

    Swal.fire({
      color: '#ffffff',
      background: '#141a21',
      title: '¡Faltan campos obligatorios!',
      html: `
        <p style="text-align:center;font-size:15px;margin-bottom:16px;color:white">
          Los siguientes <strong>campos</strong> requieren atención:
        </p>
        <div style="max-height:350px;overflow-y:auto;">${lista}</div>
      `,
      icon: 'error',
      confirmButtonText: 'Entendido',
    });
  }

  agregar() {
    if (this.loading) return;
    this.submitButton = 'Cargando...';
    this.loading = true;
    this.usuarioForm.markAllAsTouched();

    const etiquetas: Record<string, string> = {
      nombre: 'Nombre',
      apellidoPaterno: 'Apellido Paterno',
      apellidoMaterno: 'Apellido Materno',
      correo: 'Correo',
      telefono: 'Teléfono',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      idRol: 'Rol',
      idGrupo: 'Grupo',
    };

    const faltantes: string[] = [];
    Object.keys(this.usuarioForm.controls).forEach((key) => {
      if (this.usuarioForm.get(key)?.errors?.['required']) {
        faltantes.push(etiquetas[key] || key);
      }
    });
    if (this.usuarioForm.hasError('passwordMismatch')) {
      faltantes.push('Las contraseñas no coinciden');
    }

    if (faltantes.length || this.usuarioForm.invalid) {
      this.submitButton = 'Guardar';
      this.loading = false;
      this.mostrarCamposFaltantes(faltantes.length ? faltantes : ['Revisa el formulario']);
      return;
    }

    this.usuaService.agregarUsuario(this.buildPayloadParaAgregar()).subscribe({
      next: () => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: '¡Operación Exitosa!',
          text: 'Se agregó un nuevo usuario de manera exitosa.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.regresar();
      },
      error: (err) => {
        this.submitButton = 'Guardar';
        this.loading = false;
        Swal.fire({
          color: '#ffffff',
          background: '#141a21',
          title: '¡Ops!',
          text: this.mensajeErrorServicio(err, 'Ocurrió un error al agregar el usuario.'),
          icon: 'error',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      },
    });
  }

  actualizar() {
    if (this.loading || this.idUsuario == null) return;
    this.submitButton = 'Cargando...';
    this.loading = true;
    this.usuarioForm.markAllAsTouched();

    const etiquetas: Record<string, string> = {
      nombre: 'Nombre',
      apellidoPaterno: 'Apellido Paterno',
      apellidoMaterno: 'Apellido Materno',
      telefono: 'Teléfono',
      idRol: 'Rol',
      idGrupo: 'Grupo',
    };
    const required = ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono', 'idRol'];
    if (this.requiereGrupo) required.push('idGrupo');
    const faltantes = required
      .filter((key) => {
        const ctrl = this.usuarioForm.get(key);
        return ctrl?.invalid || ctrl?.value == null || ctrl?.value === '';
      })
      .map((key) => etiquetas[key]);

    if (faltantes.length) {
      this.submitButton = 'Actualizar';
      this.loading = false;
      this.mostrarCamposFaltantes(faltantes);
      return;
    }

    this.usuaService
      .actualizarUsuario(this.idUsuario, this.buildPayloadParaActualizar())
      .subscribe({
        next: () => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            color: '#ffffff',
            background: '#141a21',
            title: '¡Operación Exitosa!',
            text: 'Los datos del usuario se actualizaron correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          this.regresar();
        },
        error: (err) => {
          this.submitButton = 'Actualizar';
          this.loading = false;
          Swal.fire({
            color: '#ffffff',
            background: '#141a21',
            title: '¡Ops!',
            text: this.mensajeErrorServicio(err, 'Ocurrió un error al actualizar el usuario.'),
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        },
      });
  }

  regresar() {
    this.route.navigateByUrl('/usuarios');
  }
}
