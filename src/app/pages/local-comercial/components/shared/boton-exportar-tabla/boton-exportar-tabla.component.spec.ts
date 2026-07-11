import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotonExportarTablaComponent } from './boton-exportar-tabla.component';

describe('BotonExportarTablaComponent', () => {
  let component: BotonExportarTablaComponent;
  let fixture: ComponentFixture<BotonExportarTablaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BotonExportarTablaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BotonExportarTablaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
