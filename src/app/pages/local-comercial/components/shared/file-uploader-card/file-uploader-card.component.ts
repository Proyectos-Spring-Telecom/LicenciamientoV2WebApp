import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-file-uploader-card',
  templateUrl: './file-uploader-card.component.html',
  styleUrls: ['./file-uploader-card.component.scss']
})
export class FileUploaderCardComponent implements OnChanges, OnDestroy {
  /** Imágenes solo PNG/JPG/JPEG + PDF. */
  static readonly ACCEPT_IMAGEN_PDF =
    'image/png,image/jpeg,.png,.jpg,.jpeg,.pdf,application/pdf';
  static readonly BADGE_IMAGEN_PDF = 'PNG · JPG · JPEG · PDF · Máx. 3 MB';
  private static readonly EXT_IMAGEN = new Set(['png', 'jpg', 'jpeg']);
  private static readonly MIME_IMAGEN = new Set(['image/png', 'image/jpeg']);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() label = '';
  /** Se mantiene por compatibilidad; el picker siempre usa imagen + PDF. */
  @Input() accept = FileUploaderCardComponent.ACCEPT_IMAGEN_PDF;
  @Input() uploadTitle = 'Sube imagen o PDF';
  @Input() icon = 'cloud_upload';
  @Input() badgeDefault = FileUploaderCardComponent.BADGE_IMAGEN_PDF;
  @Input() remoteUrl: string | null = null;
  @Input() allowPdf = true;
  @Input() colorVariant: 'success' | 'primary' | 'warning' | 'danger' | string = 'primary';

  readonly acceptImagenPdf = FileUploaderCardComponent.ACCEPT_IMAGEN_PDF;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRejected = new EventEmitter<void>();
  @Output() remoteFileClick = new EventEmitter<{ url: string; fileName: string }>();

  dragging = false;
  selectedFileName = '';
  private localPreviewUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['remoteUrl'] && this.remoteUrl?.trim() && !this.selectedFileName) {
      // Archivo remoto (editar): limpia preview local previa
      this.revocarLocalPreview();
    }
  }

  ngOnDestroy(): void {
    this.revocarLocalPreview();
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(_event: DragEvent): void {
    this.dragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  etiquetaBadge(): string {
    if (!this.tieneArchivoEnBadge()) {
      return this.badgeDefault;
    }
    return this.esArchivoImagen() ? 'Ver imagen' : 'Ver archivo';
  }

  urlVistaPrevia(): string | null {
    if (this.localPreviewUrl) {
      return this.localPreviewUrl;
    }
    const url = this.remoteUrl?.trim();
    return url ? url : null;
  }

  /** @deprecated usar urlVistaPrevia */
  urlRemota(): string | null {
    return this.urlVistaPrevia();
  }

  tieneArchivoEnBadge(): boolean {
    return !!this.selectedFileName || !!this.remoteUrl?.trim() || !!this.localPreviewUrl;
  }

  labelColorClass(): string {
    return `uploader-label--${this.colorVariant}`;
  }

  badgeFileColorClass(): string {
    return `uploader__badge--file-${this.colorVariant}`;
  }

  onBadgeClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const url = this.urlVistaPrevia();
    if (!url) {
      return;
    }
    this.remoteFileClick.emit({
      url,
      fileName: this.selectedFileName || this.extraerNombreDesdeUrl(url),
    });
  }

  private handleFile(file: File): void {
    if (!this.isAllowed(file)) {
      this.fileRejected.emit();
      return;
    }
    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.fileRejected.emit();
      return;
    }
    this.selectedFileName = file.name;
    this.revocarLocalPreview();
    this.localPreviewUrl = URL.createObjectURL(file);
    this.fileSelected.emit(file);
  }

  private esArchivoImagen(): boolean {
    const fuente = this.selectedFileName || this.urlVistaPrevia() || '';
    if (!fuente) {
      return true;
    }
    const extension = fuente.split('?')[0].split(/[/\\]/).pop()?.split('.').pop()?.toLowerCase() ?? '';
    if (extension === 'pdf') {
      return false;
    }
    if (FileUploaderCardComponent.EXT_IMAGEN.has(extension)) {
      return true;
    }
    // blob: o URL sin extensión → imagen (fotos del catálogo)
    return !fuente.toLowerCase().includes('.pdf');
  }

  private isAllowed(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (FileUploaderCardComponent.EXT_IMAGEN.has(extension)) {
      return true;
    }
    if (FileUploaderCardComponent.MIME_IMAGEN.has(file.type)) {
      return true;
    }
    return this.allowPdf && (file.type === 'application/pdf' || extension === 'pdf');
  }

  private extraerNombreDesdeUrl(url: string): string {
    const sinQuery = url.split('?')[0];
    const segmentos = sinQuery.split(/[/\\]/);
    return segmentos[segmentos.length - 1] || this.label || 'Archivo';
  }

  private revocarLocalPreview(): void {
    if (this.localPreviewUrl) {
      URL.revokeObjectURL(this.localPreviewUrl);
      this.localPreviewUrl = null;
    }
  }
}
