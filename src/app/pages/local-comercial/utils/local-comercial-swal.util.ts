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

/**
 * Extrae el mensaje que regresa el API (texto plano o JSON).
 * Ej: El archivo "Sapac.reciboSapac" tiene una extensión no permitida
 */
export function mensajeErrorServicioLocal(err: unknown, fallback: string): string {
  const body = (err as { error?: unknown; message?: string } | null)?.error;
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    for (const key of ['mensaje', 'message', 'error', 'title', 'detail']) {
      const val = o[key];
      if (typeof val === 'string' && val.trim()) {
        return val.trim();
      }
    }
  }
  const msg = (err as { message?: string } | null)?.message;
  if (typeof msg === 'string' && msg.trim() && !msg.startsWith('Http failure')) {
    return msg.trim();
  }
  return fallback;
}

/** NO BORRAR — Error Sepomex: alerta amigable; el error real va a consola. */
export function mostrarSwalCodigoPostalNoEncontrado(
  error?: unknown,
  cp?: string
): void {
  console.error('[Sepomex] Error al consultar código postal', cp ?? '', error);

  const cpTxt = cp ? ` (${cp})` : '';
  Swal.fire({
    ...SWAL_SISTEMA,
    title: 'Error al consultar el código postal',
    html: `
      <p style="text-align:center;margin:0 0 10px;line-height:1.45;">
        No encontramos datos automáticos para el código postal${cpTxt}.
      </p>
      <p style="text-align:center;margin:0;line-height:1.45;">
        Puedes escribir <strong>Estado</strong>, <strong>Municipio</strong> y
        <strong>Colonia</strong> de forma manual.
      </p>
    `,
    icon: 'info',
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
