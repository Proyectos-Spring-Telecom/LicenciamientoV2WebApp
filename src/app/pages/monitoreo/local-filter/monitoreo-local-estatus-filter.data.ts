export type MonitoreoLocalEstatusFilter =
  | 'todo'
  | 'pendiente'
  | 'info-faltante'
  | 'rechazo'
  | 'datos-correctos';

export interface MonitoreoLocalEstatusFilterOption {
  id: MonitoreoLocalEstatusFilter;
  shortLabel: string;
  ariaLabel: string;
}

export const MONITOREO_LOCAL_ESTATUS_FILTER_OPTIONS: MonitoreoLocalEstatusFilterOption[] = [
  { id: 'todo', shortLabel: 'Todos', ariaLabel: 'Todos' },
  { id: 'pendiente', shortLabel: 'Pendiente', ariaLabel: 'Estatus Pendiente' },
  { id: 'info-faltante', shortLabel: 'Info faltante', ariaLabel: 'Información Faltante' },
  { id: 'rechazo', shortLabel: 'Rechazo', ariaLabel: 'Rechazo' },
  { id: 'datos-correctos', shortLabel: 'Datos correctos', ariaLabel: 'Datos Correctos' },
];

export const MONITOREO_LOCAL_ESTATUS_FILTER_DEFAULT: MonitoreoLocalEstatusFilter = 'todo';

export type MonitoreoLocalEstatusFilterCounts = Record<
  Exclude<MonitoreoLocalEstatusFilter, 'todo'>,
  number
>;

export function createEmptyLocalEstatusFilterCounts(): MonitoreoLocalEstatusFilterCounts {
  return {
    pendiente: 0,
    'info-faltante': 0,
    rechazo: 0,
    'datos-correctos': 0,
  };
}

/** Normaliza nombreEstatus del backend al id del chip de filtro. */
export function resolveLocalEstatusFilter(
  nombreEstatus: string | null | undefined,
): Exclude<MonitoreoLocalEstatusFilter, 'todo'> | null {
  const raw = String(nombreEstatus ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!raw) {
    return null;
  }

  if (
    raw.includes('pendiente') ||
    raw === 'revision' ||
    raw.includes('revision')
  ) {
    return 'pendiente';
  }

  if (raw.includes('informacion faltante') || raw === 'informacionfaltante') {
    return 'info-faltante';
  }

  if (raw.includes('rechazo')) {
    return 'rechazo';
  }

  if (raw.includes('datos correctos') || raw === 'correcto') {
    return 'datos-correctos';
  }

  return null;
}

export function localMatchesEstatusFilter(
  nombreEstatus: string | null | undefined,
  filter: MonitoreoLocalEstatusFilter,
): boolean {
  if (filter === 'todo') {
    return true;
  }
  return resolveLocalEstatusFilter(nombreEstatus) === filter;
}
