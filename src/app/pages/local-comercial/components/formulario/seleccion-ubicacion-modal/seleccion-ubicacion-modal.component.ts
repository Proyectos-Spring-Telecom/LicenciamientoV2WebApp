/// <reference types="google.maps" />

import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';

export interface SeleccionUbicacionData {
  lat?: number | string;
  lng?: number | string;
}

export interface SeleccionUbicacionResult {
  lat: number;
  lng: number;
  direccion?: string;
}

const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 18.92506594438654,
  lng: -99.22440748392435
};

const MARKER_ASPECT_RATIO = 739 / 1067;
const MARKER_DISPLAY_HEIGHT = 54;
const MARKER_DISPLAY_WIDTH = Math.round(MARKER_DISPLAY_HEIGHT * MARKER_ASPECT_RATIO);
const MARKER_PRIMARY_URL = 'assets/images/logos/marker_primary.png';

const MAP_STYLES_SIN_ESTABLECIMIENTOS: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

@Component({
  selector: 'app-seleccion-ubicacion-modal',
  standalone: false,
  templateUrl: './seleccion-ubicacion-modal.component.html',
  styleUrls: ['./seleccion-ubicacion-modal.component.scss']
})
export class SeleccionUbicacionModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  center: google.maps.LatLngLiteral;
  zoom = 14;
  markerPosition: google.maps.LatLngLiteral | null = null;
  direccionSeleccionada = '';
  resolviendoDireccion = false;

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private mapClickListener: google.maps.MapsEventListener | null = null;
  private markerDragListener: google.maps.MapsEventListener | null = null;
  private geocodeRequestId = 0;
  private readonly direccionCache = new Map<string, string>();

  constructor(
    private dialogRef: MatDialogRef<SeleccionUbicacionModalComponent, SeleccionUbicacionResult>,
    private googleMapsLoader: GoogleMapsLoaderService,
    private ngZone: NgZone,
    @Inject(MAT_DIALOG_DATA) data: SeleccionUbicacionData
  ) {
    const lat = parseFloat(String(data?.lat ?? ''));
    const lng = parseFloat(String(data?.lng ?? ''));

    if (!isNaN(lat) && !isNaN(lng)) {
      this.center = { lat, lng };
      this.markerPosition = { lat, lng };
    } else {
      this.center = { ...DEFAULT_CENTER };
    }
  }

  ngAfterViewInit(): void {
    void this.initMap();
  }

  ngOnDestroy(): void {
    this.mapClickListener?.remove();
    this.markerDragListener?.remove();
    this.marker = null;
    this.map = null;
    this.geocoder = null;
  }

  get etiquetaDireccion(): string {
    if (this.direccionSeleccionada) {
      return this.direccionSeleccionada;
    }
    if (this.resolviendoDireccion) {
      return 'Obteniendo dirección...';
    }
    return 'Dirección no disponible';
  }

  cancelar(): void {
    this.cerrarConAnimacion();
  }

  confirmar(): void {
    if (!this.markerPosition) {
      return;
    }
    this.cerrarConAnimacion({
      lat: this.markerPosition.lat,
      lng: this.markerPosition.lng,
      direccion: this.direccionSeleccionada || undefined,
    });
  }

  private cerrarConAnimacion(result?: SeleccionUbicacionResult): void {
    const pane = document.querySelector(
      '.cdk-overlay-pane.ubicacion-modal-panel--animated'
    ) as HTMLElement | null;
    const backdrop = document.querySelector(
      '.cdk-overlay-backdrop'
    ) as HTMLElement | null;

    pane?.classList.add('ubicacion-modal-panel--leaving');
    backdrop?.classList.add('ubicacion-modal-backdrop--leaving');

    window.setTimeout(() => this.dialogRef.close(result), 280);
  }

  private async initMap(): Promise<void> {
    try {
      await this.googleMapsLoader.load();
      await google.maps.importLibrary('geocoding');
    } catch {
      return;
    }

    const mapEl = this.mapContainer?.nativeElement;
    if (!mapEl) {
      return;
    }

    this.geocoder = new google.maps.Geocoder();

    this.map = new google.maps.Map(mapEl, {
      center: this.markerPosition || this.center,
      zoom: this.zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
      styles: MAP_STYLES_SIN_ESTABLECIMIENTOS,
    });

    this.mapClickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.ngZone.run(() => this.setMarkerPosition(event.latLng!.toJSON()));
      }
    });

    if (this.markerPosition) {
      this.createOrUpdateMarker(this.markerPosition);
      this.resolverDireccion(this.markerPosition);
    }

    setTimeout(() => this.refreshMap(), 350);
  }

  private setMarkerPosition(position: google.maps.LatLngLiteral): void {
    this.markerPosition = position;
    this.createOrUpdateMarker(position);
    this.resolverDireccion(position);
  }

  private createOrUpdateMarker(position: google.maps.LatLngLiteral): void {
    if (!this.map) {
      return;
    }

    const icon: google.maps.Icon = {
      url: MARKER_PRIMARY_URL,
      scaledSize: new google.maps.Size(MARKER_DISPLAY_WIDTH, MARKER_DISPLAY_HEIGHT),
      anchor: new google.maps.Point(MARKER_DISPLAY_WIDTH / 2, MARKER_DISPLAY_HEIGHT),
    };

    if (!this.marker) {
      this.marker = new google.maps.Marker({
        map: this.map,
        position,
        draggable: true,
        icon,
      });
      this.markerDragListener = this.marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          this.ngZone.run(() => this.setMarkerPosition(event.latLng!.toJSON()));
        }
      });
      return;
    }

    this.marker.setPosition(position);
    this.marker.setMap(this.map);
  }

  private resolverDireccion(position: google.maps.LatLngLiteral): void {
    const cacheKey = this.cacheKey(position);
    const cached = this.direccionCache.get(cacheKey);
    if (cached) {
      this.direccionSeleccionada = cached;
      this.resolviendoDireccion = false;
      return;
    }

    const requestId = ++this.geocodeRequestId;
    this.resolviendoDireccion = true;

    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    this.geocoder.geocode(
      {
        location: position,
        language: 'es',
        region: 'mx',
      },
      (results, status) => {
        this.ngZone.run(() => {
          if (requestId !== this.geocodeRequestId) {
            return;
          }

          this.resolviendoDireccion = false;

          if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
            if (!this.direccionSeleccionada) {
              this.direccionSeleccionada = '';
            }
            return;
          }

          const direccion = this.extraerDireccionRapida(results);
          if (direccion) {
            this.direccionSeleccionada = direccion;
            this.direccionCache.set(cacheKey, direccion);
          }
        });
      }
    );
  }

  /** Prefiere resultado corto (calle + colonia + ciudad) para pintar más rápido. */
  private extraerDireccionRapida(results: google.maps.GeocoderResult[]): string {
    const preferidos = results.find((r) =>
      r.types?.some((t) => t === 'street_address' || t === 'route' || t === 'premise')
    ) ?? results[0];

    const corta = this.armarDireccionCorta(preferidos);
    if (corta) {
      return corta;
    }
    return preferidos.formatted_address?.trim() || results[0].formatted_address?.trim() || '';
  }

  private armarDireccionCorta(result: google.maps.GeocoderResult): string {
    const comps = result.address_components || [];
    const get = (...types: string[]) =>
      comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name?.trim() || '';

    const calle = get('route');
    const numero = get('street_number');
    const colonia = get('sublocality_level_1', 'sublocality', 'neighborhood');
    const ciudad = get('locality', 'administrative_area_level_2');
    const estado = get('administrative_area_level_1');

    const via = [calle, numero].filter(Boolean).join(' ');
    const partes = [via, colonia, ciudad, estado].filter(Boolean);
    return partes.join(', ');
  }

  private cacheKey(position: google.maps.LatLngLiteral): string {
    return `${position.lat.toFixed(5)},${position.lng.toFixed(5)}`;
  }

  private refreshMap(): void {
    if (!this.map) {
      return;
    }
    google.maps.event.trigger(this.map, 'resize');
    this.map.setCenter(this.markerPosition || this.center);
  }
}
