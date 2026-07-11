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

@Component({
  selector: 'app-toolbar-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './toolbar-notifications.component.html',
  styleUrls: ['./toolbar-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarNotificationsComponent implements OnInit, OnDestroy {
  notifications: Array<{ icon: string; name: string; color: string; hint: string }> = [];
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
    this.notifications = [
      {
        icon: 'no_sim',
        name: 'Rechazo o sin respuesta',
        color: 'button',
        hint: '',
      },
      {
        icon: 'history',
        name: 'Revisión',
        color: 'button_revision',
        hint: '',
      },
      {
        icon: 'new_releases',
        name: 'Información Faltante',
        color: 'button_faltante',
        hint: '',
      },
      {
        icon: 'thumb_up',
        name: 'Datos Correctos',
        color: 'button_correcto',
        hint: '',
      },
    ];
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  onClickOutside(): void {
    this.isOpen = false;
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
    this.showOnMapa = url === '/monitoreo/mapa' || url.startsWith('/monitoreo/mapa/');
  }
}
