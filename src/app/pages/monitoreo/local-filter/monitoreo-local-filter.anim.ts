import {
  animate,
  group,
  keyframes,
  query,
  stagger,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const monLocFilterClearAnim = trigger('monLocFilterClearAnim', [
  transition(':enter', [
    animate(
      '200ms cubic-bezier(0.22, 1, 0.36, 1)',
      keyframes([
        style({ opacity: 0, transform: 'scale(0.72)', offset: 0 }),
        style({ opacity: 1, transform: 'scale(1.06)', offset: 0.7 }),
        style({ opacity: 1, transform: 'scale(1)', offset: 1 }),
      ]),
    ),
  ]),
  transition(':leave', [
    animate(
      '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 0, transform: 'scale(0.8)' }),
    ),
  ]),
]);

export const monLocFilterReopenAnim = trigger('monLocFilterReopenAnim', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-22px) scale(0.92)' }),
    animate(
      '260ms cubic-bezier(0.22, 1, 0.36, 1)',
      keyframes([
        style({ opacity: 1, transform: 'translateX(3px) scale(1.03)', offset: 0.72 }),
        style({ opacity: 1, transform: 'translateX(0) scale(1)', offset: 1 }),
      ]),
    ),
  ]),
  transition(':leave', [
    animate(
      '160ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 0, transform: 'translateX(-18px) scale(0.94)' }),
    ),
  ]),
]);

/** Card de estatus (colores): entrada con pop y chips en cascada. */
export const monLocFilterShellAnim = trigger('monLocFilterShellAnim', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(-14px) scale(0.92)',
      transformOrigin: 'top left',
    }),
    // Ocultar chips antes del pop del shell para evitar el flash (todos → ocultos → stagger).
    query(
      '.mon-loc-filter__estatus-chip, .mon-loc-filter__predio-chip',
      style({ opacity: 0, transform: 'translateY(10px) scale(0.88)' }),
      { optional: true },
    ),
    group([
      animate(
        '280ms cubic-bezier(0.22, 1, 0.36, 1)',
        keyframes([
          style({
            opacity: 1,
            transform: 'translateY(2px) scale(1.03)',
            offset: 0.65,
          }),
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            offset: 1,
          }),
        ]),
      ),
      query(
        '.mon-loc-filter__estatus-chip, .mon-loc-filter__predio-chip',
        [
          stagger(40, [
            animate(
              '200ms 80ms cubic-bezier(0.22, 1, 0.36, 1)',
              style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
            ),
          ]),
        ],
        { optional: true },
      ),
    ]),
  ]),
  transition(':leave', [
    animate(
      '180ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.94)',
        transformOrigin: 'top left',
      }),
    ),
  ]),
]);

export const monLocFilterPanelAnim = trigger('monLocFilterPanelAnim', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(-10px) scale(0.97)',
      transformOrigin: 'top center',
    }),
    animate(
      '240ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
    ),
  ]),
  transition(':leave', [
    animate(
      '160ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({
        opacity: 0,
        transform: 'translateY(-8px) scale(0.98)',
        transformOrigin: 'top center',
      }),
    ),
  ]),
]);
