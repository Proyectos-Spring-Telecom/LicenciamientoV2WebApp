import { animate, group, query, style, transition, trigger } from '@angular/animations';

const leavePanelStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 2,
  boxSizing: 'border-box',
} as const;

export const localFormTabPanelAnimation = trigger('localFormTabPanel', [
  transition(':increment', [
    query(':leave', [
      style(leavePanelStyle)
    ], { optional: true }),
    group([
      query(':leave', [
        animate(
          '240ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 0, transform: 'translateX(-24px)' })
        )
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'translateX(24px)' }),
        animate(
          '320ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ], { optional: true })
    ])
  ]),
  transition(':decrement', [
    query(':leave', [
      style(leavePanelStyle)
    ], { optional: true }),
    group([
      query(':leave', [
        animate(
          '240ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 0, transform: 'translateX(24px)' })
        )
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'translateX(-24px)' }),
        animate(
          '320ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ], { optional: true })
    ])
  ])
]);

export const proteccionEmpresaFieldsAnimation = trigger('proteccionEmpresaFields', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateX(20px)',
      overflow: 'hidden'
    }),
    animate('350ms cubic-bezier(0.35, 0, 0.25, 1)', style({
      opacity: 1,
      transform: 'translateX(0)'
    }))
  ]),
  transition(':leave', [
    animate('280ms cubic-bezier(0.35, 0, 0.25, 1)', style({
      opacity: 0,
      transform: 'translateX(20px)'
    }))
  ])
]);
