import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
  FormBuilder,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { Credentials } from 'src/app/entities/Credentials';
import { User } from 'src/app/entities/User';
import { AuthenticationService } from 'src/app/services/auth.service';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { authViewAnimation } from '../auth-view.animation';
import { AuthTransitionService } from 'src/app/services/auth-transition.service';
import { LoginSuccessSoundService } from 'src/app/services/login-success-sound.service';

const LOGIN_SUCCESS_SOUND_MS = 10_000;

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
  styleUrls: ['./side-login.component.scss'],
  animations: [authViewAnimation],
})
export class AppSideLoginComponent implements OnInit {
  options = this.settings.getOptions();
  public isDisabled = false;

  constructor(
    private router: Router,
    private settings: CoreService,
    private authService: AuthenticationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private authTransition: AuthTransitionService,
    private loginSuccessSound: LoginSuccessSoundService,
  ) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  initForm() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  loginForm!: UntypedFormGroup;
  public credentials!: Credentials;
  hidePass = true;

  public textLogin = 'iniciar sesión';
  public loading = false;

  onSubmit() {
    if (this.isDisabled || this.loginForm.invalid) {
      return;
    }
    this.isDisabled = true;
    this.loading = true;
    this.textLogin = 'cargando...';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.credentials = this.loginForm.value;

    this.authService
      .login({
        username: this.credentials.userName,
        password: this.credentials.password,
      })
      .pipe(
        catchError(() => {
          this.loading = false;
          this.textLogin = 'iniciar sesión';
          this.toastr.error('Usuario y/o contraseña incorrectos', '¡Ops!');
          this.isDisabled = false;
          return throwError(() => '');
        }),
      )
      .subscribe((user) => {
        void this.afterLoginSuccess(user);
      });
  }

  private async afterLoginSuccess(user: User): Promise<void> {
    if (this.authService.needsPasswordChange(user)) {
      await this.promptMandatoryPasswordChange();
    }

    const nombre = String(user.nombre ?? '').trim();
    const apellido = String(user.apellidoPaterno ?? '').trim();
    const saludo =
      nombre || apellido
        ? `Bienvenido, ${[nombre, apellido].filter(Boolean).join(' ')}.`
        : 'Bienvenido al Sistema.';

    this.toastr.success(saludo, '¡Credenciales correctas!');
    const route = this.authService.getPostLoginCommands(user);
    void this.router.navigate(route).then(() => {
      this.authTransition.startAppReveal();
      window.setTimeout(() => {
        this.loginSuccessSound.play(LOGIN_SUCCESS_SOUND_MS);
      }, 580);
    });

    this.loading = false;
    this.textLogin = 'iniciar sesión';
    this.isDisabled = false;
  }

  private async promptMandatoryPasswordChange(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Actualiza tu contraseña',
      html: `
        <input id="swal-old" class="swal2-input" type="password" placeholder="Contraseña actual" />
        <input id="swal-new" class="swal2-input" type="password" placeholder="Nueva contraseña" />
        <input id="swal-confirm" class="swal2-input" type="password" placeholder="Confirmar nueva" />
      `,
      focusConfirm: false,
      showCancelButton: false,
      allowOutsideClick: false,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const password = (document.getElementById('swal-old') as HTMLInputElement)?.value ?? '';
        const newPassword = (document.getElementById('swal-new') as HTMLInputElement)?.value ?? '';
        const confirmPassword =
          (document.getElementById('swal-confirm') as HTMLInputElement)?.value ?? '';
        if (!this.isPasswordPolicyValid(newPassword)) {
          Swal.showValidationMessage(
            'La contraseña debe tener 6–16 caracteres, número, minúscula, mayúscula y un carácter especial.',
          );
          return false;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('La confirmación no coincide.');
          return false;
        }
        return { password, newPassword, confirmPassword };
      },
    });

    if (!formValues) return;

    try {
      await firstValueFrom(this.authService.updatePassword(formValues));
      this.toastr.success('Contraseña actualizada correctamente.', 'Listo');
    } catch {
      this.toastr.error('No se pudo actualizar la contraseña.', 'Error');
    }
  }

  private isPasswordPolicyValid(password: string): boolean {
    if (password.length < 6 || password.length > 16) return false;
    return /[0-9]/.test(password) &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);
  }

  openFacebook() {
    window.open('https://www.facebook.com/profile.php?id=61579119466053', '_blank');
  }

  openInstagram() {
    window.open(
      'https://www.instagram.com/spring_telecom?fbclid=IwY2xjawPgd-ZleHRuA2FlbQIxMABicmlkETFWcXA1TlhHNEkza3VHQW16c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHhKPqP9x7y6kKduncrL3ZWgMV5pl48pdF_VN8yg9so_O9zZdq0q1_G-wMD54_aem_lEOCii1Rjv-RdeLXoTG6rA',
      '_blank',
    );
  }
}
