/// <reference types="google.maps" />

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    __nextGoogleMapsLoadPromise?: Promise<void>;
    __nextGoogleMapsInit?: () => void;
  }
}

export type GoogleMapsLibrary = 'maps' | 'places' | 'streetView' | 'geocoding';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  /**
   * Carga el script una sola vez y luego importa solo las librerías pedidas.
   * `importLibrary` es cacheado por Google; pedir de más no vuelve a bajar el script.
   */
  load(
    apiKey?: string,
    libraries: GoogleMapsLibrary[] = ['maps', 'places', 'streetView', 'geocoding'],
  ): Promise<void> {
    if (!window.__nextGoogleMapsLoadPromise) {
      window.__nextGoogleMapsLoadPromise = this.ensureScript(apiKey);
    }

    return window.__nextGoogleMapsLoadPromise.then(async () => {
      await Promise.all(libraries.map((lib) => google.maps.importLibrary(lib)));
    });
  }

  private async ensureScript(apiKey?: string): Promise<void> {
    const key = String(apiKey ?? environment.googleMapsApiKey ?? '').trim();
    if (!key) {
      throw new Error('googleMapsApiKey no configurada en environment');
    }

    if (typeof google !== 'undefined' && typeof google.maps?.importLibrary === 'function') {
      return;
    }

    await this.injectScript(key);
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
