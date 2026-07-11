/** Contenedor real del layout (`FullComponent` → `.layout-content-scroll`). */
export function scrollLayoutContentToTop(): void {
  const scrollTargets = [
    document.querySelector<HTMLElement>('.layout-content-scroll'),
    document.querySelector<HTMLElement>('.content.cdk-scrollable'),
    document.querySelector<HTMLElement>('.content'),
    document.querySelector<HTMLElement>('mat-sidenav-content.content-container'),
    document.scrollingElement as HTMLElement | null,
    document.documentElement,
    document.body,
  ].filter((el): el is HTMLElement => !!el);

  const uniqueTargets = Array.from(new Set(scrollTargets));

  uniqueTargets.forEach((el) => {
    el.scrollTop = 0;
    el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });

  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
}
