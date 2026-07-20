/** Colores de pin alineados a estatus del filtro de monitoreo. */
const ESTATUS_MARKER_COLOR: Record<string, string> = {
  'Datos Correctos': '#52bb56',
  Correcto: '#52bb56',
  Revisión: '#438ae3',
  Revision: '#438ae3',
  'Información Faltante': '#f9c300',
  InformacionFaltante: '#f9c300',
  Rechazo: '#eb1919',
  'Rechazo o Sin respuesta': '#eb1919',
  Baja: '#c84ec8',
};

const COLOR_DEFAULT = '#681330';
const COLOR_OBRA = '#e8a317';

export function colorMarkerPorEstatus(nombreEstatus: string | null | undefined): string {
  const key = String(nombreEstatus ?? '').trim();
  return ESTATUS_MARKER_COLOR[key] || COLOR_DEFAULT;
}

/**
 * Pin SVG para predio en obra: color de estatus + aro/acento ámbar
 * e icono de casco/construcción integrado (sin badges flotantes).
 */
export function buildMarkerObraSvgDataUrl(nombreEstatus: string | null | undefined): string {
  const fill = colorMarkerPorEstatus(nombreEstatus);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="72" viewBox="0 0 56 72" fill="none">
  <defs>
    <linearGradient id="pinBody" x1="28" y1="4" x2="28" y2="52" gradientUnits="userSpaceOnUse">
      <stop stop-color="${fill}"/>
      <stop offset="1" stop-color="${fill}" stop-opacity="0.88"/>
    </linearGradient>
    <linearGradient id="obraRing" x1="14" y1="8" x2="42" y2="36" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffd76a"/>
      <stop offset="1" stop-color="${COLOR_OBRA}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Sombra / cuerpo del pin -->
  <path filter="url(#shadow)" fill="url(#pinBody)"
    d="M28 68c0 0-20-21.2-20-36.5C8 17.6 16.9 8 28 8s20 9.6 20 23.5C48 46.8 28 68 28 68z"/>

  <!-- Aro ámbar de obra -->
  <circle cx="28" cy="29" r="15.5" fill="none" stroke="url(#obraRing)" stroke-width="3.2"/>
  <circle cx="28" cy="29" r="13.2" fill="#fff"/>

  <!-- Icono construcción (casco) -->
  <g transform="translate(28 29)">
    <path d="M-8 2.5c0-5.2 3.4-9.2 8-9.2s8 4 8 9.2" fill="${COLOR_OBRA}"/>
    <path d="M-9.5 2.2h19" stroke="#1a1200" stroke-width="1.6" stroke-linecap="round" opacity="0.35"/>
    <rect x="-9.2" y="1.6" width="18.4" height="4.2" rx="1.6" fill="${COLOR_OBRA}"/>
    <path d="M-3.2-4.2h6.4v-2.1c0-.9-.8-1.6-1.7-1.6h-3c-.9 0-1.7.7-1.7 1.6v2.1z" fill="#fff" opacity="0.92"/>
  </g>

  <!-- Punta inferior -->
  <circle cx="28" cy="66.5" r="2.2" fill="${fill}" opacity="0.55"/>
</svg>`.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
