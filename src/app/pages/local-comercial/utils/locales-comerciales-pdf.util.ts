import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Paleta Spring / Licenciamiento */
const BRAND = {
  ink: '#0f172a',
  primary: '#8b1a3d',
  accent: '#681330',
  soft: '#fce7f3',
  slate: '#64748b',
  muted: '#94a3b8',
  line: '#e2e8f0',
  green: '#16a34a',
  amber: '#d97706',
  blue: '#2563eb',
  red: '#dc2626',
  white: '#ffffff',
} as const;

const LOGO_SPRING = 'assets/images/logos/spring_white.png';
const LOGO_FALLBACK = 'assets/images/logos/light-logo.svg';
const LOGO_MAX_W = 44;
const LOGO_MAX_H = 34;

/**
 * Logo blanco embebido (misma marca que light-logo.svg).
 * Evita que el PDF salga sin imagen si el fetch falla en el sitio publicado
 * (base href / subcarpeta / asset no desplegado).
 */
const LOGO_SVG_EMBEDDED = `<svg width="164" height="24" viewBox="0 0 164 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.000210938 2.84508C0.000210938 5.29849 0.800211 6.49909 4.00021 8.6915C7.55021 11.1449 8.00021 11.9279 8.00021 15.5819C8.00021 20.6975 9.50021 23.7252 12.0502 23.7252C13.8002 23.7252 14.0002 22.9944 14.0002 15.6341L13.9502 7.54309L7.55021 3.62808C-0.149789 -1.06994 0.000210938 -1.06994 0.000210938 2.84508Z" fill="white"/><path d="M22.2502 3.68028L16.0502 7.5431L16.0002 15.6341C16.0002 22.9944 16.2002 23.7252 17.9502 23.7252C20.5002 23.7252 22.0002 20.6975 22.0002 15.5819C22.0002 11.9279 22.4502 11.1449 26.0002 8.6915C29.2002 6.49909 30.0002 5.29849 30.0002 2.84508C30.0002 -1.06994 29.8502 -1.01774 22.2502 3.68028Z" fill="white"/><path d="M44.3469 5.0042H46.5793L49.8664 14.3997L53.1535 5.0042H55.386L50.7629 17.8011H48.9699L44.3469 5.0042ZM43.1428 5.0042H45.3664L45.7707 14.1624V17.8011H43.1428V5.0042ZM54.3664 5.0042H56.5988V17.8011H53.9621V14.1624L54.3664 5.0042ZM64.2717 7.19267L60.7912 17.8011H57.9875L62.7424 5.0042H64.5266L64.2717 7.19267ZM67.1633 17.8011L63.674 7.19267L63.3928 5.0042H65.1945L69.9758 17.8011H67.1633ZM67.0051 13.0374V15.1028H60.2463V13.0374H67.0051ZM75.7942 5.0042V17.8011H73.1662V5.0042H75.7942ZM79.7317 5.0042V7.06963H69.2903V5.0042H79.7317ZM89.8215 15.7444V17.8011H83.01V15.7444H89.8215ZM83.8713 5.0042V17.8011H81.2346V5.0042H83.8713ZM88.9338 10.2161V12.22H83.01V10.2161H88.9338ZM89.8127 5.0042V7.06963H83.01V5.0042H89.8127ZM91.3596 5.0042H96.132C97.1106 5.0042 97.9514 5.15068 98.6545 5.44365C99.3635 5.73662 99.9084 6.17021 100.289 6.74443C100.67 7.31865 100.861 8.0247 100.861 8.86259C100.861 9.54814 100.743 10.137 100.509 10.6292C100.28 11.1155 99.9553 11.5228 99.5334 11.8509C99.1174 12.1731 98.6281 12.431 98.0656 12.6243L97.2307 13.0638H93.0822L93.0647 11.0071H96.1496C96.6125 11.0071 96.9963 10.9251 97.301 10.761C97.6057 10.597 97.8342 10.3685 97.9865 10.0755C98.1447 9.78252 98.2238 9.44267 98.2238 9.05595C98.2238 8.6458 98.1477 8.29131 97.9953 7.99248C97.843 7.69365 97.6115 7.46513 97.301 7.30693C96.9904 7.14873 96.6008 7.06963 96.132 7.06963H93.9963V17.8011H91.3596V5.0042ZM98.5139 17.8011L95.5959 12.097L98.382 12.0794L101.335 17.678V17.8011H98.5139ZM105.695 5.0042V17.8011H103.067V5.0042H105.695ZM113.526 7.19267L110.045 17.8011H107.241L111.996 5.0042H113.78L113.526 7.19267ZM116.417 17.8011L112.928 7.19267L112.647 5.0042H114.448L119.23 17.8011H116.417ZM116.259 13.0374V15.1028H109.5V13.0374H116.259ZM128.643 15.7444V17.8011H122.2V15.7444H128.643ZM123.053 5.0042V17.8011H120.416V5.0042H123.053ZM134.988 12.5892H131.341V11.6663H134.988C135.75 11.6663 136.368 11.5433 136.843 11.2972C137.323 11.0452 137.672 10.7054 137.889 10.2776C138.112 9.8499 138.223 9.36943 138.223 8.83623C138.223 8.31474 138.112 7.83427 137.889 7.39482C137.672 6.95537 137.323 6.60381 136.843 6.34013C136.368 6.0706 135.75 5.93584 134.988 5.93584H131.719V17.8011H130.638V5.0042H134.988C135.926 5.0042 136.714 5.16533 137.353 5.48759C137.997 5.80986 138.484 6.2581 138.812 6.83232C139.14 7.40654 139.304 8.06865 139.304 8.81865C139.304 9.60381 139.14 10.2806 138.812 10.8489C138.484 11.4114 138 11.8421 137.362 12.1409C136.723 12.4397 135.932 12.5892 134.988 12.5892ZM141.703 5.0042H145.861C146.745 5.0042 147.513 5.14775 148.163 5.43486C148.814 5.72197 149.315 6.14677 149.666 6.70927C150.024 7.26591 150.202 7.95146 150.202 8.76591C150.202 9.36943 150.073 9.91728 149.816 10.4095C149.564 10.9017 149.215 11.3147 148.77 11.6487C148.324 11.9769 147.809 12.2024 147.223 12.3255L146.845 12.4661H142.406L142.389 11.5433H146.107C146.775 11.5433 147.331 11.4144 147.777 11.1565C148.222 10.8987 148.556 10.5589 148.779 10.137C149.007 9.70927 149.121 9.25224 149.121 8.76591C149.121 8.18584 148.995 7.68486 148.743 7.26299C148.497 6.83525 148.131 6.50713 147.645 6.27861C147.158 6.05009 146.564 5.93584 145.861 5.93584H142.784V17.8011H141.703V5.0042ZM149.605 17.8011L146.291 12.0794L147.451 12.0706L150.756 17.6868V17.8011H149.605ZM162.621 10.7171V12.0882C162.621 12.9847 162.504 13.7962 162.27 14.5228C162.041 15.2435 161.707 15.8616 161.268 16.3772C160.834 16.8929 160.313 17.2884 159.703 17.5638C159.094 17.8392 158.408 17.9769 157.647 17.9769C156.903 17.9769 156.223 17.8392 155.608 17.5638C154.998 17.2884 154.474 16.8929 154.034 16.3772C153.595 15.8616 153.255 15.2435 153.015 14.5228C152.775 13.7962 152.655 12.9847 152.655 12.0882V10.7171C152.655 9.8206 152.772 9.01201 153.006 8.29131C153.246 7.56474 153.586 6.94365 154.026 6.42802C154.465 5.9124 154.989 5.51689 155.599 5.2415C156.208 4.96611 156.885 4.82841 157.629 4.82841C158.391 4.82841 159.076 4.96611 159.686 5.2415C160.295 5.51689 160.82 5.9124 161.259 6.42802C161.698 6.94365 162.035 7.56474 162.27 8.29131C162.504 9.01201 162.621 9.8206 162.621 10.7171ZM161.549 12.0882V10.6995C161.549 9.94365 161.461 9.26396 161.285 8.66045C161.115 8.05693 160.861 7.54131 160.521 7.11357C160.187 6.68584 159.777 6.35771 159.29 6.1292C158.804 5.90068 158.25 5.78642 157.629 5.78642C157.026 5.78642 156.484 5.90068 156.003 6.1292C155.523 6.35771 155.113 6.68584 154.773 7.11357C154.439 7.54131 154.181 8.05693 153.999 8.66045C153.823 9.26396 153.736 9.94365 153.736 10.6995V12.0882C153.736 12.8499 153.823 13.5354 153.999 14.1448C154.181 14.7483 154.442 15.2669 154.781 15.7005C155.121 16.1282 155.531 16.4563 156.012 16.6849C156.498 16.9134 157.043 17.0276 157.647 17.0276C158.274 17.0276 158.827 16.9134 159.308 16.6849C159.788 16.4563 160.196 16.1282 160.53 15.7005C160.863 15.2669 161.115 14.7483 161.285 14.1448C161.461 13.5354 161.549 12.8499 161.549 12.0882Z" fill="white"/></svg>`;

