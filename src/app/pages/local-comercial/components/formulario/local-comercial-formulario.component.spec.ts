import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalComercialFormularioComponent } from './local-comercial-formulario.component';

describe('LocalComercialFormularioComponent', () => {
  let component: LocalComercialFormularioComponent;
  let fixture: ComponentFixture<LocalComercialFormularioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalComercialFormularioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalComercialFormularioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
