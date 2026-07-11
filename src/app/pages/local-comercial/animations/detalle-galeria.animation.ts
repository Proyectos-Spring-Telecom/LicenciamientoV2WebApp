import { animate, style, transition, trigger } from '@angular/animations';

export const galeriaPhotoAnimation = trigger('galeriaPhoto', [
  transition('void => next', [
    style({ opacity: 0, transform: 'translateX(42px) scale(0.96)' }),
    animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    })),
  ]),
  transition('void => prev', [
    style({ opacity: 0, transform: 'translateX(-42px) scale(0.96)' }),
    animate('420ms cubic-bezier(0.22, 1, 0.36, 1)', style({
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    })),
  ]),
  transition('void => init', [
    style({ opacity: 0, transform: 'scale(0.98)' }),
    animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({
      opacity: 1,
      transform: 'scale(1)',
    })),
  ]),
]);

export const galeriaMetaAnimation = trigger('galeriaMeta', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateY(14px)' }),
    animate('320ms cubic-bezier(0.22, 1, 0.36, 1)', style({
      opacity: 1,
      transform: 'translateY(0)',
    })),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateY(-14px)' }),
    animate('320ms cubic-bezier(0.22, 1, 0.36, 1)', style({
      opacity: 1,
      transform: 'translateY(0)',
    })),
  ]),
]);
