import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-file-uploader-card',
  templateUrl: './file-uploader-card.component.html',
  styleUrls: ['./file-uploader-card.component.scss']
})
export class FileUploaderCardComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() label = '';
  @Input() accept = 'image/*,.pdf';
  @Input() uploadTitle = 'Sube archivo';
  @Input() icon = 'cloud_upload';
  @Input() badgeDefault = 'PNG · JPG · WEBP · PDF · Máx. 3 MB';
  @Input() remoteUrl: string | null = null;
  @Input() allowPdf = true;
  @Input() colorVariant: 'success' | 'primary' | 'warning' | 'danger' | string = 'primary';

  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRejected = new EventEmitter<void>();
  @Output() remoteFileClick = new EventEmitter<{ url: string; fileName: string }>();

  dragging = false;
  selectedFileName = '';

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
    if (this.selectedFileName) {
      return this.selectedFileName;
    }
    const url = this.urlRemota();
    if (url) {
      return this.extraerNombreDesdeUrl(url);
    }
    return this.badgeDefault;
  }

  urlRemota(): string | null {
    if (this.selectedFileName) {
      return null;
    }
    const url = this.remoteUrl?.trim();
    return url ? url : null;
  }

  tieneArchivoEnBadge(): boolean {
    return !!this.selectedFileName || !!this.urlRemota();
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
    const url = this.urlRemota();
    if (!url) {
      return;
    }
    this.remoteFileClick.emit({
      url,
      fileName: this.etiquetaBadge(),
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
    this.fileSelected.emit(file);
  }

  private isAllowed(file: File): boolean {
    if (file.type.startsWith('image/')) {
      return true;
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'jfif', 'pjpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return true;
    }
    return this.allowPdf && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
  }

  private extraerNombreDesdeUrl(url: string): string {
    const sinQuery = url.split('?')[0];
    const segmentos = sinQuery.split(/[/\\]/);
    return segmentos[segmentos.length - 1] || this.label || 'Archivo';
  }
}
