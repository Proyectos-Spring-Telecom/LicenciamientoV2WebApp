import { Injectable } from '@angular/core';

/**
 * Referencia al contenedor `.layout-content-scroll` del shell principal.
 * Lo registra `FullComponent` al iniciar.
 */
@Injectable({
  providedIn: 'root',
})
export class LayoutScrollService {
  private host: HTMLElement | null = null;

  register(host: HTMLElement): void {
    this.host = host;
  }

  private resolveHost(): HTMLElement | null {
    return (
      this.host ??
      (document.querySelector('.layout-content-scroll') as HTMLElement | null)
    );
  }

  scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    const reset = (node: HTMLElement | null | undefined) => {
      if (!node) return;
      node.scrollTop = 0;
      try {
        node.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        node.scrollTop = 0;
      }
    };

    const host = this.resolveHost();
    reset(host);

    let node: HTMLElement | null = host;
    while (node) {
      const style = window.getComputedStyle(node);
      const canScroll =
        /(auto|scroll|overlay)/.test(style.overflowY) ||
        /(auto|scroll|overlay)/.test(style.overflow) ||
        node.scrollTop > 0;
      if (canScroll) reset(node);
      node = node.parentElement;
    }

    [
      document.querySelector<HTMLElement>('.layout-content-scroll'),
      document.querySelector<HTMLElement>('.contentWrapper'),
      document.querySelector<HTMLElement>('mat-sidenav-content'),
      document.scrollingElement as HTMLElement | null,
      document.documentElement,
      document.body,
    ].forEach((el) => reset(el));

    window.scrollTo(0, 0);
  }

  scrollToElement(
    target: HTMLElement | null | undefined,
    margin = 16,
    behavior: ScrollBehavior = 'smooth',
  ): void {
    const el = this.resolveHost();
    if (!el) return;

    if (!target) {
      this.scrollToTop(behavior);
      return;
    }

    const destino = Math.max(
      0,
      el.scrollTop +
        target.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        margin,
    );

    if (behavior === 'auto') {
      el.scrollTop = destino;
      return;
    }

    el.scrollTo({ top: destino, left: 0, behavior: 'smooth' });
  }
}
