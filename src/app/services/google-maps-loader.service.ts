/// <reference types="google.maps" />

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    __nextGoogleMapsLoadPromise?: Promise<void>;
    __nextGoogleMapsInit?: () => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  /** Carga Google Maps una sola vez; si ya está en la página no lo vuelve a descargar. */
  load(apiKey?: string): Promise<void> {
    if (!window.__nextGoogleMapsLoadPromise) {
      window.__nextGoogleMapsLoadPromise = this.bootstrap(apiKey);
    }
    return window.__nextGoogleMapsLoadPromise;
  }

  /** Valida la llave, inserta el script si falta y trae la librería del mapa. */
  private async bootstrap(apiKey?: string): Promise<void> {
    const key = String(apiKey ?? environment.googleMapsApiKey ?? '').trim();
    if (!key) {
      throw new Error('googleMapsApiKey no configurada en environment');
    }

    if (typeof google === 'undefined' || typeof google.maps?.importLibrary !== 'function') {
      await this.injectScript(key);
    }

    await google.maps.importLibrary('maps');
    await google.maps.importLibrary('places');
    await google.maps.importLibrary('streetView');
  }

  /** Agrega el script de Google Maps al HTML de la página. */
  private injectScript(key: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (existing) {
        const waitForBootstrap = (): void => {
          if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
            resolve();
            return;
          }
          window.setTimeout(waitForBootstrap, 50);
        };
        waitForBootstrap();
        return;
      }

      window.__nextGoogleMapsInit = () => {
        delete window.__nextGoogleMapsInit;
        resolve();
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=__nextGoogleMapsInit`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
      document.head.appendChild(script);
    });
  }
}
