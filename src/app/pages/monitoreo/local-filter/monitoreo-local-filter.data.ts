export interface MonitoreoLocalOpcion {
  id: number;
  nombre: string;
  iniciales: string;
  accent: string;
  subtitulo: string;
  nombreEstatus: string;
}

export const MONITOREO_LOCAL_ACCENTS = [
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#22d3ee',
];

export function buildLocalIniciales(nombre: string | null | undefined): string {
  const parts = String(nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'LC';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[1][0]).toUpperCase();
}
