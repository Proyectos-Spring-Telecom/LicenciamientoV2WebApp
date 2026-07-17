import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SepomexCodigoPostal } from '../models/sepomex-codigo-postal';

@Injectable({
  providedIn: 'root',
})
export class SepomexService {
  private readonly baseUrl = 'https://spcode.ddns.net/api-sepomex/api-sepomex';

  constructor(private http: HttpClient) {}

  obtenerPorCp(cp: string): Observable<SepomexCodigoPostal> {
    const codigo = String(cp ?? '').replace(/\D/g, '').slice(0, 5);
    return this.http.get<SepomexCodigoPostal>(
      `${this.baseUrl}/codigos-postales/${codigo}`
    );
  }
}
