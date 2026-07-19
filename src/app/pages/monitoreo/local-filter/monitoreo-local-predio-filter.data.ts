export type MonitoreoLocalPredioFilter = 'todo' | 'en-obra' | 'sin-obra';

export interface MonitoreoLocalPredioFilterOption {
  id: MonitoreoLocalPredioFilter;
  shortLabel: string;
  ariaLabel: string;
}

export const MONITOREO_LOCAL_PREDIO_FILTER_OPTIONS: MonitoreoLocalPredioFilterOption[] = [
  { id: 'todo', shortLabel: 'Todos', ariaLabel: 'Todos los predios' },
  { id: 'en-obra', shortLabel: 'En obra', ariaLabel: 'Predio en obra' },
  { id: 'sin-obra', shortLabel: 'Sin obra', ariaLabel: 'Predio sin obra' },
];

export const MONITOREO_LOCAL_PREDIO_FILTER_DEFAULT: MonitoreoLocalPredioFilter = 'todo';

export type MonitoreoLocalPredioFilterCounts = Record<
  Exclude<MonitoreoLocalPredioFilter, 'todo'>,
  number
>;

export function createEmptyLocalPredioFilterCounts(): MonitoreoLocalPredioFilterCounts {
  return {
    'en-obra': 0,
    'sin-obra': 0,
  };
}

export function esPredioEnObra(predioObra: unknown): boolean {
  return Number(predioObra) === 1;
}

export function localMatchesPredioFilter(
  predioObra: unknown,
  filter: MonitoreoLocalPredioFilter,
): boolean {
  if (filter === 'todo') {
    return true;
  }
  const enObra = esPredioEnObra(predioObra);
  if (filter === 'en-obra') {
    return enObra;
  }
  return !enObra;
}
