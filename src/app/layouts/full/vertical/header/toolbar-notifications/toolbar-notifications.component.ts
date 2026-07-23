import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface SymbologyItem {
  icon: string;
  name: string;
  colorClass: string;
  hint: string;
}

@Component({
  selector: 'app-toolbar-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './toolbar-notifications.component.html',
  styleUrls: ['./toolbar-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarNotificationsComponent implements OnInit, OnDestroy {
  estatusItems: SymbologyItem[] = [];
  predioItems: SymbologyItem[] = [];
  isOpen = false;
  showOnMapa = false;
  private routerEventsSub: Subscription;

  @HostBinding('style.display')
  get hostDisplay(): string {
    return this.showOnMapa ? 'flex' : 'none';
  }

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.updateMapaVisibility();
    this.cdr.markForCheck();
    this.routerEventsSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateMapaVisibility();
        if (!this.showOnMapa) {
          this.isOpen = false;
        }
        this.cdr.markForCheck();
      });

    this.estatusItems = [
      {
        icon: 'block',
        name: 'Rechazo o sin respuesta',
        colorClass: 'sym-item--rechazo',
        hint: 'El trámite fue rechazado o no hubo respuesta',
      },
      {
        icon: 'hourglass_top',
        name: 'Revisión',
        colorClass: 'sym-item--revision',
        hint: 'El local está en proceso de revisión',
      },
      {
        icon: 'warning_amber',
        name: 'Información faltante',
        colorClass: 'sym-item--faltante',
        hint: 'Faltan datos o documentos por completar',
      },
      {
        icon: 'verified',
        name: 'Datos correctos',
        colorClass: 'sym-item--correcto',
        hint: 'La información del establecimiento es correcta',
      },
    ];

    this.predioItems = [
      {
        icon: 'build',
        name: 'En obra',
        colorClass: 'sym-item--obra',
        hint: 'Predio en construcción (icono especial en el mapa)',
      },
    ];
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showOnMapa || !this.isOpen) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && !target.closest('app-toolbar-notifications')) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  }

  private updateMapaVisibility(): void {
    const url = this.router.url.split('?')[0].split('#')[0];
    this.showOnMapa = url === '/monitoreo' || url.startsWith('/monitoreo/');
  }
}
