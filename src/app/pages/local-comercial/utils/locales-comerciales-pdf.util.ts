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

type LogoImage = { dataUrl: string; widthMm: number; heightMm: number };

const ESTATUS_COLOR: Record<string, string> = {
  'Datos Correctos': '#16a34a',
  Revisión: '#2563eb',
  'Información Faltante': '#d97706',
  'Rechazo o Sin respuesta': '#dc2626',
  Baja: '#9333ea',
};

export interface LocalComercialPdfRow {
  id?: number;
  nombreEstatus?: string;
  rfc?: string;
  nombreComercial?: string;
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

function absoluteAssetUrl(relativePath: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = relativePath.replace(/^\//, '');
  return `${origin}/${path}`;
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

/** Intenta spring_white.png; si falla, light-logo.svg convertido a PNG. */
async function loadSpringLogoForPdf(): Promise<LogoImage | null> {
  const primary = absoluteAssetUrl(LOGO_SPRING);
  const fallback = absoluteAssetUrl(LOGO_FALLBACK);
  return (await tryLoadPngLogo(primary)) ?? (await tryLoadSvgLogo(fallback));
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
      texto(row.nombreComercial, 'Sin Información'),
      texto(row.rfc, 'Sin Información'),
      texto(row.nombreEstatus),
      texto(row.predioObraLabel),
      texto(row.giro, 'Sin Información'),
      texto(row.nombreCapturista, 'Sin Información'),
      texto(row.grupo, 'Sin Información'),
      formatFechaDisplay(row.fechaCreacion),
      esBaja ? '1' : '0', // flag interno; no se muestra (columna extra filtrada abajo)
    ];
  });

  // Quitar flag interno del body visible
  const bodyVisible = body.map((r) => r.slice(0, 9));
  const bajaFlags = body.map((r) => r[9] === '1');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: footerReserve },
    head: [['#', 'Nombre comercial', 'RFC', 'Estatus', 'Predio', 'Giro', 'Capturista', 'Gpo', 'Fecha']],
    body: bodyVisible.length
      ? bodyVisible
      : [['', 'Sin registros en el período seleccionado', '', '', '', '', '', '', '']],
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
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
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
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

      if (data.column.index === 3) {
        if (ESTATUS_COLOR[raw]) {
          data.cell.styles.textColor = hexToRgb(ESTATUS_COLOR[raw]);
          data.cell.styles.fontStyle = 'bold';
        }
        if (esBaja) {
          data.cell.styles.textColor = hexToRgb('#9333ea');
          data.cell.styles.fontStyle = 'bold';
        }
      }

      if (data.column.index === 4) {
        const t = raw.toLowerCase();
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
        predioObraLabel: 'Sin obra',
        giro: 'Servicios',
        nombreCapturista: 'Carlos Ruiz',
        grupo: 'B',
        fechaCreacion: '2026-07-19T10:00:00',
      },
    ],
  };
}
