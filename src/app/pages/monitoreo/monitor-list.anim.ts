import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

/** Lista: se mantiene en su columna; solo se desliza (sin scale que deforme el layout). */
export const monitorLocalesListAnim = trigger('monitorLocalesListAnim', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateX(-100%)',
    }),
    animate(
      '260ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateX(0)' }),
    ),
  ]),
  transition(':leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: 'var(--monitor-left-width)',
      maxWidth: 'var(--monitor-left-width)',
      zIndex: 3,
    }),
    animate(
      '240ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({
        opacity: 0,
        transform: 'translateX(-100%)',
      }),
    ),
  ]),
]);

/** Cards de la lista: entrada en cascada. */
export const monitorLocalesCardsAnim = trigger('monitorLocalesCardsAnim', [
  transition(':enter', [
    query(
      '.monitor-local-card',
      [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        stagger(32, [
          animate(
            '200ms cubic-bezier(0.22, 1, 0.36, 1)',
            style({ opacity: 1, transform: 'translateY(0)' }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);
