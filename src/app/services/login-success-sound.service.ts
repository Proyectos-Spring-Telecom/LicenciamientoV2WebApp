import { Injectable, signal } from '@angular/core';

/** Resaltado del hub de notificaciones tras login (sin sonido). */
@Injectable({ providedIn: 'root' })
export class LoginSuccessSoundService {
  /** Activo ~10 s: solo pausa animaciones del hub (sin cambiar aspecto visual). */
  readonly highlightNotificaciones = signal(false);

  private endTimer: ReturnType<typeof setTimeout> | null = null;

  play(durationMs = 10_000): void {
    this.stopInternal();
    this.setHighlight(true);
    this.endTimer = setTimeout(() => this.finishPlay(), durationMs);
  }

  stop(): void {
    this.setHighlight(false);
    this.stopInternal();
  }

  private finishPlay(): void {
    this.setHighlight(false);
    this.stopInternal();
  }

  private setHighlight(active: boolean): void {
    this.highlightNotificaciones.set(active);
  }

  private stopInternal(): void {
    if (this.endTimer != null) {
      clearTimeout(this.endTimer);
      this.endTimer = null;
    }
  }
}