type LogoImage = { dataUrl: string; widthMm: number; heightMm: number };

const ESTATUS_COLOR: Record<string, string> = {
  'Datos Correctos': '#16a34a',
  Revisión: '#2563eb',
  'Información Faltante': '#d97706',
  'Rechazo o Sin respuesta': '#dc2626',
  Baja: '#dc2626',
};

export interface LocalComercialPdfRow {
  id?: number;
  nombreEstatus?: string;
  rfc?: string;
  nombreComercial?: string;
  tipoRegistroLabel?: string;
  predioObraLabel?: string;
  giro?: string;
  nombreCapturista?: string;
  grupo?: string;
  fechaCreacion?: Date | string | null;
  lat?: number;
  lng?: number;
}

export interface LocalComercialPdfPayload {
  fechaInicial: string | Date;
  fechaFinal: string | Date;
  locales: LocalComercialPdfRow[];
  capturistaFiltro?: string;
  grupoFiltro?: string;
  estatusFiltro?: string;
}

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Display: DD/MM/YYYY hh:mm AM/PM */
export function formatFechaDisplay(value: string | Date | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) {
    h = 12;
  }
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(h)}:${m} ${ampm}`;
}

function texto(v: unknown, fallback = '—'): string {
  if (v == null || String(v).trim() === '' || String(v).toLowerCase() === 'null') {
    return fallback;
  }
  return String(v).trim();
}

function contarPorEstatus(locales: LocalComercialPdfRow[]): Array<{ nombre: string; n: number }> {
  const map: Record<string, number> = {};
  for (const row of locales) {
    const key = texto(row.nombreEstatus, 'Sin estatus');
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([nombre, n]) => ({ nombre, n }))
    .sort((a, b) => b.n - a.n);
}

function colorEstatus(nombre: string): string {
  return ESTATUS_COLOR[nombre] ?? BRAND.primary;
}

/** Resuelve assets respetando `<base href>` / subcarpeta del publicado. */
function absoluteAssetUrl(relativePath: string): string {
  const path = relativePath.replace(/^\//, '');
  if (typeof document !== 'undefined' && document.baseURI) {
    return new URL(path, document.baseURI).href;
  }
  if (typeof window !== 'undefined' && window.location?.href) {
    return new URL(path, window.location.href).href;
  }
  return path;
}

function fitLogoMm(natW: number, natH: number): { widthMm: number; heightMm: number } {
  const w = Math.max(1, natW);
  const h = Math.max(1, natH);
  const scale = Math.min(LOGO_MAX_W / w, LOGO_MAX_H / h);
  return { widthMm: w * scale, heightMm: h * scale };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el logo'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

async function svgToPngDataUrl(svgText: string): Promise<{ dataUrl: string; natW: number; natH: number }> {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(objectUrl);
    const natW = img.naturalWidth || 164;
    const natH = img.naturalHeight || 24;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(natW));
    canvas.height = Math.max(1, Math.round(natH));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas no disponible');
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/png'), natW, natH };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function tryLoadPngLogo(url: string): Promise<LogoImage | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) {
      return null;
    }
    const blob = await res.blob();
    if (!blob.type.includes('png') && !blob.type.includes('jpeg') && !blob.type.includes('jpg')) {
      // Algunos servers no envían mime; igual intentamos si hay bytes
      if (blob.size < 32) {
        return null;
      }
    }
    const dataUrl = await blobToDataUrl(blob);
    const img = await loadImageElement(dataUrl);
    const { widthMm, heightMm } = fitLogoMm(img.naturalWidth || 180, img.naturalHeight || 48);
    return { dataUrl, widthMm, heightMm };
  } catch {
    return null;
  }
}

async function tryLoadSvgLogo(url: string): Promise<LogoImage | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) {
      return null;
    }
    const svgText = await res.text();
    if (!svgText.includes('<svg')) {
      return null;
    }
    const { dataUrl, natW, natH } = await svgToPngDataUrl(svgText);
    const { widthMm, heightMm } = fitLogoMm(natW, natH);
    return { dataUrl, widthMm, heightMm };
  } catch {
    return null;
  }
}

async function logoFromSvgText(svgText: string): Promise<LogoImage | null> {
  try {
    const { dataUrl, natW, natH } = await svgToPngDataUrl(svgText);
    const { widthMm, heightMm } = fitLogoMm(natW, natH);
    return { dataUrl, widthMm, heightMm };
  } catch {
    return null;
  }
}

/** Intenta PNG/SVG por URL; si falla (típico en publicado), usa SVG embebido. */
async function loadSpringLogoForPdf(): Promise<LogoImage | null> {
  const primary = absoluteAssetUrl(LOGO_SPRING);
  const fallback = absoluteAssetUrl(LOGO_FALLBACK);
  return (
    (await tryLoadPngLogo(primary)) ??
    (await tryLoadSvgLogo(fallback)) ??
    (await logoFromSvgText(LOGO_SVG_EMBEDDED))
  );
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(BRAND.ink));
  doc.text(title.toUpperCase(), x, y);

  doc.setDrawColor(...hexToRgb(BRAND.primary));
  doc.setLineWidth(0.7);
  const tw = doc.getTextWidth(title.toUpperCase());
  doc.line(x, y + 1.8, x + Math.min(tw, 42), y + 1.8);

  return y + 8;
}

/**
 * PDF de reporte de Locales Comerciales.
 * Header Spring intacto; cuerpo editorial limpio.
 */
export async function exportarLocalesComercialesPdf(
  payload: LocalComercialPdfPayload,
): Promise<void> {
  const locales = Array.isArray(payload.locales) ? payload.locales : [];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPdfWithAutoTable;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const headerH = 40;
  const footerReserve = 22;

  const fechaIniTxt = formatFechaDisplay(payload.fechaInicial);
  const fechaFinTxt = formatFechaDisplay(payload.fechaFinal);
  const total = locales.length;
  const porEstatus = contarPorEstatus(locales);
  const enObra = locales.filter((l) =>
    String(l.predioObraLabel || '').toLowerCase().includes('en obra'),
  ).length;
  const sinObra = Math.max(0, total - enObra);
  const cancelados = locales.filter((l) => {
    const e = String(l.nombreEstatus || '').toLowerCase();
    return e.includes('baja') || e.includes('cancel');
  }).length;

  // ─── HEADER full-bleed 40 mm + logo imagen (derecha) ───
  doc.setFillColor(...hexToRgb(BRAND.ink));
  doc.rect(0, 0, pageW, headerH, 'F');
  doc.setFillColor(...hexToRgb(BRAND.primary));
  doc.rect(0, 37.5, pageW, 2.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...hexToRgb(BRAND.white));
  doc.text('Locales Comerciales', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...hexToRgb(BRAND.soft));
  doc.text(`Inicio: ${fechaIniTxt}  ·  Fin: ${fechaFinTxt}`, margin, 21);

  doc.setFontSize(8.5);
  doc.text(`${total} registro${total === 1 ? '' : 's'} en el período`, margin, 27);

  const logo = await loadSpringLogoForPdf();
  if (logo) {
    const logoX = pageW - margin - logo.widthMm;
    const logoY = (headerH - logo.heightMm) / 2;
    doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, logo.widthMm, logo.heightMm);
  }

  let y = headerH + 8;

  // ─── META LÍNEA (solo generado) ───
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...hexToRgb(BRAND.slate));
  doc.text(`Generado: ${formatFechaDisplay(new Date())}`, margin, y);
  y += 4;
  doc.setDrawColor(...hexToRgb(BRAND.line));
  doc.setLineWidth(0.25);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ─── KPIs — 4 columnas tipográficas (sin cajas pesadas) ───
  y = sectionTitle(doc, 'Indicadores', margin, y);

  const kpis = [
    { label: 'Registros', value: String(total) },
    { label: 'En obra', value: String(enObra) },
    { label: 'Sin obra', value: String(sinObra) },
    { label: 'Baja / Cancelados', value: String(cancelados) },
  ];
  const kpiW = contentW / 4;
  kpis.forEach((kpi, i) => {
    const x = margin + i * kpiW;
    if (i > 0) {
      doc.setDrawColor(...hexToRgb(BRAND.line));
      doc.setLineWidth(0.2);
      doc.line(x, y - 1, x, y + 14);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(BRAND.slate));
    doc.text(kpi.label.toUpperCase(), x + 4, y + 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...hexToRgb(i === 0 ? BRAND.primary : BRAND.ink));
    doc.text(kpi.value, x + 4, y + 11);
  });
  y += 20;

  // ─── DISTRIBUCIÓN POR ESTATUS — barras proporcionales ───
  y = sectionTitle(doc, 'Distribución por estatus', margin, y);

  if (!porEstatus.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(BRAND.slate));
    doc.text('Sin registros para graficar en este período.', margin, y + 4);
    y += 14;
  } else {
    const labelW = 52;
    const valueW = 22;
    const gap = 3;
    const barX = margin + labelW;
    const barMaxW = contentW - labelW - valueW - gap;
    const rowH = 10;
    porEstatus.forEach((item, idx) => {
      const yy = y + idx * rowH;
      const pct = total > 0 ? item.n / total : 0;
      const barW = Math.max(2, Math.min(barMaxW, barMaxW * pct));
      const color = colorEstatus(item.nombre);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...hexToRgb(BRAND.ink));
      const label = doc.splitTextToSize(item.nombre, labelW - 2);
      doc.text(label[0], margin, yy + 4);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, yy + 0.6, barMaxW, 4.2, 1.2, 1.2, 'F');
      doc.setFillColor(...hexToRgb(color));
      doc.roundedRect(barX, yy + 0.6, barW, 4.2, 1.2, 1.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(BRAND.ink));
      doc.text(`${item.n} (${Math.round(pct * 100)}%)`, barX + barMaxW + gap, yy + 4);
    });
    y += porEstatus.length * rowH + 6;
  }

  // ─── TABLA DETALLE ───
  if (y > pageH - footerReserve - 40) {
    doc.addPage();
    y = margin + 4;
  }

  y = sectionTitle(doc, 'Listado de locales', margin, y);

  // Mismo orden que el grid (sin Acciones): Estatus, Nombre Comercial, Tipo de registro, RFC, …
  const body = locales.map((row, idx) => {
    const esBaja =
      String(row.nombreEstatus || '')
        .toLowerCase()
        .includes('baja') ||
      String(row.nombreEstatus || '')
        .toLowerCase()
        .includes('cancel');
    return [
      String(idx + 1),
      texto(row.nombreEstatus),
      texto(row.nombreComercial, 'Sin Información'),
      texto(row.tipoRegistroLabel, 'Local Comercial'),
      texto(row.rfc, 'Sin Información'),
      texto(row.predioObraLabel),
      texto(row.giro, 'Sin Información'),
      texto(row.nombreCapturista, 'Sin Información'),
      texto(row.grupo, 'Sin Información'),
      formatFechaDisplay(row.fechaCreacion),
      esBaja ? '1' : '0', // flag interno; no se muestra (columna extra filtrada abajo)
    ];
  });

  // Quitar flag interno del body visible
  const bodyVisible = body.map((r) => r.slice(0, 10));
  const bajaFlags = body.map((r) => r[10] === '1');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: footerReserve },
    head: [[
      '#',
      'Estatus',
      'Nombre Comercial',
      'Tipo de registro',
      'RFC',
      'Predio en obra',
      'Giro',
      'Capturista',
      'Grupo',
      'Fecha Expedición',
    ]],
    body: bodyVisible.length
      ? bodyVisible
      : [['', 'Sin registros en el período seleccionado', '', '', '', '', '', '', '', '']],
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: 1.6,
      lineColor: hexToRgb(BRAND.line),
      lineWidth: 0.1,
      textColor: hexToRgb(BRAND.ink),
      overflow: 'linebreak',
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: hexToRgb(BRAND.accent),
      textColor: hexToRgb(BRAND.white),
      fontStyle: 'bold',
      fontSize: 6.2,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 26, fontStyle: 'bold', halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 10, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') {
        return;
      }
      const rowIndex = data.row.index;
      const esBaja = !!bajaFlags[rowIndex];

      if (esBaja) {
        data.cell.styles.fillColor = [252, 231, 243];
      }

      if (!data.cell.raw) {
        return;
      }
      const raw = String(data.cell.raw);
      const t = raw.toLowerCase();

      // Estatus
      if (data.column.index === 1) {
        if (ESTATUS_COLOR[raw]) {
          data.cell.styles.textColor = hexToRgb(ESTATUS_COLOR[raw]);
          data.cell.styles.fontStyle = 'bold';
        }
        if (esBaja) {
          data.cell.styles.textColor = hexToRgb('#dc2626');
          data.cell.styles.fontStyle = 'bold';
        }
      }

      // Tipo de registro
      if (data.column.index === 3) {
        if (t.includes('vivienda')) {
          data.cell.styles.textColor = hexToRgb('#7c3aed');
          data.cell.styles.fontStyle = 'bold';
        } else if (t.includes('comercial')) {
          data.cell.styles.textColor = hexToRgb('#059669');
          data.cell.styles.fontStyle = 'bold';
        }
      }

      // Predio en obra
      if (data.column.index === 5) {
        if (t.includes('en obra')) {
          data.cell.styles.textColor = hexToRgb('#ea580c');
          data.cell.styles.fontStyle = 'bold';
        } else if (t.includes('sin obra')) {
          data.cell.styles.textColor = hexToRgb('#0d9488');
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // ─── FOOTER ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...hexToRgb(BRAND.line));
    doc.setLineWidth(0.25);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(BRAND.primary));
    doc.text('SPRING Telecom', margin, pageH - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(BRAND.muted));
    doc.text('Módulo Locales Comerciales', pageW / 2, pageH - 8, { align: 'center' });
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  doc.save('Locales Comerciales.pdf');
}

/** Payload mock cuando no hay datos en el filtro. */
export function mockLocalComercialPdfPayload(): LocalComercialPdfPayload {
  return {
    fechaInicial: '2026-07-20T08:00:00',
    fechaFinal: '2026-07-20T18:00:00',
    estatusFiltro: 'Todos',
    locales: [
      {
        id: 1,
        nombreEstatus: 'Datos Correctos',
        rfc: 'XAXX010101000',
        nombreComercial: 'Abarrotes El Sol',
        tipoRegistroLabel: 'Local Comercial',
        predioObraLabel: 'Sin obra',
        giro: 'Abarrotes',
        nombreCapturista: 'Ana López',
        grupo: 'A',
        fechaCreacion: '2026-07-20T09:15:00',
        lat: 18.9242,
        lng: -99.2216,
      },
      {
        id: 2,
        nombreEstatus: 'Revisión',
        rfc: 'ABC010203XYZ',
        nombreComercial: 'Farmacia Central',
        tipoRegistroLabel: 'Local Comercial',
        predioObraLabel: 'En obra',
        giro: 'Farmacia',
        nombreCapturista: 'Carlos Ruiz',
        grupo: 'B',
        fechaCreacion: '2026-07-20T12:40:00',
        lat: 18.926,
        lng: -99.218,
      },
      {
        id: 3,
        nombreEstatus: 'Información Faltante',
        rfc: 'DEF040506GHI',
        nombreComercial: 'Café Plaza',
        tipoRegistroLabel: 'Local Comercial',
        predioObraLabel: 'Sin obra',
        giro: 'Alimentos',
        nombreCapturista: 'Ana López',
        grupo: 'A',
        fechaCreacion: '2026-07-20T16:05:00',
        lat: 18.921,
        lng: -99.225,
      },
      {
        id: 4,
        nombreEstatus: 'Datos Correctos',
        rfc: 'GHI070809JKL',
        nombreComercial: 'Boutique Luna',
        tipoRegistroLabel: 'Vivienda',
        predioObraLabel: 'Sin obra',
        giro: 'Comercio',
        nombreCapturista: 'María Pérez',
        grupo: 'C',
        fechaCreacion: '2026-07-20T17:20:00',
      },
      {
        id: 5,
        nombreEstatus: 'Baja',
        rfc: 'BAJA010203XYZ',
        nombreComercial: 'Local Cancelado Demo',
        tipoRegistroLabel: 'Local Comercial',
        predioObraLabel: 'Sin obra',
        giro: 'Servicios',
        nombreCapturista: 'Carlos Ruiz',
        grupo: 'B',
        fechaCreacion: '2026-07-19T10:00:00',
      },
    ],
  };
}
