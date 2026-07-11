import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-monitoreo',
  templateUrl: './monitoreo.component.html',
  styleUrls: ['./monitoreo.component.scss'],
  standalone: false,
})
export class MonitoreoComponent implements OnInit {
  public mensajeModulo = 'Monitoreo';

  ngOnInit(): void {}
}
