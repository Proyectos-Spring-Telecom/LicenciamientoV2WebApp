import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { esRutaArchivoValida } from '../../../utils/documentos-local.config';

export interface SubirDocumentoData {
  titulo: string;
  controlName: string;
  urlExistente?: string | null;
  licenciaCargada?: boolean;
  soloLectura?: boolean;
}

@Component({
  selector: 'app-subir-documento-modal',
  standalone: false,
  templateUrl: './subir-documento-modal.component.html',
  styleUrls: ['./subir-documento-modal.component.css']
})
export class SubirDocumentoModalComponent implements OnInit, OnDestroy {
  archivoSeleccionado: File | null = null;
  previewUrl: SafeUrl | null = null;
  nombreArchivo = '';
  sinArchivoRegistrado = false;
  documentoPdfExistente = false;
  urlDocumentoExistente: string | null = null;
  private blobUrl: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<SubirDocumentoModalComponent, File | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: SubirDocumentoData,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const ruta = esRutaArchivoValida(this.data.urlExistente)
      ? this.data.urlExistente!.trim()
      : null;

    if (!ruta) {
      this.sinArchivoRegistrado = !!this.data.licenciaCargada;
      return;
    }

    this.nombreArchivo = this.extraerNombreArchivo(ruta);

    if (this.esPdf(ruta)) {
      this.documentoPdfExistente = true;
      this.urlDocumentoExistente = ruta;
      return;
    }

    this.establecerVistaPrevia(ruta, false);
  }

  ngOnDestroy(): void {
    this.revocarBlobUrl();
  }

  get tieneVistaPrevia(): boolean {
    return !!this.previewUrl;
  }

  get mostrarEstadoVacio(): boolean {
    return !this.tieneVistaPrevia && !this.documentoPdfExistente;
  }

  get mensajeSinArchivo(): string {
    return this.sinArchivoRegistrado
      ? 'Sin archivo adjunto'
      : 'Aquí se mostrará su documento';
  }

  get textoBotonSeleccion(): string {
    return this.sinArchivoRegistrado || this.tieneVistaPrevia || this.documentoPdfExistente
      ? 'Cambiar archivo'
      : 'Seleccionar archivo';
  }

  get esSoloLectura(): boolean {
    return !!this.data.soloLectura;
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!this.esArchivoPermitido(file)) {
      input.value = '';
      return;
    }

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
    this.sinArchivoRegistrado = false;
    this.documentoPdfExistente = false;
    this.urlDocumentoExistente = null;
    this.generarVistaPrevia(file);
  }

  onErrorVistaPrevia(): void {
    this.establecerVistaPrevia(null, false);
    this.sinArchivoRegistrado = true;
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  subir(): void {
    if (this.archivoSeleccionado) {
      this.dialogRef.close(this.archivoSeleccionado);
    }
  }

  private generarVistaPrevia(file: File): void {
    if (this.esImagen(file)) {
      const url = URL.createObjectURL(file);
      this.establecerVistaPrevia(url, true);
      return;
    }

    if (this.esPdf(file.name)) {
      this.documentoPdfExistente = true;
      this.establecerVistaPrevia(null, true);
      return;
    }

    this.establecerVistaPrevia(null, true);
  }

  private esImagen(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg'].includes(extension)) {
      return true;
    }
    return file.type === 'image/png' || file.type === 'image/jpeg';
  }

  private esArchivoPermitido(file: File): boolean {
    return this.esImagen(file) || this.esPdf(file.name) || file.type === 'application/pdf';
  }

  private esPdf(valor: string): boolean {
    return valor.toLowerCase().split('?')[0].endsWith('.pdf');
  }

  private extraerNombreArchivo(ruta: string): string {
    const sinQuery = ruta.split('?')[0];
    const segmentos = sinQuery.split(/[/\\]/);
    return segmentos[segmentos.length - 1] || this.data.titulo;
  }

  private establecerVistaPrevia(url: string | null, revocarAnterior: boolean): void {
    if (revocarAnterior) {
      this.revocarBlobUrl();
    }

    if (!url) {
      this.blobUrl = null;
      this.previewUrl = null;
      return;
    }

    this.blobUrl = url.startsWith('blob:') ? url : null;
    this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(url);
  }

  private revocarBlobUrl(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
