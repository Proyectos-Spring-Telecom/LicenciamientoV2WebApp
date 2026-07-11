/// <reference types="google.maps" />

import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';

export interface SeleccionUbicacionData {
  lat?: number | string;
  lng?: number | string;
}

export interface SeleccionUbicacionResult {
  lat: number;
  lng: number;
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

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private mapClickListener: google.maps.MapsEventListener | null = null;
  private markerDragListener: google.maps.MapsEventListener | null = null;

  constructor(
    private dialogRef: MatDialogRef<SeleccionUbicacionModalComponent, SeleccionUbicacionResult>,
    private googleMapsLoader: GoogleMapsLoaderService,
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
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    if (this.markerPosition) {
      this.dialogRef.close({
        lat: this.markerPosition.lat,
        lng: this.markerPosition.lng
      });
    }
  }

  private async initMap(): Promise<void> {
    try {
      await this.googleMapsLoader.load();
    } catch {
      return;
    }

    const mapEl = this.mapContainer?.nativeElement;
    if (!mapEl) {
      return;
    }

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
        this.setMarkerPosition(event.latLng.toJSON());
      }
    });

    if (this.markerPosition) {
      this.createOrUpdateMarker(this.markerPosition);
    }

    setTimeout(() => this.refreshMap(), 350);
  }

  private setMarkerPosition(position: google.maps.LatLngLiteral): void {
    this.markerPosition = position;
    this.createOrUpdateMarker(position);
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
          this.markerPosition = event.latLng.toJSON();
        }
      });
      return;
    }

    this.marker.setPosition(position);
    this.marker.setMap(this.map);
  }

  private refreshMap(): void {
    if (!this.map) {
      return;
    }
    google.maps.event.trigger(this.map, 'resize');
    this.map.setCenter(this.markerPosition || this.center);
  }
}