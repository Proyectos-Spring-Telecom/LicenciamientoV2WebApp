import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaLocalComercialComponent } from './lista-local-comercial.component';

describe('ListaLocalComercialComponent', () => {
  let component: ListaLocalComercialComponent;
  let fixture: ComponentFixture<ListaLocalComercialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListaLocalComercialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaLocalComercialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
