import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MonitoreoSidebarBridgeService {
  private readonly toggleRequest$ = new Subject<void>();
  readonly sidebarToggleRequested$ = this.toggleRequest$.asObservable();

  requestSidebarToggle(): void {
    this.toggleRequest$.next();
  }
}
