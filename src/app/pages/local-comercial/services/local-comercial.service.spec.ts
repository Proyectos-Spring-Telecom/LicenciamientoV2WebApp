import { TestBed } from '@angular/core/testing';

import { LocalComercialService } from './local-comercial.service';

describe('LocalComercialService', () => {
  let service: LocalComercialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalComercialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
