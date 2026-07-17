import Swal from 'sweetalert2';

/**
 * NO BORRAR — Alertas SweetAlert2 del módulo Local Comercial.
 * Estilos/tema compartido por todas las alertas del módulo.
 */
const SWAL_SISTEMA = {
  background: '#141a21',
  color: '#ffffff',
  customClass: {
    popup: 'swal2-padding swal2-border',
  },
} as const;

/** NO BORRAR — HTML de lista para alerta de campos obligatorios. */
function construirListaCamposObligatorios(campos: string[]): string {
  return campos
    .map(
      (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>`
    )
    .join('');
}

/** NO BORRAR — Alerta: faltan campos obligatorios. */
export function mostrarAlertaCamposObligatorios(campos: string[]): void {
  const lista = construirListaCamposObligatorios(campos);
  Swal.fire({
    ...SWAL_SISTEMA,
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
}

/** NO BORRAR — Alerta de éxito. */
export function mostrarSwalExito(options: {
  title: string;
  text?: string;
  html?: string;
}): void {
  Swal.fire({
    ...SWAL_SISTEMA,
    title: options.title,
    text: options.text,
    html: options.html,
    icon: 'success',
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'Confirmar',
  });
}

/** NO BORRAR — Alerta de error. */
export function mostrarSwalError(options: {
  title: string;
  text?: string;
  html?: string;
}): void {
  Swal.fire({
    ...SWAL_SISTEMA,
    title: options.title,
    text: options.text,
    html: options.html,
    icon: 'error',
    confirmButtonText: 'Confirmar',
  });
}

/** NO BORRAR — Código postal no encontrado (Sepomex 404). */
export function mostrarSwalCodigoPostalNoEncontrado(
  error?: { error?: { message?: string }; message?: string } | null,
  cp?: string
): void {
  const mensajeApi =
    error?.error?.message ||
    error?.message ||
    (cp
      ? `No se encontraron registros para el código postal ${cp}`
      : 'No se encontraron registros para el código postal');

  Swal.fire({
    ...SWAL_SISTEMA,
    title: 'Código postal no encontrado',
    html: `<p style="text-align:center;margin:0;">${mensajeApi}</p>`,
    icon: 'warning',
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'Entendido',
  });
}

/** NO BORRAR — Alerta/cargando (sin fondo azul). */
export function mostrarCargandoLocalComercial(mensaje: string): void {
  Swal.fire({
    ...SWAL_SISTEMA,
    title: 'Cargando...',
    html: mensaje,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    backdrop: 'rgba(0, 0, 0, 0.55)',
    customClass: {
      popup: 'swal2-padding swal2-border swal-local-cargando',
    },
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

/** NO BORRAR — Cierra la alerta de cargando. */
export function ocultarCargandoLocalComercial(callback?: () => void): void {
  setTimeout(() => {
    if (Swal.isVisible()) {
      Swal.close();
    }
    callback?.();
  }, 500);
}
